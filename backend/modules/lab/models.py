# models.py - database table definitions
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from database import Base

class LabOrderModel(Base):
    __tablename__ = "lab_orders"

    id = Column(String, primary_key=True, index=True)
    patient_token = Column(String, index=True, nullable=False)
    patient_name = Column(String, nullable=True)
    dentist_name = Column(String, nullable=True)
    dentist_contact = Column(String, nullable=True)
    prosthetic_type = Column(String, nullable=False)
    material = Column(String, nullable=True)
    shade = Column(String, nullable=True)
    priority = Column(String, default="Medium")
    status = Column(String, default="Pending")
    notes = Column(String, nullable=True)
    due_date = Column(String, nullable=True)
    lab_name = Column(String, nullable=True)
    rejection_reason = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class LabNotificationModel(Base):
    __tablename__ = "lab_notifications"

    id = Column(Integer, primary_key=True, index=True)
    recipient_role = Column(String, default="lab tech")
    type = Column(String, default="Orders")  # Orders, QC, Dispatch, Billing
    title = Column(String, nullable=False)
    desc = Column(String, nullable=False)
    read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

