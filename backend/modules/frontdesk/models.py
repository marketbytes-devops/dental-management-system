# models.py - database table definitions
from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Float
from sqlalchemy.sql import func
from database import Base

class AppointmentModel(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    doctor_name = Column(String, nullable=False)
    appointment_date = Column(Date, nullable=False)
    appointment_time = Column(String, nullable=False)
    treatment_type = Column(String, nullable=True)
    status = Column(String, default="Confirmed")  # Confirmed, Pending, Checked In, In Chair, Completed, Cancelled
    priority = Column(String, default="Routine")  # Routine, Urgent, Emergency
    otp = Column(String, nullable=True)
    otp_status = Column(String, default="None")  # None, Pending, Sent, Verified, Bypassed
    wait_time_estimate = Column(Integer, default=0)  # in minutes
    checked_in_at = Column(DateTime(timezone=True), nullable=True)
    symptoms = Column(String, nullable=True)
    payment_status = Column(String, default="Unpaid")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class TransactionModel(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    amount = Column(Float, nullable=False)
    payment_method = Column(String, nullable=False) # Cash, Card, Online
    transaction_date = Column(DateTime(timezone=True), server_default=func.now())
    collected_by = Column(String, nullable=True)
