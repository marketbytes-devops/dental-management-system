import os
import hmac
import hashlib
import razorpay

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from dotenv import load_dotenv

from database import get_db
from dependencies import get_current_user
from modules.frontdesk.models import AppointmentModel

from .models import ConsultationPaymentModel
from .schemas import (
    CreateOrderRequest,
    CreateOrderResponse,
    VerifyPaymentRequest,
    PaymentResponse,
)

# Load environment variables
load_dotenv()

router = APIRouter(prefix="/payment", tags=["Payment"])

CONSULTATION_FEE_INR = 100  # fixed consultation fee


def _get_razorpay_credentials():
    # Construct absolute path to the .env file in the backend root directory
    backend_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    env_path = os.path.join(backend_root, ".env")
    
    # Force reload environment variables to ensure any recent changes are captured
    load_dotenv(dotenv_path=env_path, override=True)
    key_id = os.getenv("RAZORPAY_KEY_ID", "")
    key_secret = os.getenv("RAZORPAY_KEY_SECRET", "")
    if not key_id or not key_secret or "rzp_test_XXXX" in key_id:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Payment gateway not configured. Please contact the clinic administrator.",
        )
    return key_id, key_secret



def _get_razorpay_client():
    key_id, key_secret = _get_razorpay_credentials()
    return razorpay.Client(auth=(key_id, key_secret))


# ─────────────────────────────────────────────────────────────────────────────
# POST /payment/create-order
# Creates a Razorpay order for the ₹100 consultation fee.
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/create-order", response_model=CreateOrderResponse)
def create_payment_order(
    body: CreateOrderRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    # Verify the appointment exists
    appointment = db.query(AppointmentModel).filter(
        AppointmentModel.id == body.appointment_id
    ).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found.")

    key_id, _ = _get_razorpay_credentials()

    # If a Razorpay order already exists for this appointment, return it
    existing = db.query(ConsultationPaymentModel).filter(
        ConsultationPaymentModel.appointment_id == body.appointment_id,
        ConsultationPaymentModel.status == "Created",
    ).first()
    if existing:
        return CreateOrderResponse(
            razorpay_order_id=str(existing.razorpay_order_id),
            amount=int(existing.amount * 100),  # type: ignore
            currency=str(existing.currency),
            key_id=key_id,
            appointment_id=body.appointment_id,
        )

    rz_client = _get_razorpay_client()

    amount_paise = CONSULTATION_FEE_INR * 100  # 10000 paise = ₹100
    order_data = {
        "amount": amount_paise,
        "currency": "INR",
        "receipt": f"appt_{body.appointment_id}",
        "notes": {
            "appointment_id": str(body.appointment_id),
            "description": "Dental consultation booking fee",
        },
    }

    try:
        rz_order = rz_client.order.create(data=order_data)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to create payment order: {str(e)}",
        )

    # Save the order record in the database
    payment_record = ConsultationPaymentModel(
        appointment_id=body.appointment_id,
        razorpay_order_id=rz_order["id"],
        amount=CONSULTATION_FEE_INR,
        currency="INR",
        status="Created",
    )
    db.add(payment_record)
    db.commit()
    db.refresh(payment_record)

    key_id, _ = _get_razorpay_credentials()

    return CreateOrderResponse(
        razorpay_order_id=rz_order["id"],
        amount=amount_paise,
        currency="INR",
        key_id=key_id,
        appointment_id=body.appointment_id,
    )


# ─────────────────────────────────────────────────────────────────────────────
# POST /payment/verify
# Verifies the Razorpay HMAC signature and marks the payment as Paid.
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/verify", response_model=PaymentResponse)
def verify_payment(
    body: VerifyPaymentRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    # Find the payment record
    payment_record = db.query(ConsultationPaymentModel).filter(
        ConsultationPaymentModel.razorpay_order_id == body.razorpay_order_id,
        ConsultationPaymentModel.appointment_id == body.appointment_id,
    ).first()

    if not payment_record:
        raise HTTPException(status_code=404, detail="Payment record not found.")

    if payment_record.status == "Paid":
        # Already verified — return the existing record
        return payment_record

    # ── Signature Verification ────────────────────────────────────────────────
    # Razorpay signs: razorpay_order_id + "|" + razorpay_payment_id
    _, key_secret = _get_razorpay_credentials()
    expected_signature = hmac.new(
        key_secret.encode("utf-8"),
        f"{body.razorpay_order_id}|{body.razorpay_payment_id}".encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(expected_signature, body.razorpay_signature):
        # Mark as failed
        payment_record.status = "Failed"  # type: ignore
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment verification failed: invalid signature.",
        )

    # ── Mark as Paid ──────────────────────────────────────────────────────────
    payment_record.status = "Paid"  # type: ignore
    payment_record.razorpay_payment_id = body.razorpay_payment_id  # type: ignore
    db.commit()

    # Also update the appointment's payment_status
    appointment = db.query(AppointmentModel).filter(
        AppointmentModel.id == body.appointment_id
    ).first()
    if appointment:
        appointment.payment_status = "Paid"  # type: ignore
        db.commit()

    db.refresh(payment_record)
    return payment_record
