# schemas.py - Pydantic request/response models
from pydantic import BaseModel, EmailStr
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


class PatientResponse(PatientBase):
    id: int
    token: str
    email: str
    is_active: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class PatientLogin(BaseModel):
    email: EmailStr
    password: str
