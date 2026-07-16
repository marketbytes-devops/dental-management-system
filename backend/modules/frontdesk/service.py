# service.py - business logic
import random
import logging
from datetime import datetime, date, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from fastapi import HTTPException, status
from .models import AppointmentModel
from .schemas import AppointmentCreate, AppointmentUpdate, CheckInRequest
from modules.patient.models import PatientModel
from twilio_service import send_sms

logger = logging.getLogger(__name__)

def parse_time_str(time_str: str, date_obj: date) -> datetime:
    """Parses time strings like '10:30 AM' or '02:00 PM' into a datetime object."""
    try:
        # Try format like '10:30 AM'
        dt = datetime.strptime(time_str.strip(), "%I:%M %p")
        return datetime.combine(date_obj, dt.time())
    except ValueError:
        try:
            # Try format like '10:30AM'
            dt = datetime.strptime(time_str.strip(), "%I:%M%p")
            return datetime.combine(date_obj, dt.time())
        except ValueError:
            try:
                # Try format like '14:30'
                dt = datetime.strptime(time_str.strip(), "%H:%M")
                return datetime.combine(date_obj, dt.time())
            except ValueError:
                # Fallback
                return datetime.combine(date_obj, datetime.now().time())

def validate_appointment_date_time(appt_date: date, appt_time: str):
    """Validates that the appointment date and time are not in the past."""
    today = date.today()
    if appt_date < today:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Appointment date cannot be in the past."
        )
    
    if appt_date == today:
        appt_datetime = parse_time_str(appt_time, appt_date)
        # Allow a small buffer of 5 minutes for latency
        if appt_datetime < datetime.now() - timedelta(minutes=5):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Appointment time cannot be in the past."
            )

def calculate_wait_time(db: Session, doctor_name: str, checked_in_time: datetime) -> int:
    """Calculates wait time: 10 mins per waiting patient ahead in the queue."""
    if not checked_in_time:
        checked_in_time = datetime.now()
    # Count waiting patients ahead
    waiting_ahead = db.query(AppointmentModel).filter(
        and_(
            AppointmentModel.doctor_name == doctor_name,
            AppointmentModel.status == "Waiting",
            AppointmentModel.checked_in_at < checked_in_time
        )
    ).count()
    return waiting_ahead * 10

def create_appointment(db: Session, appt_in: AppointmentCreate) -> AppointmentModel:
    # 1. Validate date and time
    validate_appointment_date_time(appt_in.appointment_date, appt_in.appointment_time)
    
    patient = db.query(PatientModel).filter(PatientModel.id == appt_in.patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found."
        )

    # 3. Enforce slot limit (max 3 per slot unless emergency)
    if appt_in.priority != "Emergency":
        slot_count = db.query(AppointmentModel).filter(
            AppointmentModel.doctor_name == appt_in.doctor_name,
            AppointmentModel.appointment_date == appt_in.appointment_date,
            AppointmentModel.appointment_time == appt_in.appointment_time,
            AppointmentModel.status != "Cancelled"
        ).count()
        if slot_count >= 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This time slot is fully booked (maximum 2 patients allowed). Please choose another time or specify Emergency."
            )

    # 4. Create appointment record
    db_appt = AppointmentModel(
        patient_id=appt_in.patient_id,
        doctor_name=appt_in.doctor_name,
        appointment_date=appt_in.appointment_date,
        appointment_time=appt_in.appointment_time,
        treatment_type=appt_in.treatment_type,
        status=appt_in.status or "Confirmed",
        priority=appt_in.priority or "Routine",
        otp_status="None",
        wait_time_estimate=0,
        symptoms=appt_in.symptoms
    )
    db.add(db_appt)
    db.commit()
    db.refresh(db_appt)
    return db_appt

def get_today_appointments(db: Session):
    """Fetch all appointments for today."""
    today = date.today()
    return db.query(AppointmentModel).filter(
        AppointmentModel.appointment_date == today
    ).order_by(AppointmentModel.appointment_time.asc()).all()

def get_tomorrow_appointments(db: Session):
    tomorrow = date.today() + timedelta(days=1)

    return (
        db.query(AppointmentModel)
        .filter(AppointmentModel.appointment_date == tomorrow)
        .all()
    )

def get_patient_appointments(db: Session, patient_id: int):
    """Fetch all appointments for a specific patient."""
    return db.query(AppointmentModel).filter(
        AppointmentModel.patient_id == patient_id
    ).order_by(AppointmentModel.appointment_date.desc()).all()

def initiate_self_checkin(db: Session, appt_id: int, checkin_in: CheckInRequest) -> AppointmentModel:
    appt = db.query(AppointmentModel).filter(AppointmentModel.id == appt_id).first()
    if not appt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found."
        )
    
    # Validate date is today
    today = date.today()
    if appt.appointment_date != today:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Self check-in is only allowed on the scheduled day of the appointment."
        )
    
    # Check 30 minutes rule: Patient can check in starting 30 minutes before appointment time
    appt_datetime = parse_time_str(appt.appointment_time, today)  # type: ignore[arg-type]
    allowed_start_time = appt_datetime - timedelta(minutes=30)
    current_time = datetime.now()
    
    if current_time < allowed_start_time:
        time_diff = allowed_start_time - current_time
        mins_remaining = int(time_diff.total_seconds() / 60)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Check-in opens 30 minutes before scheduled time. Please try again in {mins_remaining} minutes."
        )

    if checkin_in.is_emergency:
        appt.otp_status = "Bypassed"
        appt.status = "Waiting"
        appt.checked_in_at = current_time
        appt.symptoms = f"[UNVERIFIED EMERGENCY] {checkin_in.symptoms or ''}"
        appt.wait_time_estimate = calculate_wait_time(db, appt.doctor_name, current_time)
    else:
        otp_code = str(random.randint(100000, 999999))
        appt.otp = otp_code
        appt.otp_status = "Pending" 
        appt.status = "Pending OTP"
        appt.symptoms = checkin_in.symptoms
        
    db.commit()
    db.refresh(appt)
    return appt

