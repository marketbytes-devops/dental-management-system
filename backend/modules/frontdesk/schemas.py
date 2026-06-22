# schemas.py - Pydantic request/response models
from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime

class AppointmentBase(BaseModel):
    doctor_name: str
    appointment_date: date
    appointment_time: str
    treatment_type: str
    status: Optional[str] = "Confirmed"
    priority: Optional[str] = "Routine"
    symptoms: Optional[str] = None

class AppointmentCreate(AppointmentBase):
    patient_id: int

class AppointmentUpdate(BaseModel):
    doctor_name: Optional[str] = None
    appointment_date: Optional[date] = None
    appointment_time: Optional[str] = None
    treatment_type: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None

class PatientMiniResponse(BaseModel):
    id: int
    token: str
    name: str
    gender: str
    phone: str
    email: str

    class Config:
        from_attributes = True

class AppointmentResponse(AppointmentBase):
    id: int
    patient_id: int
    patient: Optional[PatientMiniResponse] = None
    otp: Optional[str] = None
    otp_status: Optional[str] = "None"
    wait_time_estimate: int
    checked_in_at: Optional[datetime] = None
    symptoms: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class CheckInRequest(BaseModel):
    symptoms: Optional[str] = None
    is_emergency: Optional[bool] = False

class OtpVerificationRequest(BaseModel):
    otp: str

class QueueItemResponse(BaseModel):
    id: int
    patient_name: str
    patient_phone: str
    token: str
    doctor_name: str
    appointment_time: str
    checked_in_at: datetime
    priority: str
    status: str
    wait_time_estimate: int

