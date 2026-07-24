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

from .models import ConsultationPaymentModel, ClinicSettingModel
from .schemas import (
    CreateOrderRequest,
    CreateOrderResponse,
    VerifyPaymentRequest,
    PaymentResponse,
    ConsultationTariffUpdate,
    ConsultationTariffResponse,
)

# Load environment variables
load_dotenv()

router = APIRouter(prefix="/payment", tags=["Payment"])


def get_active_consultation_fee(db: Session, key_name: str, default_val: float) -> float:
    """Helper to fetch active consultation fee setting from DB."""
    setting = db.query(ClinicSettingModel).filter(ClinicSettingModel.setting_key == key_name).first()
    if setting and setting.setting_value:
        try:
            return float(setting.setting_value)
        except ValueError:
            return default_val
    return default_val



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

    order_amount = body.amount if (body.amount and body.amount > 0) else get_active_consultation_fee(db, "online_booking_fee", 100.0)

    # If a Razorpay order already exists for this appointment with same amount, return it
    existing = db.query(ConsultationPaymentModel).filter(
        ConsultationPaymentModel.appointment_id == body.appointment_id,
        ConsultationPaymentModel.amount == order_amount,
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

    amount_paise = int(order_amount * 100)
    order_data = {
        "amount": amount_paise,
        "currency": "INR",
        "receipt": f"appt_{body.appointment_id}",
        "notes": {
            "appointment_id": str(body.appointment_id),
            "description": "Dental consultation booking fee/treatment payment",
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
        amount=order_amount,
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


# -------------------------------------------------------------
# Counter Consultation Payment & Shift Reconciliation Endpoints
# -------------------------------------------------------------

from typing import List
from datetime import datetime
from modules.payment.models import ShiftReconciliationModel
from modules.payment.schemas import (
    CounterConsultationPaymentCreate,
    ShiftReconciliationCreate,
    ShiftReconciliationReconcileRequest,
    ShiftReconciliationResponse
)

@router.post("/consultation", response_model=PaymentResponse)
def create_counter_consultation_payment(
    body: CounterConsultationPaymentCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    receptionist_name = current_user.get("name") or "Receptionist"
    
    # Check if appointment exists
    patient_name = body.patient_name
    doctor_name = body.doctor_name
    patient_token = body.patient_token

    if body.appointment_id:
        appt = db.query(AppointmentModel).filter(AppointmentModel.id == body.appointment_id).first()
        if appt:
            if not patient_name: patient_name = appt.patient_name
            if not doctor_name: doctor_name = appt.doctor_name
            if not patient_token: patient_token = appt.patient_token
            appt.payment_status = body.status or "Paid"

    fee_amount = body.amount if body.amount is not None else get_active_consultation_fee(db, "general_consultation_fee", 500.0)

    new_payment = ConsultationPaymentModel(
        appointment_id=body.appointment_id,
        patient_token=patient_token,
        patient_name=patient_name,
        doctor_name=doctor_name,
        payment_method=body.payment_method or "Cash",
        razorpay_order_id=f"COUNTER_{int(datetime.utcnow().timestamp())}",
        amount=fee_amount,
        currency="INR",
        status=body.status or "Paid",
        receptionist_name=receptionist_name,
        is_reconciled=False
    )
    db.add(new_payment)
    db.commit()
    db.refresh(new_payment)
    return new_payment

@router.get("/daily-summary")
def get_daily_collection_summary(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    
    # Query today's consultation payments
    payments = db.query(ConsultationPaymentModel).all()
    today_payments = [p for p in payments if p.created_at and p.created_at.strftime("%Y-%m-%d") == today_str and p.status == "Paid"]
    
    cash_total = sum(p.amount for p in today_payments if (p.payment_method or "").lower() == "cash")
    upi_total = sum(p.amount for p in today_payments if (p.payment_method or "").lower() == "upi")
    card_total = sum(p.amount for p in today_payments if (p.payment_method or "").lower() in ["card", "razorpay"])
    grand_total = cash_total + upi_total + card_total

    return {
        "shift_date": today_str,
        "total_transactions": len(today_payments),
        "system_cash_total": cash_total,
        "system_upi_total": upi_total,
        "system_card_total": card_total,
        "system_grand_total": grand_total,
        "payments": today_payments
    }

@router.post("/shift-handover", response_model=ShiftReconciliationResponse)
def submit_shift_handover(
    body: ShiftReconciliationCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    receptionist_name = current_user.get("name") or "Receptionist"
    user_id = current_user.get("user_id")
    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    
    # Calculate totals
    payments = db.query(ConsultationPaymentModel).all()
    today_payments = [p for p in payments if p.created_at and p.created_at.strftime("%Y-%m-%d") == today_str and p.status == "Paid"]
    
    cash_total = sum(p.amount for p in today_payments if (p.payment_method or "").lower() == "cash")
    upi_total = sum(p.amount for p in today_payments if (p.payment_method or "").lower() == "upi")
    card_total = sum(p.amount for p in today_payments if (p.payment_method or "").lower() in ["card", "razorpay"])
    grand_total = cash_total + upi_total + card_total

    discrepancy = body.physical_cash_submitted - cash_total
    initial_status = "Reconciled" if discrepancy == 0 else "Discrepancy Flagged"

    shift_record = ShiftReconciliationModel(
        receptionist_id=user_id,
        receptionist_name=receptionist_name,
        shift_date=today_str,
        system_cash_total=cash_total,
        system_upi_total=upi_total,
        system_card_total=card_total,
        system_grand_total=grand_total,
        physical_cash_submitted=body.physical_cash_submitted,
        discrepancy_amount=discrepancy,
        status=initial_status,
        accountant_notes=body.accountant_notes
    )
    db.add(shift_record)
    db.commit()
    db.refresh(shift_record)
    return shift_record

@router.get("/shift-handovers", response_model=List[ShiftReconciliationResponse])
def get_shift_handovers(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    shifts = db.query(ShiftReconciliationModel).order_by(ShiftReconciliationModel.created_at.desc()).all()
    return shifts

@router.put("/shift-handover/{shift_id}/reconcile", response_model=ShiftReconciliationResponse)
def reconcile_shift_handover(
    shift_id: int,
    body: ShiftReconciliationReconcileRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    accountant_name = current_user.get("name") or "Accountant"
    shift = db.query(ShiftReconciliationModel).filter(ShiftReconciliationModel.id == shift_id).first()
    if not shift:
        raise HTTPException(status_code=404, detail="Shift handover record not found")

    shift.status = body.status
    shift.accountant_name = accountant_name
    shift.reconciled_at = datetime.utcnow()
    db.commit()
    db.refresh(shift)
    return shift


# ─────────────────────────────────────────────────────────────
# Dynamic Consultation Tariff Settings Endpoints
# ─────────────────────────────────────────────────────────────

@router.get("/consultation-fees", response_model=ConsultationTariffResponse)
def get_consultation_fees(db: Session = Depends(get_db)):
    """Fetch current active consultation tariffs."""
    return ConsultationTariffResponse(
        general_consultation_fee=get_active_consultation_fee(db, "general_consultation_fee", 500.0),
        specialist_consultation_fee=get_active_consultation_fee(db, "specialist_consultation_fee", 800.0),
        followup_consultation_fee=get_active_consultation_fee(db, "followup_consultation_fee", 300.0),
        online_booking_fee=get_active_consultation_fee(db, "online_booking_fee", 100.0)
    )

@router.put("/consultation-fees", response_model=ConsultationTariffResponse)
def update_consultation_fees(
    body: ConsultationTariffUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Admin endpoint to update clinic consultation fee tariffs."""
    updates = {
        "general_consultation_fee": (body.general_consultation_fee, "Default General Dentist Consultation Fee (INR)"),
        "specialist_consultation_fee": (body.specialist_consultation_fee, "Default Specialist Doctor Consultation Fee (INR)"),
        "followup_consultation_fee": (body.followup_consultation_fee, "Follow-up Re-evaluation Fee (INR)"),
        "online_booking_fee": (body.online_booking_fee, "Online Portal Booking Fee Deposit (INR)"),
    }

    for key, (val, desc) in updates.items():
        setting = db.query(ClinicSettingModel).filter(ClinicSettingModel.setting_key == key).first()
        if not setting:
            setting = ClinicSettingModel(setting_key=key, setting_value=str(val), description=desc)
            db.add(setting)
        else:
            setting.setting_value = str(val)

    db.commit()

    return ConsultationTariffResponse(
        general_consultation_fee=body.general_consultation_fee,
        specialist_consultation_fee=body.specialist_consultation_fee,
        followup_consultation_fee=body.followup_consultation_fee,
        online_booking_fee=body.online_booking_fee
    )


