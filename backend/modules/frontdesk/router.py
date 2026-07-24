# router.py - all /frontdesk/* endpoints
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date,timedelta
from database import get_db
from .schemas import (
    TransactionResponse,
    AppointmentCreate,
    AppointmentResponse,
    AppointmentUpdate,
    CheckInRequest,
    OtpVerificationRequest,
    QueueItemResponse,
    PaymentRequest
)
from .models import AppointmentModel
from .communication_models import CommunicationLogModel
from .communication_schemas import CommunicationSendRequest, CommunicationLogResponse
from modules.patient.models import PatientModel, PatientNotificationModel
from modules.auth.models import UserModel
from modules.doctor.models import DoctorModel
from .service import (
    create_appointment,
    get_today_appointments,
    get_tomorrow_appointments,
    get_patient_appointments,
    initiate_self_checkin,
    send_checkin_otp,
    verify_checkin_otp,
    direct_checkin_bypass,
    update_appointment_status,
    process_consultation_payment,
    get_daily_transactions,
    auto_mark_missed_appointments
)
from dependencies import get_current_user

router = APIRouter(prefix="/frontdesk", tags=["frontdesk"])

@router.post("/appointments", response_model=AppointmentResponse)
def schedule_appointment(appt_in: AppointmentCreate, db: Session = Depends(get_db)):
    appt = create_appointment(db, appt_in=appt_in)
    appt.patient = db.query(PatientModel).filter(PatientModel.id == appt.patient_id).first()
    
    # Trigger patient notification
    if appt.patient:
        notif = PatientNotificationModel(
            patient_token=appt.patient.token,
            sender_role="receptionist",
            type="appointment",
            title="Appointment Confirmed",
            message=f"Your appointment with {appt.doctor_name} is scheduled on {appt.appointment_date} at {appt.appointment_time}.",
            read=False
        )
        db.add(notif)
        db.commit()
        
    return appt

@router.get("/appointments/today", response_model=List[AppointmentResponse])
def get_todays_appointments(db: Session = Depends(get_db)):
    auto_mark_missed_appointments(db)
    appointments = get_today_appointments(db)
    for appt in appointments:
        appt.patient = db.query(PatientModel).filter(PatientModel.id == appt.patient_id).first()
    return appointments

@router.get("/appointments/tomorrow", response_model=List[AppointmentResponse])
def get_tomorrows_appointments(db: Session = Depends(get_db)):
    auto_mark_missed_appointments(db)
    appointments = get_tomorrow_appointments(db)
    
    for appt in appointments:
        appt.patient = db.query(PatientModel).filter(
            PatientModel.id == appt.patient_id
        ).first()

    return appointments

@router.get("/appointments/patient/{patient_id}", response_model=List[AppointmentResponse])
def get_patient_appointments_route(patient_id: int, db: Session = Depends(get_db)):
    auto_mark_missed_appointments(db)
    appointments = get_patient_appointments(db, patient_id)
    for appt in appointments:
        appt.patient = db.query(PatientModel).filter(PatientModel.id == appt.patient_id).first()
    return appointments


@router.get("/appointments", response_model=List[AppointmentResponse])
def get_all_appointments(db: Session = Depends(get_db)):
    auto_mark_missed_appointments(db)
    appointments = db.query(AppointmentModel).order_by(AppointmentModel.appointment_date.desc()).all()
    for appt in appointments:
        appt.patient = db.query(PatientModel).filter(PatientModel.id == appt.patient_id).first()
    return appointments

@router.post("/appointments/{id}/mark-missed", response_model=AppointmentResponse)
def mark_appointment_missed_route(id: int, db: Session = Depends(get_db)):
    appt = update_appointment_status(db, appt_id=id, status_str="Missed")
    appt.patient = db.query(PatientModel).filter(PatientModel.id == appt.patient_id).first()
    return appt


