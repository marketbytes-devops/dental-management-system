# schemas.py - Pydantic request/response models
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class LabOrderCreate(BaseModel):
    patient_token: str
    patient_name: Optional[str] = None
    dentist_name: Optional[str] = None
    dentist_contact: Optional[str] = None
    prosthetic_type: str
    material: Optional[str] = None
    shade: Optional[str] = None
    priority: Optional[str] = "Medium"
    notes: Optional[str] = None
    due_date: Optional[str] = None
    lab_name: Optional[str] = None

class LabOrderStatusUpdate(BaseModel):
    status: str
    rejection_reason: Optional[str] = None

class LabOrderEdit(BaseModel):
    prosthetic_type: Optional[str] = None
    material: Optional[str] = None
    shade: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[str] = None
    notes: Optional[str] = None
    lab_name: Optional[str] = None

class LabOrderResponse(BaseModel):
    id: str
    patient_token: str
    patient_name: Optional[str] = None
    dentist_name: Optional[str] = None
    dentist_contact: Optional[str] = None
    prosthetic_type: str
    material: Optional[str] = None
    shade: Optional[str] = None
    priority: str
    status: str
    notes: Optional[str] = None
    due_date: Optional[str] = None
    lab_name: Optional[str] = None
    rejection_reason: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class LabNotificationResponse(BaseModel):
    id: int
    recipient_role: str
    type: str
    title: str
    desc: str
    read: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

