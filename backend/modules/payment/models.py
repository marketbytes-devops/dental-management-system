from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.sql import func
from database import Base


class ConsultationPaymentModel(Base):
    """Tracks consultation fee payments (Online Razorpay or Counter Cash/UPI) tied to appointments."""
    __tablename__ = "consultation_payments"

    id = Column(Integer, primary_key=True, index=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=True, index=True)
    patient_token = Column(String, nullable=True, index=True)
    patient_name = Column(String, nullable=True)
    doctor_name = Column(String, nullable=True)
    payment_method = Column(String, default="Cash") # Cash, UPI, Card, Razorpay, Waived
    razorpay_order_id = Column(String, nullable=True, index=True)
    razorpay_payment_id = Column(String, nullable=True)
    amount = Column(Float, nullable=False, default=500.0) # in INR
    currency = Column(String, default="INR")
    status = Column(String, default="Paid") # Created | Paid | Failed | Waived
    receptionist_name = Column(String, nullable=True)
    shift_id = Column(Integer, nullable=True)
    is_reconciled = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class ShiftReconciliationModel(Base):
    """Tracks Receptionist end-of-day cash counter closures and Accountant reconciliation handovers."""
    __tablename__ = "shift_reconciliations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    receptionist_id = Column(Integer, nullable=True)
    receptionist_name = Column(String, nullable=False)
    shift_date = Column(String, nullable=False, index=True) # YYYY-MM-DD
    system_cash_total = Column(Float, default=0.0)
    system_upi_total = Column(Float, default=0.0)
    system_card_total = Column(Float, default=0.0)
    system_grand_total = Column(Float, default=0.0)
    physical_cash_submitted = Column(Float, default=0.0)
    discrepancy_amount = Column(Float, default=0.0) # physical - system_cash
    status = Column(String, default="Pending Verification") # Pending Verification, Reconciled, Discrepancy Flagged
    accountant_notes = Column(String, nullable=True)
    accountant_name = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    reconciled_at = Column(DateTime(timezone=True), nullable=True)

class ClinicSettingModel(Base):
    """Stores key-value clinic settings such as dynamic consultation fee tariffs."""
    __tablename__ = "clinic_settings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    setting_key = Column(String, unique=True, nullable=False, index=True)
    setting_value = Column(String, nullable=False)
    description = Column(String, nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


