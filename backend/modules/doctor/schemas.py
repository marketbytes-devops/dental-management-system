# schemas.py - Pydantic request/response models
from pydantic import BaseModel

from typing import Optional

class DoctorBase(BaseModel):
    name: str
    specialty: str

class DoctorShiftCreate(BaseModel):
    day_of_week: Optional[str] = None
    specific_date: Optional[str] = None
    start_time: str
    end_time: str
    slot_duration: int = 30

class DoctorShiftResponse(DoctorShiftCreate):
    id: int
    doctor_id: int

    class Config:
        from_attributes = True
