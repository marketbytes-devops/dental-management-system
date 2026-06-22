# router.py - all /frontdesk/* endpoints
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from .schemas import (
    AppointmentCreate,
    AppointmentResponse,
    AppointmentUpdate,
    CheckInRequest,
    OtpVerificationRequest,
    QueueItemResponse
)
from .models import AppointmentModel
from modules.patient.models import PatientModel
from .service import (
    create_appointment,
    get_today_appointments,
    get_patient_appointments,
    initiate_self_checkin,
    send_checkin_otp,
    verify_checkin_otp,
    direct_checkin_bypass,
    update_appointment_status
)
from dependencies import get_current_user

router = APIRouter(prefix="/frontdesk", tags=["frontdesk"])

@router.post("/appointments", response_model=AppointmentResponse)
def schedule_appointment(appt_in: AppointmentCreate, db: Session = Depends(get_db)):
    appt = create_appointment(db, appt_in=appt_in)
    appt.patient = db.query(PatientModel).filter(PatientModel.id == appt.patient_id).first()
    return appt

@router.get("/appointments/today", response_model=List[AppointmentResponse])
def get_todays_appointments(db: Session = Depends(get_db)):
    appointments = get_today_appointments(db)
    for appt in appointments:
        appt.patient = db.query(PatientModel).filter(PatientModel.id == appt.patient_id).first()
    return appointments

@router.get("/appointments/patient/{patient_id}", response_model=List[AppointmentResponse])
def get_patient_appointments_route(patient_id: int, db: Session = Depends(get_db)):
    appointments = get_patient_appointments(db, patient_id)
    for appt in appointments:
        appt.patient = db.query(PatientModel).filter(PatientModel.id == appt.patient_id).first()
    return appointments

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
    return appt

@router.post("/appointments/{id}/call", response_model=AppointmentResponse)
def call_patient(id: int, status_str: str = "In Chair", db: Session = Depends(get_db)):
    if status_str not in ["In Chair", "Completed"]:
        raise HTTPException(status_code=400, detail="Status must be either 'In Chair' or 'Completed' when calling patient.")
    appt = update_appointment_status(db, appt_id=id, status_str=status_str)
    appt.patient = db.query(PatientModel).filter(PatientModel.id == appt.patient_id).first()
    return appt

@router.get("/queue", response_model=List[QueueItemResponse])
def get_live_queue(db: Session = Depends(get_db)):
    active_appointments = db.query(AppointmentModel).filter(
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
                "wait_time_estimate": appt.wait_time_estimate
            })
    return queue_items

