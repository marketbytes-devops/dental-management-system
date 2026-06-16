# schemas.py - Pydantic request/response models
from pydantic import BaseModel

class LabOrderBase(BaseModel):
    patient_token: str
    item: str
    status: str
