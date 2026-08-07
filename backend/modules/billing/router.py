from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any
from database import get_db
from dependencies import get_current_user
import os
import hmac
import hashlib
import razorpay
from datetime import datetime, timedelta
import calendar
from .models import (
    BillingRequestModel, InvoiceModel, PaymentModel, 
    ExpenseModel, InsuranceClaimModel
)
from .schemas import (
    BillingRequestCreate, BillingRequestUpdate, BillingRequestResponse,
    InvoiceCreate, InvoiceResponse,
    PaymentCreate, PaymentResponse,
    ExpenseCreate, ExpenseResponse,
    InsuranceClaimCreate, InsuranceClaimResponse
)

router = APIRouter(prefix="/billing", tags=["Billing & Accounting"])

@router.get("/analytics/summary")
def get_analytics_summary(db: Session = Depends(get_db)):
    # Calculate total revenue (sum of payments)
    total_revenue = db.query(func.sum(PaymentModel.amount)).scalar() or 0.0
    
    # Calculate total expenses (sum of expenses)
    total_expenses = db.query(func.sum(ExpenseModel.amount)).scalar() or 0.0
    
    # Calculate outstanding dues (sum of invoice net_amount - sum of payments for those invoices)
    # Simple approach: sum of all unpaid/partial invoice net amounts
    # A more precise way would be to join and subtract, but let's approximate based on invoice totals vs payment totals
    total_invoiced = db.query(func.sum(InvoiceModel.net_amount)).scalar() or 0.0
    outstanding_dues = max(0.0, total_invoiced - total_revenue)
    
    profit = total_revenue - total_expenses
    
    # Get last 6 months data for charts
    today = datetime.today()
    chart_data = []
    
    for i in range(5, -1, -1):
        # Calculate month and year for the past 6 months
        month_date = today.replace(day=1) - timedelta(days=28 * i)
        target_month = month_date.month
        target_year = month_date.year
        month_name = calendar.month_abbr[target_month]
        
        # Monthly Revenue
        monthly_revenue = db.query(func.sum(PaymentModel.amount)).filter(
            func.extract('month', PaymentModel.created_at) == target_month,
            func.extract('year', PaymentModel.created_at) == target_year
        ).scalar() or 0.0
        
        # Monthly Expenses
        monthly_expense = db.query(func.sum(ExpenseModel.amount)).filter(
            func.extract('month', ExpenseModel.date) == target_month,
            func.extract('year', ExpenseModel.date) == target_year
        ).scalar() or 0.0
        
        chart_data.append({
            "name": month_name,
            "Revenue": monthly_revenue,
            "Expenses": monthly_expense,
            "Profit": monthly_revenue - monthly_expense
        })

    return {
        "summary": {
            "totalRevenue": total_revenue,
            "totalExpenses": total_expenses,
            "profit": profit,
            "outstandingDues": outstanding_dues
        },
        "chartData": chart_data
    }

