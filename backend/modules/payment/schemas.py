from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class CreateOrderRequest(BaseModel):
    appointment_id: int
    amount: float = 100.0  # INR


class CreateOrderResponse(BaseModel):
    razorpay_order_id: str
    amount: int          # in paise (100 INR = 10000)
    currency: str
    key_id: str
    appointment_id: int

    class Config:
        from_attributes = True


class VerifyPaymentRequest(BaseModel):
    appointment_id: int
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


class PaymentResponse(BaseModel):
    id: int
    appointment_id: Optional[int] = None
    patient_token: Optional[str] = None
    patient_name: Optional[str] = None
    doctor_name: Optional[str] = None
    payment_method: Optional[str] = "Cash"
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    amount: float
    currency: str
    status: str
    receptionist_name: Optional[str] = None
    shift_id: Optional[int] = None
    is_reconciled: Optional[bool] = False
    created_at: datetime

    class Config:
        from_attributes = True

class CounterConsultationPaymentCreate(BaseModel):
    appointment_id: Optional[int] = None
    patient_token: Optional[str] = None
    patient_name: Optional[str] = None
    doctor_name: Optional[str] = None
    payment_method: Optional[str] = "Cash" # Cash, UPI, Card, Waived
    amount: Optional[float] = 500.0
    status: Optional[str] = "Paid"

class ShiftReconciliationCreate(BaseModel):
    physical_cash_submitted: float
    accountant_notes: Optional[str] = None
    shift_date: Optional[str] = None

class ShiftReconciliationReconcileRequest(BaseModel):
    status: str # Reconciled, Discrepancy Flagged
    accountant_notes: Optional[str] = None

class ShiftReconciliationResponse(BaseModel):
    id: int
    receptionist_id: Optional[int] = None
    receptionist_name: str
    shift_date: str
    system_cash_total: float
    system_upi_total: float
    system_card_total: float
    system_grand_total: float
    physical_cash_submitted: float
    discrepancy_amount: float
    status: str
    accountant_notes: Optional[str] = None
    accountant_name: Optional[str] = None
    created_at: datetime
    reconciled_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ConsultationTariffUpdate(BaseModel):
    general_consultation_fee: float = 500.0
    specialist_consultation_fee: float = 800.0
    followup_consultation_fee: float = 300.0
    online_booking_fee: float = 100.0

class ConsultationTariffResponse(BaseModel):
    general_consultation_fee: float
    specialist_consultation_fee: float
    followup_consultation_fee: float
    online_booking_fee: float


