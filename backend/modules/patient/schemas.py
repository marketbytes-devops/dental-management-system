# schemas.py - Pydantic request/response models
from pydantic import BaseModel
from typing import Optional

class PatientBase(BaseModel):
    name: str
    age: int
    gender: str
    phone: str