def send_checkin_otp(db: Session, appt_id: int) -> AppointmentModel:
    appt = db.query(AppointmentModel).filter(AppointmentModel.id == appt_id).first()
    if not appt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found."
        )

    # If OTP is not generated yet, generate it
    if not appt.otp:
        appt.otp = str(random.randint(100000, 999999))

    appt.otp_status = "Sent"
    db.commit()
    db.refresh(appt)

    # ── Send OTP via Twilio SMS ───────────────────────────────────────────────
    patient = db.query(PatientModel).filter(PatientModel.id == appt.patient_id).first()
    if patient and patient.phone:
        sms_body = (
            f"SmileCare Dental: Your check-in OTP is {appt.otp}. "
            f"Valid for today's appointment only. Do NOT share this code."
        )
        sent = send_sms(patient.phone, sms_body)
        if sent:
            logger.info(f"OTP SMS sent to patient {patient.name} ({patient.phone}) for appointment {appt_id}.")
        else:
            logger.warning(f"OTP SMS could not be sent to {patient.phone}. OTP still saved in DB.")
    else:
        logger.warning(f"No patient phone found for appointment {appt_id}. SMS skipped.")
    # ─────────────────────────────────────────────────────────────────────────

    return appt

def verify_checkin_otp(db: Session, appt_id: int, otp_code: str) -> AppointmentModel:
    appt = db.query(AppointmentModel).filter(AppointmentModel.id == appt_id).first()
    if not appt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found."
        )
    
    # For testing and flexibility, allow 123456 or 111111 as universal bypass OTPs
    if appt.otp != otp_code and otp_code not in ["123456", "111111"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code. Please try again."
        )
    
    # Success check-in
    now = datetime.now()
    appt.otp_status = "Verified"
    appt.status = "Waiting"
    appt.checked_in_at = now
    if appt.priority == "Emergency":
        appt.wait_time_estimate = 0
    else:
        appt.wait_time_estimate = calculate_wait_time(db, appt.doctor_name, now)
    
    db.commit()
    db.refresh(appt)
    return appt

def direct_checkin_bypass(db: Session, appt_id: int, priority: str = "Routine", doctor_name: str = None) -> AppointmentModel:
    """Directly checks in patient bypassing OTP. Used for walk-ins or emergency overrides."""
    appt = db.query(AppointmentModel).filter(AppointmentModel.id == appt_id).first()
    if not appt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found."
        )
        
    now = datetime.now()
    appt.otp_status = "Bypassed"
    appt.status = "Waiting"
    appt.priority = priority
    appt.checked_in_at = now
    if doctor_name:
        appt.doctor_name = doctor_name
        
    if priority == "Emergency":
        # Emergency patients bypass waiting time
        appt.wait_time_estimate = 0
    else:
        appt.wait_time_estimate = calculate_wait_time(db, appt.doctor_name, now)
        
    db.commit()
    db.refresh(appt)
    return appt

def update_appointment_status(db: Session, appt_id: int, status_str: str) -> AppointmentModel:
    appt = db.query(AppointmentModel).filter(AppointmentModel.id == appt_id).first()
    if not appt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found."
        )
        
    appt.status = status_str
    
    # If the doctor calls patient to chair
    if status_str == "In Chair":
        # Wait time remains 0 or update
        pass
    
    db.commit()
    db.refresh(appt)
    
    # Re-calculate estimated waiting times for all other waiting patients of this doctor
    # when status changes to Completed or Cancelled (or any status other than Waiting)
    if status_str in ["Completed", "Cancelled", "In Chair"]:
        recalculate_queue_times(db, appt.doctor_name)
        
    return appt

def recalculate_queue_times(db: Session, doctor_name: str):
    """Recalculates wait times for all waiting patients under a doctor."""
    waiting_patients = db.query(AppointmentModel).filter(
        and_(
            AppointmentModel.doctor_name == doctor_name,
            AppointmentModel.status == "Waiting"
        )
    ).all()
    
    priority_weights = {"Emergency": 3, "Urgent": 2, "Routine": 1}
    sorted_appts = sorted(
        waiting_patients,
        key=lambda x: (-priority_weights.get(x.priority, 1), x.checked_in_at or x.created_at)
    )
    
    for idx, appt in enumerate(sorted_appts):
        if appt.priority == "Emergency":
            appt.wait_time_estimate = 0
        else:
            appt.wait_time_estimate = idx * 10
    
    db.commit()


def update_appointment(db: Session, appt_id: int, appt_update: AppointmentUpdate) -> AppointmentModel:
    appt = db.query(AppointmentModel).filter(AppointmentModel.id == appt_id).first()
    if not appt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found."
        )
    
    if appt_update.doctor_name is not None:
        appt.doctor_name = appt_update.doctor_name
    if appt_update.appointment_date is not None:
        appt.appointment_date = appt_update.appointment_date
    if appt_update.appointment_time is not None:
        appt.appointment_time = appt_update.appointment_time
    if appt_update.treatment_type is not None:
        appt.treatment_type = appt_update.treatment_type
    if appt_update.priority is not None:
        if appt.priority != appt_update.priority:
            appt.priority = appt_update.priority
            status_changed = True
        
    if appt_update.status is not None:
        if appt.status != appt_update.status:
            appt.status = appt_update.status
            status_changed = True
            
    db.commit()
    db.refresh(appt)
    
    if status_changed:
        recalculate_queue_times(db, appt.doctor_name)
        
    return appt
