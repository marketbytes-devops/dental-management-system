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
    source_type = Column(String, default="consultation") # consultation, treatment, lab
    procedures = Column(JSON) # Store list of { procedure_id, name, rate }
    notes = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    invoices = relationship("InvoiceModel", back_populates="billing_request", cascade="all, delete-orphan")

class InvoiceModel(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    billing_request_id = Column(Integer, ForeignKey("billing_requests.id"), nullable=True)
    patient_id = Column(String, nullable=False, index=True)
    invoice_number = Column(String, unique=True, index=True, nullable=False)
    total_amount = Column(Float, nullable=False, default=0.0)
    tax_amount = Column(Float, default=0.0)
    discount_amount = Column(Float, default=0.0)
    net_amount = Column(Float, nullable=False, default=0.0)
    status = Column(String, default="Unpaid") # Unpaid, Partial, Paid, Void
    due_date = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    billing_request = relationship("BillingRequestModel", back_populates="invoices")
    payments = relationship("PaymentModel", back_populates="invoice", cascade="all, delete-orphan")
    insurance_claims = relationship("InsuranceClaimModel", back_populates="invoice", cascade="all, delete-orphan")

class PaymentModel(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False)
    amount = Column(Float, nullable=False)
    payment_method = Column(String, nullable=False) # Cash, Card, UPI, Insurance
    transaction_id = Column(String, nullable=True)
    type = Column(String, default="Payment") # Payment, Refund
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    invoice = relationship("InvoiceModel", back_populates="payments")

class ExpenseModel(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String, nullable=False) # Payroll, Supplies, Lab, Utilities
    amount = Column(Float, nullable=False)
    description = Column(String, nullable=True)
    date = Column(DateTime(timezone=True), server_default=func.now())
    receipt_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class InsuranceClaimModel(Base):
    __tablename__ = "insurance_claims"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False)
    provider_name = Column(String, nullable=False)
    policy_number = Column(String, nullable=False)
    claim_amount = Column(Float, nullable=False)
    approved_amount = Column(Float, nullable=True)
    status = Column(String, default="Pending") # Pending, Verified, Approved, Rejected, Disbursed
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    invoice = relationship("InvoiceModel", back_populates="insurance_claims")
