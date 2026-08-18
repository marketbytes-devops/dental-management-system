# communication_models.py - Communication log database model
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from database import Base


class CommunicationLogModel(Base):
    __tablename__ = "communication_logs"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=True)
    recipient_name = Column(String, nullable=False)       # Patient display name
    recipient_phone = Column(String, nullable=True)       # Phone number (for SMS/WhatsApp)
    recipient_email = Column(String, nullable=True)       # Email address
    channel = Column(String, nullable=False)              # WhatsApp | SMS | Email | WhatsApp + SMS
    template = Column(String, nullable=False)             # appointment_booking | appointment_reminder_1day | appointment_reminder_sameday | manual
    trigger_type = Column(String, nullable=True)          # booked | 1day_before | on_the_day | manual
    message_body = Column(Text, nullable=True)            # Optional rendered message body
    status = Column(String, default="Sent")               # Sent | Delivered | Failed
    error_message = Column(String, nullable=True)         # Optional failure error description
    sent_at = Column(DateTime(timezone=True), server_default=func.now())
    sent_by = Column(String, nullable=True)               # Staff member or System