@router.get("/records")
def get_patient_records(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    patients = db.query(PatientModel).order_by(PatientModel.name.asc()).all()
    
    records_list = []
    import datetime
    today = datetime.date.today()
    
    for p in patients:
        age = 30
        if p.date_of_birth:
            age = today.year - p.date_of_birth.year - (
                (today.month, today.day) < (p.date_of_birth.month, p.date_of_birth.day)
            )
            
        latest_appt = db.query(AppointmentModel).filter(
            AppointmentModel.patient_id == p.id
        ).order_by(AppointmentModel.appointment_date.desc()).first()
        
        diagnosis = "General Oral Examination"
        last_visit = "N/A"
        treatment_type = "Consultation"
        
        if latest_appt:
            treatment_type = latest_appt.treatment_type or "Consultation"
            diagnosis = latest_appt.symptoms or f"Treated for {treatment_type}"
            last_visit = latest_appt.appointment_date.strftime("%Y-%m-%d")
            
        files = []
        t_type_lower = treatment_type.lower()
        if "root canal" in t_type_lower:
            files = [f"XRay_RootCanal_{p.id}.jpg", "PreOp_Notes.pdf"]
        elif "scaling" in t_type_lower or "cleaning" in t_type_lower:
            files = ["Intraoral_Scan.jpg"]
        elif "extraction" in t_type_lower:
            files = [f"Extraction_XRay_{p.id}.jpg", "PostOp_Care_Instructions.pdf"]
        elif "filling" in t_type_lower:
            files = [f"Filling_Restoration_{p.id}.jpg"]
        elif "ortho" in t_type_lower:
            files = [f"Cephalometric_Analysis_{p.id}.jpg", "Treatment_Plan.pdf"]
        else:
            files = ["Patient_Intake_Form.pdf"]
            
        records_list.append({
            "id": f"REC-{p.id:03d}",
            "patient_id": p.id,
            "token": p.token,
            "name": p.name,
            "age": age,
            "diagnosis": diagnosis,
            "lastVisit": last_visit,
            "files": files
        })
        
    return records_list


@router.get("/reminders")
def get_reminder_queue(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Return upcoming confirmed/pending appointments as a reminder queue.
    Marks each reminder as Sent if a communication log already exists for that patient."""
    import datetime
    today = datetime.date.today()
    tomorrow = today + timedelta(days=1)

    # Fetch upcoming appointments for today and tomorrow that still need reminders
    upcoming = db.query(AppointmentModel).filter(
        AppointmentModel.appointment_date.in_([today, tomorrow]),
        AppointmentModel.status.in_(["Confirmed", "Pending"])
    ).order_by(AppointmentModel.appointment_date.asc(), AppointmentModel.appointment_time.asc()).all()

    reminders = []
    for appt in upcoming:
        patient = db.query(PatientModel).filter(PatientModel.id == appt.patient_id).first()
        if not patient:
            continue

        # Check if a reminder comm-log was already sent for this patient's upcoming appointment
        # Look for communication logs sent today for this patient
        existing_reminder = db.query(CommunicationLogModel).filter(
            CommunicationLogModel.patient_id == appt.patient_id,
            CommunicationLogModel.template.in_(["appointment_reminder", "manual_reminder"]),
        ).order_by(CommunicationLogModel.sent_at.desc()).first()

        status = "Sent" if existing_reminder else "Pending"
        is_today = appt.appointment_date == today

        reminders.append({
            "id": appt.id,
            "patient_id": patient.id,
            "name": patient.name,
            "phone": patient.phone,
            "email": patient.email,
            "date": appt.appointment_date.strftime("%Y-%m-%d"),
            "time": appt.appointment_time,
            "doctor": appt.doctor_name,
            "treatment": appt.treatment_type,
            "status": status,
            "auto": True,
            "day_label": "Today" if is_today else "Tomorrow",
            "priority": appt.priority,
        })

    return reminders



@router.post("/appointments/{id}/checkin", response_model=AppointmentResponse)
def self_checkin(id: int, checkin_in: CheckInRequest, db: Session = Depends(get_db)):
    appt = initiate_self_checkin(db, appt_id=id, checkin_in=checkin_in)
    appt.patient = db.query(PatientModel).filter(PatientModel.id == appt.patient_id).first()
    return appt

@router.post("/appointments/{id}/send-otp", response_model=AppointmentResponse)
def send_otp(id: int, db: Session = Depends(get_db)):
    appt = send_checkin_otp(db, appt_id=id)
    appt.patient = db.query(PatientModel).filter(PatientModel.id == appt.patient_id).first()
    return appt

@router.post("/appointments/{id}/verify-otp", response_model=AppointmentResponse)
def verify_otp(id: int, verify_in: OtpVerificationRequest, db: Session = Depends(get_db)):
    appt = verify_checkin_otp(db, appt_id=id, otp_code=verify_in.otp)
    appt.patient = db.query(PatientModel).filter(PatientModel.id == appt.patient_id).first()
    return appt

@router.post("/appointments/{id}/pay-consultation", response_model=AppointmentResponse)
def pay_consultation_route(id: int, payment_in: PaymentRequest, db: Session = Depends(get_db)):
    appt = process_consultation_payment(db, appt_id=id, payment_in=payment_in)
    appt.patient = db.query(PatientModel).filter(PatientModel.id == appt.patient_id).first()
    return appt

@router.post("/appointments/{id}/direct-checkin", response_model=AppointmentResponse)
def direct_checkin(
    id: int, 
    priority: Optional[str] = "Routine", 
    doctor_name: Optional[str] = None, 
    db: Session = Depends(get_db)
):
    appt = direct_checkin_bypass(db, appt_id=id, priority=priority, doctor_name=doctor_name)
    appt.patient = db.query(PatientModel).filter(PatientModel.id == appt.patient_id).first()
    return appt

@router.put("/appointments/{id}/status", response_model=AppointmentResponse)
def update_status(id: int, status_in: AppointmentUpdate, db: Session = Depends(get_db)):
    from .service import update_appointment
    appt = update_appointment(db, appt_id=id, appt_update=status_in)
    appt.patient = db.query(PatientModel).filter(PatientModel.id == appt.patient_id).first()
    
    # Trigger patient notification if date/time rescheduled
    if appt.patient and (status_in.appointment_date or status_in.appointment_time):
        notif = PatientNotificationModel(
            patient_token=appt.patient.token,
            sender_role="receptionist",
            type="appointment",
            title="Appointment Updated",
            message=f"Your appointment with {appt.doctor_name} has been updated to {appt.appointment_date} at {appt.appointment_time}.",
            read=False
        )
        db.add(notif)
        db.commit()
        
    return appt

@router.post("/appointments/{id}/call", response_model=AppointmentResponse)
def call_patient(id: int, status_str: str = "In Chair", db: Session = Depends(get_db)):
    if status_str not in ["In Chair", "Completed"]:
        raise HTTPException(status_code=400, detail="Status must be either 'In Chair' or 'Completed' when calling patient.")
    appt = update_appointment_status(db, appt_id=id, status_str=status_str)
    appt.patient = db.query(PatientModel).filter(PatientModel.id == appt.patient_id).first()
    
    # Trigger accountant billing notification when appointment is Completed
    if status_str == "Completed" and appt.patient:
        treatment_costs = {
            "checkup": 500,
            "cleaning": 1000,
            "root canal": 5000,
            "crown": 8000,
            "extraction": 1500,
            "filling": 1200,
            "consultation": 1500
        }
        treatment = (appt.treatment_type or "").lower()
        cost = 1500  # default fallback
        for t_type, t_cost in treatment_costs.items():
            if t_type in treatment:
                cost = t_cost
                break
        
        notif = PatientNotificationModel(
            patient_token=appt.patient.token,
            sender_role="accountant",
            type="billing",
            title="New Invoice Generated",
            message=f"Your treatment '{appt.treatment_type}' is completed. Invoice generated with patient due amount of ₹{cost}.",
            read=False
        )
        db.add(notif)
        
        # Trigger consultation completed notification from the doctor
        notif_consult = PatientNotificationModel(
            patient_token=appt.patient.token,
            sender_role="doctor",
            type="treatment_plan",
            title="Consultation Completed",
            message=f"Your consultation for '{appt.treatment_type}' with {appt.doctor_name} has been completed. All updates to your treatment plan are now available in your portal.",
            read=False
        )
        db.add(notif_consult)
        db.commit()
        
    return appt

@router.get("/queue", response_model=List[QueueItemResponse])
def get_live_queue(db: Session = Depends(get_db)):
    today = date.today()
    active_appointments = db.query(AppointmentModel).filter(
        AppointmentModel.appointment_date <= today,
        AppointmentModel.status.in_(["Waiting", "In Chair"])
    ).all()
    
    # Sort active queue: Emergency first, then Urgent, then Routine (sort priority based on weight),
    # then chronological by checked_in_at.
    priority_weights = {"Emergency": 3, "Urgent": 2, "Routine": 1}
    sorted_appts = sorted(
        active_appointments,
        key=lambda x: (-priority_weights.get(x.priority, 1), x.checked_in_at or x.created_at)
    )
    
    queue_items = []
    for appt in sorted_appts:
        patient = db.query(PatientModel).filter(PatientModel.id == appt.patient_id).first()
        if patient:
            age = 30
            if patient.date_of_birth:
                today = date.today()
                age = today.year - patient.date_of_birth.year - ((today.month, today.day) < (patient.date_of_birth.month, patient.date_of_birth.day))
            
            alerts = []
            if patient.known_allergies:
                alerts.append(patient.known_allergies)
                
            queue_items.append({
                "id": appt.id,
                "patient_name": patient.name,
                "patient_phone": patient.phone,
                "token": patient.token or f"PT-{patient.id}",
                "doctor_name": appt.doctor_name,
                "appointment_time": appt.appointment_time,
                "checked_in_at": appt.checked_in_at or appt.created_at,
                "priority": appt.priority,
                "status": appt.status,
                "wait_time_estimate": appt.wait_time_estimate,
                "age": age,
                "gender": patient.gender,
                "medical_alerts": alerts,
                "procedure": appt.treatment_type,
                "chief_complaint": appt.symptoms or "Dental checkup"
            })
    return queue_items

@router.get("/doctors")
def get_public_doctors(date: str = None, db: Session = Depends(get_db)):
    all_users = db.query(UserModel).filter(UserModel.status == "Active").all()
    doctors = [u for u in all_users if any(r.lower() == "doctor" for r in (u.roles or []))]
    
    if date:
        from modules.leave.models import LeaveRequestModel
        on_leave_user_ids = db.query(LeaveRequestModel.user_id).filter(
            LeaveRequestModel.status == "Approved",
            LeaveRequestModel.start_date <= date,
            LeaveRequestModel.end_date >= date
        ).all()
        on_leave_set = {uid[0] for uid in on_leave_user_ids}
        doctors = [doc for doc in doctors if doc.id not in on_leave_set]
        
    import datetime
    
    date_obj = datetime.date.fromisoformat(date) if date else datetime.date.today()
    day_of_week = date_obj.strftime("%A")
    
    result = []
    for doc in doctors:
        specialty = ", ".join(doc.specialties) if doc.specialties else "General Dentistry"
        name = doc.name if doc.name.startswith("Dr. ") else f"Dr. {doc.name}"
        
        # Determine shift from working_hours
        start_time = "09:00 AM"
        end_time = "05:00 PM"
        is_off = False
        
        doctor_details = db.query(DoctorModel).filter(DoctorModel.user_id == doc.id).first()
        if doctor_details and doctor_details.working_hours:
            today_hours = doctor_details.working_hours.get(day_of_week)
            if today_hours:
                is_off = today_hours.get("is_off", False)
                if today_hours.get("start") and today_hours.get("end"):
                    start_time = today_hours["start"]
                    end_time = today_hours["end"]
                    
        if is_off:
            continue
            
        def parse_to_minutes(t_str: str) -> int:
            try:
                parts = t_str.strip().upper().split()
                time_parts = parts[0].split(":")
                hr = int(time_parts[0])
                mn = int(time_parts[1]) if len(time_parts) > 1 else 0
                ampm = parts[1] if len(parts) > 1 else "AM"
                if ampm == "PM" and hr != 12:
                    hr += 12
                elif ampm == "AM" and hr == 12:
                    hr = 0
                return hr * 60 + mn
            except Exception:
                return 9999

        def format_to_str(total_min: int) -> str:
            hr = total_min // 60
            mn = total_min % 60
            ampm = "AM"
            if hr >= 12:
                ampm = "PM"
                if hr > 12:
                    hr -= 12
            if hr == 0:
                hr = 12
            return f"{hr:02d}:{mn:02d} {ampm}"
            
        start_min = parse_to_minutes(start_time)
        end_min = parse_to_minutes(end_time)
        if start_min == 9999 or end_min == 9999 or start_min >= end_min:
            start_min = 9 * 60
            end_min = 17 * 60
            
        base_slots = []
        curr = start_min
        while curr < end_min:
            base_slots.append(format_to_str(curr))
            curr += 30
            
        # Get appointments for this doctor on the date
        doc_name_clean = doc.name.replace("Dr.", "").strip()
        doc_appts = db.query(AppointmentModel).filter(
            AppointmentModel.doctor_name.ilike(f"%{doc_name_clean}%"),
            AppointmentModel.appointment_date == date_obj,
            AppointmentModel.status != "Cancelled"
        ).all()
        
        slot_counts = {}
        for appt in doc_appts:
            try:
                parts = appt.appointment_time.strip().upper().split()
                time_parts = parts[0].split(":")
                hr = int(time_parts[0])
                mn = int(time_parts[1]) if len(time_parts) > 1 else 0
                ampm = parts[1] if len(parts) > 1 else "AM"
                fmt_time = f"{hr:02d}:{mn:02d} {ampm}"
                slot_counts[fmt_time] = slot_counts.get(fmt_time, 0) + 1
            except:
                pass
                
        slots_with_availability = []
        for s in base_slots:
            count = slot_counts.get(s, 0)
            # Find the nearest slot if exact match not found
            if count == 0:
                # Basic check for slight variations
                s_min = parse_to_minutes(s)
                for a_time, a_count in slot_counts.items():
                    if abs(parse_to_minutes(a_time) - s_min) < 15:
                        count += a_count
            
            slots_with_availability.append({
                "time": s,
                "booked": count,
                "available": count < 3,
                "is_full": count >= 3
            })

        result.append({
            "id": doc.id,
            "name": name,
            "specialty": specialty,
            "slots": slots_with_availability
        })
    return result

# ──────────────────────────────────────────
# Communication Log Endpoints
# ──────────────────────────────────────────

@router.post("/communications", response_model=CommunicationLogResponse)
def send_communication(
    payload: CommunicationSendRequest,
    db: Session = Depends(get_db)
):
    """Log a communication event sent to a patient."""
    # If patient_id given, enrich contact info from the DB
    recipient_phone = payload.recipient_phone
    recipient_email = payload.recipient_email
    recipient_name = payload.recipient_name

    if payload.patient_id:
        patient = db.query(PatientModel).filter(PatientModel.id == payload.patient_id).first()
        if patient:
            recipient_name = patient.name
            recipient_phone = patient.phone
            recipient_email = patient.email

    log = CommunicationLogModel(
        patient_id=payload.patient_id,
        recipient_name=recipient_name,
        recipient_phone=recipient_phone,
        recipient_email=recipient_email,
        channel=payload.channel,
        template=payload.template,
        message_body=payload.message_body,
        status="Sent",
        sent_by=payload.sent_by or "Receptionist",
    )
    db.add(log)
    db.commit()
    db.refresh(log)

    # Trigger patient app notification if patient exists
    if payload.patient_id:
        patient = db.query(PatientModel).filter(PatientModel.id == payload.patient_id).first()
        if patient:
            notif = PatientNotificationModel(
                patient_token=patient.token,
                sender_role="receptionist",
                type="reminders",
                title="Reminder Notice" if "reminder" in (payload.template or "") else "Clinic Notice",
                message=payload.message_body,
                read=False
            )
            db.add(notif)
            db.commit()

    return log


@router.get("/communications", response_model=List[CommunicationLogResponse])
def get_communication_logs(
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Fetch communication history, newest first."""
    logs = (
        db.query(CommunicationLogModel)
        .order_by(CommunicationLogModel.sent_at.desc())
        .limit(limit)
        .all()
    )
    return logs


@router.get("/communications/patient/{patient_id}", response_model=List[CommunicationLogResponse])
def get_patient_communications(
    patient_id: int,
    db: Session = Depends(get_db)
):
    """Fetch all communication logs for a specific patient."""
    logs = (
        db.query(CommunicationLogModel)
        .filter(CommunicationLogModel.patient_id == patient_id)
        .order_by(CommunicationLogModel.sent_at.desc())
        .all()
    )
    return logs

@router.get("/transactions/today", response_model=List[TransactionResponse])
def fetch_daily_transactions(db: Session = Depends(get_db)):
    return get_daily_transactions(db)
