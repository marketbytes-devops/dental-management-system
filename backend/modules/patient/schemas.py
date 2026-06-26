# schemas.py - Pydantic request/response models
from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime


class PatientBase(BaseModel):
    name: str
    gender: str
    phone: str

    # Personal
    date_of_birth: Optional[date] = None
    blood_group: Optional[str] = None

    # Address
    address_line1: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None

    # Emergency contact
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None

    # Medical
    known_allergies: Optional[str] = None


class PatientCreate(PatientBase):
    email: str
    password: str


class PatientUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    address_line1: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    known_allergies: Optional[str] = None


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str


class PatientResponse(PatientBase):
    id: int
    token: str
    email: str
    is_active: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# --- Consent Schemas ---

class ConsentRequest(BaseModel):
    patient_id: int
    doctor_id: Optional[int] = None
    treatment_plan_id: Optional[int] = None
    title: str
    body_text: str


class ConsentSignRequest(BaseModel):
    signature_data: str
    signing_method: str  # 'PORTAL' or 'IN_PERSON'


class ConsentResponse(BaseModel):
    id: int
    patient_id: Optional[int] = None
    doctor_id: Optional[int] = None
    treatment_plan_id: Optional[int] = None
    step_id: Optional[int] = None
    title: str
    body_text: Optional[str] = None
    content: Optional[str] = None
    status: str
    signing_method: Optional[str] = None
    signature_data: Optional[str] = None
    pdf_file_path: Optional[str] = None
    pdf_path: Optional[str] = None
    signed_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True