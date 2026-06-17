# schemas.py - Pydantic request/response models
from pydantic import BaseModel

class AppointmentBase(BaseModel):
    patient_name: str
    time: str
    status: str
