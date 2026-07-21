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
