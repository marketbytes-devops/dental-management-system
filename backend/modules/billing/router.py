from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any
from database import get_db
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
    new_payment = PaymentModel(**payment.dict())
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
        patient_name = pat.name if pat else "Unknown Patient"
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

            # Build a meaningful title from procedures or notes
            if br.procedures and isinstance(br.procedures, list) and len(br.procedures) > 0:
                proc_names = [p.get("name", "") for p in br.procedures if p.get("name")]
                item_title = ", ".join(proc_names) if proc_names else f"{source_tag.capitalize()} Charge"
            elif br.notes and br.notes.strip():
                item_title = br.notes.strip()
            else:
                item_title = f"{source_tag.capitalize()} Charge"

            stacked_items.append({
                "id": f"br-{br.id}",
                "type": "billing_request",
                "source_type": source_tag,
                "title": item_title,
                "doctor_name": br.doctor_name,
                "amount": float(br.total_amount or 0.0),
                "status": br.status,
                "notes": br.notes,
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

    # Sort ledgers by total_charges desc
    ledgers.sort(key=lambda x: x["total_charges"], reverse=True)
    return ledgers


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
    medications = dispense.medications if dispense and dispense.medications else []
    medication_line_items = []
    medication_total = 0.0

    for med in medications:
        med_name = (med.get("medicine") or med.get("name") or "").strip()
        inventory_entry = inventory_price_map.get(med_name.lower())
        unit_price = inventory_entry["unit_price"] if inventory_entry else 0.0
        medication_total += unit_price

        medication_line_items.append({
            "medicine": med_name,
            "schedule": med.get("schedule", ""),
            "timing": med.get("timing", ""),
            "duration": med.get("duration", ""),
            "unit_price": unit_price,
            "found_in_inventory": inventory_entry is not None
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

    return {
        "clinic": clinic_info,
        "receipt_id": f"RCP-{br.id:05d}",
        "visit_date": br.created_at.isoformat() if br.created_at else None,
        "doctor_name": br.doctor_name,
        "doctor_working_hours": doctor_working_hours,
        "patient_name": patient.name if patient else "Unknown Patient",
        "patient_token": br.patient_token,
        "patient_phone": patient.phone if patient else "",
        "consultation_fee": consultation_fee,
        "medications": medication_line_items,
        "medication_total": medication_total,
        "grand_total": grand_total,
        "status": br.status,
        "notes": br.notes
    }


