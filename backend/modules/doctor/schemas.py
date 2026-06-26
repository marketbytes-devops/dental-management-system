# schemas.py - Pydantic request/response models
from pydantic import BaseModel

class DoctorBase(BaseModel):
    name: str
    specialty: str
