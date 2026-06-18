# schemas.py - Pydantic request/response models
from pydantic import BaseModel
from typing import Optional

class PatientBase(BaseModel):
    name: str
    age: int
    gender: str
    phone: str

class PatientCreate(PatientBase):
    email: str
    password: str

class PatientResponse(PatientBase):
    id: int
    token: str
    email: str

    class Config:
        from_attributes = True
