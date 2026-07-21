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
    appointment_id: int
    razorpay_order_id: str
    razorpay_payment_id: Optional[str] = None
    amount: float
    currency: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
