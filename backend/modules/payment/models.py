from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from database import Base


class ConsultationPaymentModel(Base):
    """Tracks Razorpay consultation fee payments tied to appointments."""
    __tablename__ = "consultation_payments"

    id = Column(Integer, primary_key=True, index=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=False, index=True)
    razorpay_order_id = Column(String, unique=True, nullable=False, index=True)
    razorpay_payment_id = Column(String, nullable=True)  # filled after successful payment
    amount = Column(Float, nullable=False, default=100.0)  # in INR
    currency = Column(String, default="INR")
    status = Column(String, default="Created")  # Created | Paid | Failed
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
