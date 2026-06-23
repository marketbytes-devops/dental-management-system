# communication_models.py - Communication log database model
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from database import Base


class CommunicationLogModel(Base):
    __tablename__ = "communication_logs"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=True)
    recipient_name = Column(String, nullable=False)       # Patient display name
    recipient_phone = Column(String, nullable=True)       # Phone number (for SMS/WhatsApp)
    recipient_email = Column(String, nullable=True)       # Email address
    channel = Column(String, nullable=False)              # WhatsApp | SMS | Email
    template = Column(String, nullable=False)             # Booking Confirmation | Reminder | etc.
    message_body = Column(Text, nullable=True)            # Optional rendered message body
    status = Column(String, default="Sent")               # Sent | Delivered | Failed
    sent_at = Column(DateTime(timezone=True), server_default=func.now())
    sent_by = Column(String, nullable=True)               # Staff member who sent it
