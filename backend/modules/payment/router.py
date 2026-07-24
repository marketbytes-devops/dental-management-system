import os
import hmac
import hashlib
import razorpay
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from dotenv import load_dotenv

from database import get_db
from dependencies import get_current_user
from modules.frontdesk.models import AppointmentModel, TransactionModel
from modules.patient.models import PatientModel

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

    # If a Razorpay order already exists for this appointment with same amount, return it
    existing = db.query(ConsultationPaymentModel).filter(
        ConsultationPaymentModel.appointment_id == body.appointment_id,
        ConsultationPaymentModel.amount == body.amount,
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

    amount_paise = int(body.amount * 100)
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
        amount=body.amount,
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
    filter_type: str = "today",
    target_date: str = None,
    month_str: str = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    now_utc = datetime.utcnow()
    today_str = now_utc.strftime("%Y-%m-%d")
    yesterday_str = (now_utc - timedelta(days=1)).strftime("%Y-%m-%d")
    this_month_str = now_utc.strftime("%Y-%m")

    # Query all DB transactions from the `transactions` table
    db_transactions = db.query(TransactionModel).all()
    
    # Query consultation payments from `consultation_payments` table
    consultation_payments = db.query(ConsultationPaymentModel).filter(ConsultationPaymentModel.status == "Paid").all()

    # Filter helper
    def matches_filter(dt_val):
        if not dt_val:
            return False
        date_fmt = dt_val.strftime("%Y-%m-%d")
        month_fmt = dt_val.strftime("%Y-%m")

        if filter_type == "yesterday":
            return date_fmt == yesterday_str
        elif filter_type == "this_month":
            return month_fmt == this_month_str
        elif filter_type == "month" and month_str:
            return month_fmt == month_str
        elif filter_type == "date" and target_date:
            return date_fmt == target_date
        elif filter_type == "all":
            return True
        else: # "today" default
            return date_fmt == today_str

    filtered_txns = [t for t in db_transactions if t.transaction_date and matches_filter(t.transaction_date)]
    filtered_consultations = [c for c in consultation_payments if c.created_at and matches_filter(c.created_at)]

    # Combine both sources avoiding duplicate entries by appointment_id if present in both
    seen_appt_ids = set()
    enriched_line_items = []

    for t in filtered_txns:
        if not t.appointment_id:
            continue  # Only consultation charges tied to appointments
        seen_appt_ids.add(t.appointment_id)
        appt = db.query(AppointmentModel).filter(AppointmentModel.id == t.appointment_id).first()
        pid = t.patient_id or (appt.patient_id if appt else None)
        patient = db.query(PatientModel).filter(PatientModel.id == pid).first() if pid else None
        
        patient_name = patient.name if patient else "Patient"
        patient_token = patient.token if patient else f"PT-{pid or t.appointment_id or 100}"
        patient_phone = patient.phone if patient else "N/A"
        doctor_name = appt.doctor_name if appt else "General Doctor"
        treatment_type = appt.treatment_type if appt else "Consultation"

        t_lower = (treatment_type or "").lower()
        d_lower = (doctor_name or "").lower()
        if t.amount == 300 or "follow" in t_lower:
            tariff_cat = "Follow-up Checkup"
        elif t.amount == 800 or any(kw in t_lower or kw in d_lower for kw in ["specialist", "ortho", "surgeon", "endodontist", "periodontist", "root canal", "implant"]):
            tariff_cat = "Specialist Consultation"
        else:
            tariff_cat = "General Consultation"

        enriched_line_items.append({
            "id": t.id,
            "appointment_id": t.appointment_id,
            "patient_name": patient_name,
            "patient_token": patient_token,
            "patient_phone": patient_phone,
            "doctor_name": doctor_name,
            "treatment_type": treatment_type,
            "tariff_category": tariff_cat,
            "payment_method": t.payment_method or "Cash",
            "razorpay_order_id": None,
            "razorpay_payment_id": f"TXN-{t.id}",
            "amount": t.amount,
            "created_at": t.transaction_date.isoformat() if t.transaction_date else None
        })

    for c in filtered_consultations:
        if c.appointment_id and c.appointment_id in seen_appt_ids:
            continue  # Already captured via TransactionModel
        
        appt = db.query(AppointmentModel).filter(AppointmentModel.id == c.appointment_id).first() if c.appointment_id else None
        pid = appt.patient_id if appt else None
        patient = db.query(PatientModel).filter(PatientModel.id == pid).first() if pid else None

        doctor_name = c.doctor_name or (appt.doctor_name if appt else "General Doctor")
        treatment_type = appt.treatment_type if appt else "Consultation"
        
        t_lower = (treatment_type or "").lower()
        d_lower = (doctor_name or "").lower()
        if c.amount == 300 or "follow" in t_lower:
            tariff_cat = "Follow-up Checkup"
        elif c.amount == 800 or any(kw in t_lower or kw in d_lower for kw in ["specialist", "ortho", "surgeon", "endodontist", "periodontist", "root canal", "implant"]):
            tariff_cat = "Specialist Consultation"
        else:
            tariff_cat = "General Consultation"

        enriched_line_items.append({
            "id": f"cp-{c.id}",
            "appointment_id": c.appointment_id,
            "patient_name": c.patient_name or (patient.name if patient else "Patient"),
            "patient_token": c.patient_token or (patient.token if patient else f"PT-{c.appointment_id or 100}"),
            "patient_phone": patient.phone if patient else "N/A",
            "doctor_name": doctor_name,
            "treatment_type": treatment_type,
            "tariff_category": tariff_cat,
            "payment_method": c.payment_method or "Online",
            "razorpay_order_id": c.razorpay_order_id,
            "razorpay_payment_id": c.razorpay_payment_id,
            "amount": c.amount,
            "created_at": c.created_at.isoformat() if c.created_at else None
        })

    cash_total = 0.0
    upi_total = 0.0
    card_total = 0.0

    for item in enriched_line_items:
        pm = (item["payment_method"] or "").lower()
        amt = float(item["amount"] or 0.0)
        
        if any(kw in pm for kw in ["upi", "online", "razorpay", "gpay", "phonepe", "paytm"]):
            upi_total += amt
        elif any(kw in pm for kw in ["card", "pos", "debit", "credit"]):
            card_total += amt
        else:
            # Default cash/counter classification
            cash_total += amt

    grand_total = cash_total + upi_total + card_total

    general_items = [item for item in enriched_line_items if item["tariff_category"] == "General Consultation"]
    specialist_items = [item for item in enriched_line_items if item["tariff_category"] == "Specialist Consultation"]
    followup_items = [item for item in enriched_line_items if item["tariff_category"] == "Follow-up Checkup"]

    return {
        "filter_type": filter_type,
        "shift_date": target_date or (yesterday_str if filter_type == "yesterday" else today_str),
        "total_transactions": len(enriched_line_items),
        "system_cash_total": cash_total,
        "system_upi_total": upi_total,
        "system_card_total": card_total,
        "system_grand_total": grand_total,
        "general_consultation_total": sum(item["amount"] for item in general_items),
        "specialist_consultation_total": sum(item["amount"] for item in specialist_items),
        "followup_consultation_total": sum(item["amount"] for item in followup_items),
        "general_count": len(general_items),
        "specialist_count": len(specialist_items),
        "followup_count": len(followup_items),
        "payments": enriched_line_items
    }

@router.post("/shift-handover")
def submit_shift_handover(
    body: ShiftReconciliationCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    receptionist_name = current_user.get("name") or "Receptionist"
    user_id = current_user.get("user_id")
    target_shift_date = body.shift_date or datetime.utcnow().strftime("%Y-%m-%d")
    
    # Calculate exact totals for target_shift_date
    summary = get_daily_collection_summary(
        filter_type="date",
        target_date=target_shift_date,
        db=db,
        current_user=current_user
    )

    cash_total = summary.get("system_cash_total", 0.0)
    upi_total = summary.get("system_upi_total", 0.0)
    card_total = summary.get("system_card_total", 0.0)
    grand_total = summary.get("system_grand_total", 0.0)

    discrepancy = body.physical_cash_submitted - cash_total
    initial_status = "Reconciled" if discrepancy == 0 else "Discrepancy Flagged"

    shift_record = ShiftReconciliationModel(
        receptionist_id=user_id,
        receptionist_name=receptionist_name,
        shift_date=target_shift_date,
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

@router.get("/shift-handovers")
def get_shift_handovers(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    shifts = db.query(ShiftReconciliationModel).order_by(ShiftReconciliationModel.created_at.desc()).all()
    result = []
    all_payments = db.query(ConsultationPaymentModel).all()
    
    for s in shifts:
        summary = get_daily_collection_summary(
            filter_type="date", 
            target_date=s.shift_date, 
            db=db, 
            current_user=current_user
        )
        enriched_p = summary.get("payments", [])
        
        s_dict = {
            "id": s.id,
            "receptionist_id": s.receptionist_id,
            "receptionist_name": s.receptionist_name,
            "shift_date": s.shift_date,
            "system_cash_total": s.system_cash_total,
            "system_upi_total": s.system_upi_total,
            "system_card_total": s.system_card_total,
            "system_grand_total": s.system_grand_total,
            "physical_cash_submitted": s.physical_cash_submitted,
            "discrepancy_amount": s.discrepancy_amount,
            "status": s.status,
            "accountant_notes": s.accountant_notes,
            "accountant_name": s.accountant_name,
            "created_at": s.created_at.isoformat() if s.created_at else None,
            "reconciled_at": s.reconciled_at.isoformat() if s.reconciled_at else None,
            "payments": enriched_p
        }
        result.append(s_dict)
        
    return result

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


