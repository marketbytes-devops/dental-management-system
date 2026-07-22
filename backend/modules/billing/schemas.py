from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class BillingRequestCreate(BaseModel):
    patient_token: str
    doctor_name: str
    total_amount: float
    procedures: List[Dict[str, Any]]
    notes: Optional[str] = None

class BillingRequestUpdate(BaseModel):
    status: Optional[str] = None

class BillingRequestResponse(BillingRequestCreate):
    id: int
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class InvoiceCreate(BaseModel):
    billing_request_id: Optional[int] = None
    patient_id: str
    invoice_number: str
    total_amount: float
    tax_amount: Optional[float] = 0.0
    discount_amount: Optional[float] = 0.0
    net_amount: float
    due_date: Optional[datetime] = None

class InvoiceResponse(InvoiceCreate):
    id: int
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class PaymentCreate(BaseModel):
    invoice_id: int
    amount: float
    payment_method: str
    transaction_id: Optional[str] = None
    type: Optional[str] = "Payment"

class PaymentResponse(PaymentCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class ExpenseCreate(BaseModel):
    category: str
    amount: float
    description: Optional[str] = None
    receipt_url: Optional[str] = None

class ExpenseResponse(ExpenseCreate):
    id: int
    date: datetime
    created_at: datetime

    class Config:
        from_attributes = True

class InsuranceClaimCreate(BaseModel):
    invoice_id: int
    provider_name: str
    policy_number: str
    claim_amount: float

class InsuranceClaimResponse(InsuranceClaimCreate):
    id: int
    approved_amount: Optional[float] = None
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
