from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class BillingRequestModel(Base):
    __tablename__ = "billing_requests"

    id = Column(Integer, primary_key=True, index=True)
    patient_token = Column(String, index=True, nullable=False)
    doctor_name = Column(String, nullable=False)
    total_amount = Column(Float, nullable=False, default=0.0)
    status = Column(String, default="Pending") # Pending, Invoiced, Paid
    procedures = Column(JSON) # Store list of { procedure_id, name, rate }
    notes = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