@router.get("/analytics/reports")
def get_analytics_reports(db: Session = Depends(get_db)):
    from modules.frontdesk.models import AppointmentModel
    from modules.lab.models import LabOrderModel

    # --- Appointment Summary ---
    appt_by_status = db.query(
        AppointmentModel.status,
        func.count(AppointmentModel.id)
    ).group_by(AppointmentModel.status).all()
    appt_status_map = {row[0]: row[1] for row in appt_by_status}

    total_appts = sum(appt_status_map.values())
    completed_appts = appt_status_map.get("Completed", 0)
    cancelled_appts = appt_status_map.get("Cancelled", 0)
    missed_appts = appt_status_map.get("Missed", 0)
    pending_appts = total_appts - completed_appts - cancelled_appts - missed_appts

    # --- Doctor Performance ---
    doctor_totals = db.query(
        AppointmentModel.doctor_name,
        func.count(AppointmentModel.id).label("total")
    ).group_by(AppointmentModel.doctor_name).all()

    doctor_completed = db.query(
        AppointmentModel.doctor_name,
        func.count(AppointmentModel.id).label("completed")
    ).filter(AppointmentModel.status == "Completed").group_by(AppointmentModel.doctor_name).all()
    completed_map = {row[0]: row[1] for row in doctor_completed}

    doctor_performance = []
    for row in sorted(doctor_totals, key=lambda x: -x[1])[:8]:
        name = row[0]
        total = row[1]
        done = completed_map.get(name, 0)
        doctor_performance.append({
            "name": name,
            "total": total,
            "completed": done,
            "completion_rate": round((done / total * 100) if total else 0, 1)
        })

    # --- Treatment Popularity ---
    treatment_counts = db.query(
        AppointmentModel.treatment_type,
        func.count(AppointmentModel.id).label("count")
    ).group_by(AppointmentModel.treatment_type).order_by(
        func.count(AppointmentModel.id).desc()
    ).limit(8).all()

    treatment_breakdown = [
        {"name": row[0] or "General", "count": row[1]}
        for row in treatment_counts
    ]

    # --- Lab Order Status ---
    lab_by_status = db.query(
        LabOrderModel.status,
        func.count(LabOrderModel.id).label("count")
    ).group_by(LabOrderModel.status).all()

    lab_status_breakdown = [
        {"status": row[0], "count": row[1]}
        for row in sorted(lab_by_status, key=lambda x: -x[1])
    ]
    total_lab_orders = sum(r["count"] for r in lab_status_breakdown)
    completed_lab = sum(r["count"] for r in lab_status_breakdown if r["status"] in ["Completed", "Delivered", "Ready for Pickup"])

    # --- Expense Category Breakdown ---
    expense_by_cat = db.query(
        ExpenseModel.category,
        func.sum(ExpenseModel.amount).label("total")
    ).group_by(ExpenseModel.category).all()

    expense_breakdown = [
        {"category": row[0], "amount": float(row[1] or 0)}
        for row in sorted(expense_by_cat, key=lambda x: -(x[1] or 0))
    ]
    total_expenses_all = sum(r["amount"] for r in expense_breakdown)

    # --- Monthly Appointment Volume (last 6 months) ---
    today = datetime.today()
    monthly_appts = []
    for i in range(5, -1, -1):
        month_date = today.replace(day=1) - timedelta(days=28 * i)
        target_month = month_date.month
        target_year = month_date.year
        month_label = calendar.month_abbr[target_month]

        total_m = db.query(func.count(AppointmentModel.id)).filter(
            func.extract('month', AppointmentModel.appointment_date) == target_month,
            func.extract('year', AppointmentModel.appointment_date) == target_year
        ).scalar() or 0

        completed_m = db.query(func.count(AppointmentModel.id)).filter(
            AppointmentModel.status == "Completed",
            func.extract('month', AppointmentModel.appointment_date) == target_month,
            func.extract('year', AppointmentModel.appointment_date) == target_year
        ).scalar() or 0

        monthly_appts.append({
            "month": month_label,
            "total": total_m,
            "completed": completed_m
        })

    return {
        "appointments": {
            "total": total_appts,
            "completed": completed_appts,
            "cancelled": cancelled_appts,
            "missed": missed_appts,
            "pending": pending_appts,
            "completion_rate": round((completed_appts / total_appts * 100) if total_appts else 0, 1)
        },
        "doctorPerformance": doctor_performance,
        "treatmentBreakdown": treatment_breakdown,
        "labOrders": {
            "total": total_lab_orders,
            "completed": completed_lab,
            "statusBreakdown": lab_status_breakdown
        },
        "expenseBreakdown": expense_breakdown,
        "totalExpenses": total_expenses_all,
        "monthlyAppointments": monthly_appts
    }



# --- Billing Requests ---
@router.get("/requests", response_model=List[BillingRequestResponse])
def get_billing_requests(db: Session = Depends(get_db)):
    return db.query(BillingRequestModel).order_by(BillingRequestModel.created_at.desc()).all()

@router.post("/request", response_model=BillingRequestResponse)
def create_billing_request(request: BillingRequestCreate, db: Session = Depends(get_db)):
    new_request = BillingRequestModel(**request.dict())
    db.add(new_request)
    db.commit()
    db.refresh(new_request)
    return new_request

@router.post("/lab-request")
def create_lab_billing_request(payload: dict, db: Session = Depends(get_db)):
    """
    Creates a billing request sent directly from the Lab Technician module to the Accountant.
    """
    patient_token = payload.get("patient_token", "PT-WALKIN")
    doctor_name = payload.get("doctor_name", "Lab Technician")
    total_amount = float(payload.get("amount", 0.0))
    notes = payload.get("notes", "Lab Order Charges")
    procedures = payload.get("procedures", [])

    new_request = BillingRequestModel(
        patient_token=patient_token,
        doctor_name=doctor_name,
        total_amount=total_amount,
        status="Pending",
        source_type="lab",
        procedures=procedures,
        notes=notes
    )
    db.add(new_request)
    db.commit()
    db.refresh(new_request)
    return {"success": True, "billing_request_id": new_request.id}


