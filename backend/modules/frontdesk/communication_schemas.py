# communication_schemas.py - Pydantic schemas for communication API
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class CommunicationSendRequest(BaseModel):
    patient_id: Optional[int] = None        # Optional: link to real patient
    recipient_name: str                       # Name to display
    recipient_phone: Optional[str] = None
    recipient_email: Optional[str] = None
    channel: str                              # WhatsApp | SMS | Email
    template: str                             # Booking Confirmation | Reminder | etc.
    message_body: Optional[str] = None       # Custom message (optional)
    sent_by: Optional[str] = "Receptionist"


class CommunicationLogResponse(BaseModel):
    id: int
    patient_id: Optional[int] = None
    recipient_name: str
    recipient_phone: Optional[str] = None
    recipient_email: Optional[str] = None
    channel: str
    template: str
    message_body: Optional[str] = None
    status: str
    sent_at: datetime
    sent_by: Optional[str] = None

    class Config:
        from_attributes = True