@router.put("/request/{request_id}/status", response_model=BillingRequestResponse)
def update_billing_status(request_id: int, status_update: BillingRequestUpdate, db: Session = Depends(get_db)):
    req = db.query(BillingRequestModel).filter(BillingRequestModel.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Billing Request not found")
    
    if status_update.status:
        req.status = status_update.status
        
    db.commit()
    db.refresh(req)
    return req

# --- Invoices ---
@router.get("/invoices", response_model=List[InvoiceResponse])
def get_invoices(db: Session = Depends(get_db)):
    return db.query(InvoiceModel).order_by(InvoiceModel.created_at.desc()).all()

@router.post("/invoice", response_model=InvoiceResponse)
def create_invoice(invoice: InvoiceCreate, db: Session = Depends(get_db)):
    new_invoice = InvoiceModel(**invoice.dict())
    db.add(new_invoice)
    db.commit()
    db.refresh(new_invoice)
    return new_invoice

# --- Payments ---
@router.get("/payments", response_model=List[PaymentResponse])
def get_payments(db: Session = Depends(get_db)):
    return db.query(PaymentModel).order_by(PaymentModel.created_at.desc()).all()

@router.post("/payment", response_model=PaymentResponse)
def create_payment(payment: PaymentCreate, db: Session = Depends(get_db)):
    pay_data = payment.dict()
    inv_id = pay_data.get("invoice_id")

    inv = db.query(InvoiceModel).filter(InvoiceModel.id == inv_id).first() if inv_id else None
    if not inv:
        inv = db.query(InvoiceModel).first()
        if not inv:
            inv = InvoiceModel(
                patient_token="PAT-GENERAL",
                total_amount=pay_data.get("amount", 0.0),
                amount_paid=pay_data.get("amount", 0.0),
                balance_due=0.0,
                status="Paid"
            )
            db.add(inv)
            db.commit()
            db.refresh(inv)
        pay_data["invoice_id"] = inv.id

    new_payment = PaymentModel(
        invoice_id=pay_data["invoice_id"],
        amount=pay_data["amount"],
        payment_method=pay_data["payment_method"],
        transaction_id=pay_data.get("transaction_id"),
        type=pay_data.get("type", "Payment")
    )
    db.add(new_payment)
    db.commit()
    db.refresh(new_payment)
    return new_payment

# --- Expenses ---
@router.get("/expenses", response_model=List[ExpenseResponse])
def get_expenses(db: Session = Depends(get_db)):
    return db.query(ExpenseModel).order_by(ExpenseModel.date.desc()).all()

@router.post("/expense", response_model=ExpenseResponse)
def create_expense(expense: ExpenseCreate, db: Session = Depends(get_db)):
    new_expense = ExpenseModel(**expense.dict())
    db.add(new_expense)
    db.commit()
    db.refresh(new_expense)
    return new_expense

# --- Insurance Claims ---
@router.get("/claims", response_model=List[InsuranceClaimResponse])
def get_claims(db: Session = Depends(get_db)):
    return db.query(InsuranceClaimModel).order_by(InsuranceClaimModel.created_at.desc()).all()

@router.post("/claim", response_model=InsuranceClaimResponse)
def create_claim(claim: InsuranceClaimCreate, db: Session = Depends(get_db)):
    new_claim = InsuranceClaimModel(**claim.dict())
    db.add(new_claim)
    db.commit()
    db.refresh(new_claim)
    return new_claim

# --- Patient Stacked Ledgers for Accountant ---
@router.get("/patient-ledgers")
def get_patient_ledgers(db: Session = Depends(get_db)):
    from modules.patient.models import PatientModel
    patients = db.query(PatientModel).all()
    billing_requests = db.query(BillingRequestModel).all()
    invoices = db.query(InvoiceModel).all()
    payments = db.query(PaymentModel).all()

    # Map payments by invoice_id
    payments_by_invoice = {}
    for p in payments:
        payments_by_invoice.setdefault(p.invoice_id, []).append(p)

    # Group billing requests by patient_token
    requests_by_patient = {}
    for br in billing_requests:
        requests_by_patient.setdefault(br.patient_token, []).append(br)

    # Group invoices by patient_id/token
    invoices_by_patient = {}
    for inv in invoices:
        invoices_by_patient.setdefault(inv.patient_id, []).append(inv)

    ledgers = []

    # Process all patients
    all_tokens = set(p.token for p in patients) | set(requests_by_patient.keys()) | set(invoices_by_patient.keys())

    patient_map = {p.token: p for p in patients if p.token}

    for token in all_tokens:
        if not token:
            continue
        pat = patient_map.get(token)
        if not pat:
            token_clean = token.replace("PT-", "").replace("CASE-", "")
            for p_tok, p_obj in patient_map.items():
                if token_clean and (token_clean in p_tok or p_tok.replace("PT-", "") in token):
                    pat = p_obj
                    break

        if not pat or pat.name == "Unknown Patient":
            continue

        patient_name = pat.name
        patient_phone = pat.phone if pat else ""

        br_list = requests_by_patient.get(token, [])
        inv_list = invoices_by_patient.get(token, [])

        stacked_items = []
        total_charges = 0.0

        for br in br_list:
            total_charges += float(br.total_amount or 0.0)
            source_tag = getattr(br, 'source_type', None) or 'consultation'
            if not source_tag or source_tag == 'None':
                source_tag = 'consultation'

            # Clean notes (remove Clinical Workspace and Automated Consultation text)
            clean_notes = br.notes
            if clean_notes:
                cn_lower = clean_notes.lower()
                if "clinical workspace" in cn_lower or "automated consultation" in cn_lower or "diagnosis visit" in cn_lower:
                    clean_notes = None

            # Build a meaningful title from procedures or notes
            if br.procedures and isinstance(br.procedures, list) and len(br.procedures) > 0:
                proc_names = [p.get("name") or p.get("title", "") for p in br.procedures if (p.get("name") or p.get("title"))]
                item_title = ", ".join(proc_names) if proc_names else ("Treatment Plan" if "treatment" in source_tag else "Treatment Fee")
            elif clean_notes and clean_notes.strip():
                item_title = clean_notes.strip()
            else:
                item_title = "Treatment Plan" if "treatment" in source_tag else "Treatment Fee"

            if "consultation" in item_title.lower() or "clinical" in item_title.lower():
                item_title = "Treatment Fee"

            stacked_items.append({
                "id": f"br-{br.id}",
                "type": "billing_request",
                "source_type": source_tag,
                "title": item_title,
                "doctor_name": br.doctor_name,
                "amount": float(br.total_amount or 0.0),
                "status": br.status,
                "notes": clean_notes,
                "procedures": br.procedures or [],
                "date": br.created_at.isoformat() if br.created_at else None
            })

        for inv in inv_list:
            # If not already linked to a billing request
            if not inv.billing_request_id:
                total_charges += float(inv.net_amount or 0.0)
                stacked_items.append({
                    "id": f"inv-{inv.id}",
                    "type": "invoice",
                    "source_type": "treatment",
                    "title": f"Invoice #{inv.invoice_number}",
                    "doctor_name": "Clinic Staff",
                    "amount": float(inv.net_amount or 0.0),
                    "status": inv.status,
                    "notes": f"Invoice #{inv.invoice_number}",
                    "procedures": [],
                    "date": inv.created_at.isoformat() if inv.created_at else None
                })

        # Calculate payments made by patient
        patient_payments = []
        total_paid = 0.0
        for inv in inv_list:
            inv_pay_list = payments_by_invoice.get(inv.id, [])
            for p in inv_pay_list:
                total_paid += float(p.amount or 0.0)
                patient_payments.append({
                    "id": p.id,
                    "amount": float(p.amount),
                    "payment_method": p.payment_method,
                    "transaction_id": p.transaction_id,
                    "date": p.created_at.isoformat() if p.created_at else None
                })

        # Sort stacked items by date desc
        stacked_items.sort(key=lambda x: x["date"] or "", reverse=True)

        outstanding_balance = max(0.0, total_charges - total_paid)

        ledgers.append({
            "patient_token": token,
            "patient_name": patient_name,
            "patient_phone": patient_phone,
            "total_charges": total_charges,
            "total_paid": total_paid,
            "outstanding_balance": outstanding_balance,
            "stacked_items": stacked_items,
            "payments": patient_payments
        })

    # Sort ledgers: New/unpaid bills (outstanding_balance > 0 or pending items) FIRST, then latest date desc
    def ledger_sort_key(l):
        has_pending = 1 if l["outstanding_balance"] > 0 or any(i.get("status") == "Pending" for i in l["stacked_items"]) else 0
        latest_date = max([i.get("date") or "" for i in l["stacked_items"]], default="")
        return (has_pending, latest_date)

    ledgers.sort(key=ledger_sort_key, reverse=True)
    return ledgers

@router.get("/patient/me")
def get_my_ledger(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Fetch the ledger for the currently logged-in patient."""
    patient_id = current_user.get("patient_id")
    if not patient_id:
        raise HTTPException(status_code=401, detail="Invalid token payload: not a patient")
    
    from modules.patient.models import PatientModel
    patient = db.query(PatientModel).filter(PatientModel.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    token = patient.token or ""
    
    billing_requests = db.query(BillingRequestModel).filter(
        (BillingRequestModel.patient_token == token) | (BillingRequestModel.patient_token.ilike(f"%{token.replace('PT-', '')}%"))
    ).all() if token else []
    
    invoices = db.query(InvoiceModel).filter(
        InvoiceModel.patient_id == str(patient_id)
    ).all()
    
    inv_ids = [inv.id for inv in invoices]
    payments = db.query(PaymentModel).filter(PaymentModel.invoice_id.in_(inv_ids)).all() if inv_ids else []

    payments_by_invoice = {}
    for p in payments:
        payments_by_invoice.setdefault(p.invoice_id, []).append(p)

    stacked_items = []
    total_charges = 0.0

    for br in billing_requests:
        total_charges += float(br.total_amount or 0.0)
        source_tag = getattr(br, 'source_type', None) or 'consultation'
        if not source_tag or source_tag == 'None':
            source_tag = 'consultation'

        clean_notes = br.notes
        if clean_notes:
            cn_lower = clean_notes.lower()
            if "clinical workspace" in cn_lower or "automated consultation" in cn_lower or "diagnosis visit" in cn_lower:
                clean_notes = None

        if br.procedures and isinstance(br.procedures, list) and len(br.procedures) > 0:
            proc_names = [p.get("name") or p.get("title", "") for p in br.procedures if (p.get("name") or p.get("title"))]
            item_title = ", ".join(proc_names) if proc_names else ("Treatment Plan" if "treatment" in source_tag else "Treatment Fee")
        elif clean_notes and clean_notes.strip():
            item_title = clean_notes.strip()
        else:
            item_title = "Treatment Plan" if "treatment" in source_tag else "Treatment Fee"

        if "consultation" in item_title.lower() or "clinical" in item_title.lower():
            item_title = "Treatment Fee"

        stacked_items.append({
            "id": f"br-{br.id}",
            "type": "billing_request",
            "source_type": source_tag,
            "title": item_title,
            "doctor_name": br.doctor_name,
            "amount": float(br.total_amount or 0.0),
            "status": br.status,
            "notes": clean_notes,
            "procedures": br.procedures or [],
            "date": br.created_at.isoformat() if br.created_at else None
        })

    for inv in invoices:
        if not inv.billing_request_id:
            total_charges += float(inv.net_amount or 0.0)
            stacked_items.append({
                "id": f"inv-{inv.id}",
                "type": "invoice",
                "source_type": "treatment",
                "title": f"Invoice #{inv.invoice_number}",
                "doctor_name": "Clinic Staff",
                "amount": float(inv.net_amount or 0.0),
                "status": inv.status,
                "notes": f"Invoice #{inv.invoice_number}",
                "procedures": [],
                "date": inv.created_at.isoformat() if inv.created_at else None
            })

    patient_payments = []
    total_paid = 0.0
    for inv in invoices:
        inv_pay_list = payments_by_invoice.get(inv.id, [])
        for p in inv_pay_list:
            total_paid += float(p.amount or 0.0)
            patient_payments.append({
                "id": p.id,
                "amount": float(p.amount),
                "payment_method": p.payment_method,
                "transaction_id": p.transaction_id,
                "date": p.created_at.isoformat() if p.created_at else None
            })

    stacked_items.sort(key=lambda x: x["date"] or "", reverse=True)
    outstanding_balance = max(0.0, total_charges - total_paid)

    # Fetch consultation charges (actual paid transactions)
    from modules.frontdesk.models import TransactionModel
    from modules.payment.models import ConsultationPaymentModel
    from modules.frontdesk.models import AppointmentModel

    consultation_transactions = []
    
    # 1. Fetch from TransactionModel
    txs = db.query(TransactionModel, AppointmentModel).join(
        AppointmentModel, TransactionModel.appointment_id == AppointmentModel.id
    ).filter(TransactionModel.patient_id == patient_id).all()
    
    for tx, appt in txs:
        consultation_transactions.append({
            "id": f"tx-{tx.id}",
            "type": "consultation",
            "invoiceNo": f"CNS-{tx.id}",
            "title": appt.treatment_type or "General Consultation",
            "doctor_name": appt.doctor_name,
            "amount": float(tx.amount),
            "status": "Paid",
            "payment_method": tx.payment_method,
            "date": tx.transaction_date.isoformat() if tx.transaction_date else (appt.appointment_date.isoformat() if appt.appointment_date else None)
        })
        
    # 2. Fetch from ConsultationPaymentModel (Razorpay online payments)
    if token:
        online_txs = db.query(ConsultationPaymentModel, AppointmentModel).join(
            AppointmentModel, ConsultationPaymentModel.appointment_id == AppointmentModel.id
        ).filter(ConsultationPaymentModel.patient_token == token).all()
        
        for c_tx, appt in online_txs:
            # Avoid duplicates if the same transaction was logged in both places
            if any(c.get("amount") == float(c_tx.amount) and c.get("title") == (appt.treatment_type or "General Consultation") and c.get("date").startswith(str(appt.appointment_date)) for c in consultation_transactions):
                continue
                
            consultation_transactions.append({
                "id": f"ctx-{c_tx.id}",
                "type": "consultation",
                "invoiceNo": f"ONL-{c_tx.id}",
                "title": appt.treatment_type or "General Consultation",
                "doctor_name": appt.doctor_name,
                "amount": float(c_tx.amount),
                "status": "Paid",
                "payment_method": c_tx.payment_method,
                "date": c_tx.created_at.isoformat() if c_tx.created_at else (appt.appointment_date.isoformat() if appt.appointment_date else None)
            })

    consultation_transactions.sort(key=lambda x: x["date"] or "", reverse=True)

    return {
        "patient_token": token,
        "patient_name": patient.name,
        "patient_phone": patient.phone or "",
        "total_charges": total_charges,
        "total_paid": total_paid,
        "outstanding_balance": outstanding_balance,
        "stacked_items": stacked_items,
        "payments": patient_payments,
        "consultations": consultation_transactions
    }


def _get_razorpay_credentials():
    from dotenv import load_dotenv
    backend_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    env_path = os.path.join(backend_root, ".env")
    load_dotenv(dotenv_path=env_path, override=True)
    key_id = os.getenv("RAZORPAY_KEY_ID", "")
    key_secret = os.getenv("RAZORPAY_KEY_SECRET", "")
    if not key_id or not key_secret or "rzp_test_XXXX" in key_id:
        raise HTTPException(
            status_code=503,
            detail="Payment gateway not configured. Please contact the clinic administrator.",
        )
    return key_id, key_secret


@router.post("/patient/payment/create-order")
def create_patient_payment_order(body: dict, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    patient_id = current_user.get("patient_id")
    if not patient_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    item_id_str = body.get("item_id") # e.g., 'br-12' or 'inv-15'
    amount = float(body.get("amount", 0.0))
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Invalid amount")

    key_id, key_secret = _get_razorpay_credentials()
    rz_client = razorpay.Client(auth=(key_id, key_secret))
    amount_paise = int(amount * 100)

    # In a real transaction we'd link this order to a pending payment table,
    # but since this relies on standard flow, we just generate the order.
    order_data = {
        "amount": amount_paise,
        "currency": "INR",
        "receipt": f"item_{item_id_str}",
        "notes": {
            "item_id": item_id_str,
            "patient_id": str(patient_id)
        },
    }

    try:
        rz_order = rz_client.order.create(data=order_data)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to create payment order: {str(e)}")

    return {
        "razorpay_order_id": rz_order["id"],
        "amount": amount_paise,
        "currency": "INR",
        "key_id": key_id,
        "item_id": item_id_str,
    }


@router.post("/patient/payment/verify")
def verify_patient_payment(body: dict, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    patient_id = current_user.get("patient_id")
    if not patient_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    razorpay_order_id = body.get("razorpay_order_id")
    razorpay_payment_id = body.get("razorpay_payment_id")
    razorpay_signature = body.get("razorpay_signature")
    item_id_str = body.get("item_id")
    amount = float(body.get("amount", 0.0))

    _, key_secret = _get_razorpay_credentials()
    expected_signature = hmac.new(
        key_secret.encode("utf-8"),
        f"{razorpay_order_id}|{razorpay_payment_id}".encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(expected_signature, razorpay_signature):
        raise HTTPException(status_code=400, detail="Payment verification failed: invalid signature.")

    # Mark as paid in DB
    # item_id_str could be 'br-12' or 'inv-15'
    from modules.patient.models import PatientModel
    patient = db.query(PatientModel).filter(PatientModel.id == patient_id).first()
    
    invoice_id_to_pay = None
    if item_id_str.startswith("br-"):
        br_id = int(item_id_str.replace("br-", ""))
        br = db.query(BillingRequestModel).filter(BillingRequestModel.id == br_id).first()
        if br:
            br.status = "Paid"
            
            # Find associated invoice if any, or create one
            inv = db.query(InvoiceModel).filter(InvoiceModel.billing_request_id == br.id).first()
            if not inv:
                inv = InvoiceModel(
                    patient_id=str(patient.id),
                    invoice_number=f"INV-{int(datetime.utcnow().timestamp())}",
                    billing_request_id=br.id,
                    total_amount=amount,
                    net_amount=amount,
                    status="Paid"
                )
                db.add(inv)
                db.commit()
                db.refresh(inv)
            else:
                inv.status = "Paid"
            db.commit()
            invoice_id_to_pay = inv.id
    elif item_id_str.startswith("inv-"):
        inv_id = int(item_id_str.replace("inv-", ""))
        inv = db.query(InvoiceModel).filter(InvoiceModel.id == inv_id).first()
        if inv:
            inv.amount_paid = getattr(inv, 'amount_paid', 0.0) + amount
            inv.balance_due = max(0, float(inv.net_amount or 0) - float(inv.amount_paid))
            db.commit()
            invoice_id_to_pay = inv.id
    elif item_id_str.startswith("appt-"):
        appt_id = int(item_id_str.replace("appt-", ""))
        from modules.frontdesk.models import AppointmentModel
        appt = db.query(AppointmentModel).filter(AppointmentModel.id == appt_id).first()
        if appt:
            appt.payment_status = "Paid"
            db.commit()
            
            # Also insert into ConsultationPaymentModel
            from modules.payment.models import ConsultationPaymentModel
            payment_record = ConsultationPaymentModel(
                appointment_id=appt.id,
                patient_token=patient.token,
                patient_name=patient.name,
                doctor_name=appt.doctor_name,
                payment_method="Razorpay",
                razorpay_order_id=razorpay_order_id,
                razorpay_payment_id=razorpay_payment_id,
                amount=amount,
                currency="INR",
                status="Paid",
                receptionist_name="Online Self-Pay",
                is_reconciled=False
            )
            db.add(payment_record)
            db.commit()

    if invoice_id_to_pay:
        # Create payment record
        new_payment = PaymentModel(
            invoice_id=invoice_id_to_pay,
            amount=amount,
            payment_method="Razorpay",
            transaction_id=razorpay_payment_id,
            type="Online Payment"
        )
        db.add(new_payment)
        db.commit()

    return {"status": "success", "message": "Payment verified and recorded."}



# --- Receipt Endpoint for a Billing Request ---
@router.get("/receipt/{billing_request_id}")
def get_receipt(billing_request_id: int, db: Session = Depends(get_db)):
    """
    Returns a fully populated receipt for a billing request.
    Includes clinic info, doctor info, consultation fee, and medicine prices
    fetched from lab inventory.
    """
    br = db.query(BillingRequestModel).filter(BillingRequestModel.id == billing_request_id).first()
    if not br:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Billing request not found")

    # Fetch patient info
    from modules.patient.models import PatientModel, MedicineDispenseModel
    patient = db.query(PatientModel).filter(PatientModel.token == br.patient_token).first()

    # Find matching dispense record (closest in time to billing request)
    dispense = db.query(MedicineDispenseModel).filter(
        MedicineDispenseModel.patient_token == br.patient_token
    ).order_by(MedicineDispenseModel.created_at.desc()).first()

    # Fetch inventory to look up medicine prices
    from modules.lab.models import InventoryItemModel
    inventory = db.query(InventoryItemModel).all()
    inventory_price_map = {}
    for item in inventory:
        if item.unit_price is not None:
            inventory_price_map[item.name.strip().lower()] = {
                "name": item.name,
                "unit_price": float(item.unit_price),
                "unit": item.unit or "tablet"
            }

    # Get doctor details
    from modules.doctor.models import DoctorModel
    from modules.auth.models import UserModel
    doctor_model = db.query(DoctorModel).filter(DoctorModel.name.ilike(f"%{br.doctor_name.replace('Dr. ', '')}%")).first()
    doctor_working_hours = {}
    if doctor_model:
        doctor_working_hours = doctor_model.working_hours or {}

    # Build medication line items with prices
    raw_meds = []
    if br.procedures and isinstance(br.procedures, list):
        for p in br.procedures:
            p_name = str(p.get("name") or p.get("title") or "").strip()
            if "medicine:" in p_name.lower():
                clean_name = p_name.replace("Medicine:", "").replace("medicine:", "").strip()
                raw_meds.append({
                    "medicine": clean_name,
                    "unit_price": float(p.get("rate") or p.get("cost") or 0.0),
                    "schedule": p.get("schedule", ""),
                    "timing": p.get("timing", ""),
                    "duration": p.get("duration", "")
                })

    if not raw_meds and dispense and dispense.medications:
        for m in dispense.medications:
            raw_meds.append({
                "medicine": m.get("medicine") or m.get("name") or "",
                "unit_price": float(m.get("line_total") or m.get("unit_price") or 0.0),
                "schedule": m.get("schedule", ""),
                "timing": m.get("timing", ""),
                "duration": m.get("duration", "")
            })

    medication_line_items = []
    medication_total = 0.0

    for med in raw_meds:
        med_name = (med.get("medicine") or med.get("name") or "").strip()
        if not med_name:
            continue
        inventory_entry = inventory_price_map.get(med_name.lower())
        unit_price = med.get("unit_price") if med.get("unit_price") and med.get("unit_price") > 0 else (inventory_entry["unit_price"] if inventory_entry else 0.0)
        medication_total += unit_price

        medication_line_items.append({
            "medicine": med_name,
            "schedule": med.get("schedule", ""),
            "timing": med.get("timing", ""),
            "duration": med.get("duration", ""),
            "unit_price": unit_price,
            "found_in_inventory": inventory_entry is not None or unit_price > 0
        })

    # Fetch dynamic active consultation tariff from admin clinic settings
    from modules.payment.models import ClinicSettingModel
    if br.total_amount and float(br.total_amount) > 0:
        consultation_fee = float(br.total_amount)
    else:
        notes_lower = (br.notes or "").lower()
        if "follow" in notes_lower:
            tariff_key = "followup_consultation_fee"
            default_fee = 300.0
        elif "routine" in notes_lower:
            tariff_key = "routine_checkup_fee"
            default_fee = 400.0
        else:
            tariff_key = "general_consultation_fee"
            default_fee = 500.0

        setting = db.query(ClinicSettingModel).filter(ClinicSettingModel.setting_key == tariff_key).first()
        if setting and setting.setting_value:
            try:
                consultation_fee = float(setting.setting_value)
            except ValueError:
                consultation_fee = default_fee
        else:
            consultation_fee = default_fee

    grand_total = consultation_fee + medication_total

    # Clinic info (static - can be made dynamic via admin settings later)
    clinic_info = {
        "name": "SmileCare Dental Clinic",
        "address": "123, Dental Plaza, Hyderabad - 500001",
        "phone": "+91 40 2345 6789",
        "email": "info@smilecare.com",
        "website": "www.smilecare.com"
    }

    proc_name = "Treatment Procedure"
    if br.procedures and isinstance(br.procedures, list) and len(br.procedures) > 0:
        proc_names = [p.get("name") or p.get("title", "") for p in br.procedures if (p.get("name") or p.get("title"))]
        if proc_names:
            proc_name = ", ".join(proc_names)
    elif br.source_type == "consultation":
        proc_name = "Treatment Procedure"
    else:
        proc_name = "Treatment Plan Procedure"

    return {
        "clinic": clinic_info,
        "receipt_id": f"RCP-{br.id:05d}",
        "visit_date": br.created_at.isoformat() if br.created_at else None,
        "doctor_name": br.doctor_name,
        "doctor_working_hours": doctor_working_hours,
        "patient_name": patient.name if patient else "Patient",
        "patient_token": br.patient_token,
        "patient_phone": patient.phone if patient else "",
        "source_type": br.source_type or "treatment",
        "procedure_name": proc_name,
        "consultation_fee": consultation_fee,
        "medications": medication_line_items,
        "medication_total": medication_total,
        "grand_total": grand_total,
        "status": br.status,
        "notes": br.notes
    }


