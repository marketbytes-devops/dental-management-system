from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from database import get_db
from modules.frontdesk.models import AppointmentModel
from modules.treatment_plan.models import TreatmentPlanModel, TreatmentPlanStepModel
from modules.patient.models import DoctorFeedbackModel
from modules.doctor.models import DoctorShiftModel
from modules.doctor.schemas import DoctorShiftCreate, DoctorShiftResponse
from typing import Dict, Any, Optional
from datetime import datetime, timedelta

router = APIRouter(
    prefix="/doctor",
    tags=["Doctor"]
)

@router.get("/performance/{doctor_name}")
def get_doctor_performance(
    doctor_name: str, 
    period: Optional[str] = Query("all", description="Time period filter: 'all', 'this_month', 'last_30_days', 'this_year'"),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    
    # Date Filtering Logic
    now = datetime.utcnow()
    filter_date = None
    if period == "this_month":
        filter_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    elif period == "last_30_days":
        filter_date = now - timedelta(days=30)
    elif period == "this_year":
        filter_date = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)

    # 1. Patients Treated & Appointments Analytics
    appt_query = db.query(AppointmentModel).filter(
        AppointmentModel.doctor_name.ilike(f"%{doctor_name}%")
    )
    if filter_date:
        appt_query = appt_query.filter(AppointmentModel.created_at >= filter_date)
    all_appts = appt_query.all()
    
    patients_treated = len([a for a in all_appts if a.status == "Completed"])
    
    # 1a. Appointment Status Breakdown
    status_counts = {}
    for a in all_appts:
        st = a.status or "Unknown"
        status_counts[st] = status_counts.get(st, 0) + 1
        
    status_breakdown = [{"name": k, "value": v} for k, v in status_counts.items()]
    
    # 1b. Patient Volume Trend (Group by date)
    from collections import defaultdict
    volume_by_date = defaultdict(int)
    for a in all_appts:
        if a.appointment_date:
            date_str = a.appointment_date.strftime("%b %d")
            volume_by_date[date_str] += 1
            
    # Sort dates sequentially (simplistic alphabetical sort by string for display)
    # Ideally should sort by actual date object
    sorted_dates = sorted(volume_by_date.keys(), key=lambda d: datetime.strptime(d + f" {now.year}", "%b %d %Y") if d else now)
    volume_trend = [{"date": d, "appointments": volume_by_date[d]} for d in sorted_dates]

    # 2. Revenue Generated & Procedure Yield
    steps_query = db.query(TreatmentPlanStepModel).join(
        TreatmentPlanModel, TreatmentPlanModel.id == TreatmentPlanStepModel.plan_id
    ).filter(
        TreatmentPlanModel.doctor_name.ilike(f"%{doctor_name}%"),
        TreatmentPlanStepModel.status == "Completed"
    )
    if filter_date:
        steps_query = steps_query.filter(TreatmentPlanStepModel.updated_at >= filter_date)
    completed_steps = steps_query.all()

    revenue_generated = 0
    yield_stats = {}

    for step in completed_steps:
        cost = step.cost or 0
        revenue_generated += cost
        
        title = step.title or "Other"
        if title not in yield_stats:
            yield_stats[title] = {"count": 0, "revenue": 0}
        yield_stats[title]["count"] += 1
        yield_stats[title]["revenue"] += cost

    procedure_yield = []
    if revenue_generated > 0:
        for title, data in yield_stats.items():
            percentage = round((data["revenue"] / revenue_generated) * 100, 1)
            color = "bg-primary"
            if percentage < 20:
                color = "bg-warning"
            elif percentage > 50:
                color = "bg-success"
            
            procedure_yield.append({
                "name": title,
                "count": data["count"],
                "revenue": data["revenue"],
                "percentage": percentage,
                "color": color
            })
    
    procedure_yield.sort(key=lambda x: x["revenue"], reverse=True)

    # 3. Clinic Rating (Patient Feedback)
    feedback_query = db.query(DoctorFeedbackModel).filter(
        DoctorFeedbackModel.doctor_name.ilike(f"%{doctor_name}%")
    )
    if filter_date:
        feedback_query = feedback_query.filter(DoctorFeedbackModel.created_at >= filter_date)
    feedbacks = feedback_query.order_by(DoctorFeedbackModel.created_at.desc()).all()
    
    total_reviews = len(feedbacks)
    average_rating = sum([f.rating for f in feedbacks]) / total_reviews if total_reviews > 0 else 0.0

    recent_reviews = []
    for f in feedbacks[:5]:
        recent_reviews.append({
            "id": f.id,
            "patient_name": f.patient_name,
            "rating": f.rating,
            "feedback_text": f.feedback_text,
            "date": f.created_at.strftime("%b %d, %Y") if f.created_at else "Recently"
        })

    return {
        "kpis": {
            "patientsTreated": patients_treated,
            "revenueGenerated": revenue_generated,
            "averageRating": round(average_rating, 1),
            "totalReviews": total_reviews,
            "period": period
        },
        "procedureYield": procedure_yield,
        "recentReviews": recent_reviews,
        "volumeTrend": volume_trend,
        "statusBreakdown": status_breakdown
    }

@router.get("/appointments/{doctor_name}")
def get_doctor_appointments(doctor_name: str, filter: str = "today", db: Session = Depends(get_db)):
    import calendar
    from datetime import date, timedelta
    from modules.patient.models import PatientModel

    today = date.today()
    
    query = db.query(AppointmentModel).filter(
        AppointmentModel.doctor_name.ilike(f"%{doctor_name}%")
    )
    
    if filter == "today":
        query = query.filter(AppointmentModel.appointment_date == today)
    elif filter == "tomorrow":
        tomorrow = today + timedelta(days=1)
        query = query.filter(AppointmentModel.appointment_date == tomorrow)
    elif filter == "this_month":
        _, last_day = calendar.monthrange(today.year, today.month)
        first_date = today.replace(day=1)
        last_date = today.replace(day=last_day)
        query = query.filter(AppointmentModel.appointment_date >= first_date, AppointmentModel.appointment_date <= last_date)
    elif filter.startswith("month_"):
        # Format expected: month_YYYY-MM
        try:
            parts = filter.split("_")[1].split("-")
            year, month = int(parts[0]), int(parts[1])
            _, last_day = calendar.monthrange(year, month)
            first_date = date(year, month, 1)
            last_date = date(year, month, last_day)
            query = query.filter(AppointmentModel.appointment_date >= first_date, AppointmentModel.appointment_date <= last_date)
        except Exception as e:
            pass
            
    appointments = query.order_by(AppointmentModel.appointment_date.asc(), AppointmentModel.appointment_time.asc()).all()
    
    result = []
    for appt in appointments:
        patient = db.query(PatientModel).filter(PatientModel.id == appt.patient_id).first()
                
        result.append({
            "id": appt.id,
            "patient_id": appt.patient_id,
            "patient_name": patient.name if patient else "Unknown",
            "token_id": patient.token if patient and patient.token else f"PT-{appt.patient_id}",
            "treatment_type": appt.treatment_type,
            "status": appt.status,
            "appointment_date": appt.appointment_date.strftime("%Y-%m-%d"),
            "appointment_time": appt.appointment_time,
            "payment_status": "Paid" if appt.status == "Completed" else "Pending"
        })
        
    return result

@router.post("/{doctor_id}/shifts", response_model=DoctorShiftResponse)
def create_doctor_shift(doctor_id: int, shift_data: DoctorShiftCreate, db: Session = Depends(get_db)):
    # Create a new shift
    db_shift = DoctorShiftModel(
        doctor_id=doctor_id,
        day_of_week=shift_data.day_of_week,
        specific_date=shift_data.specific_date,
        start_time=shift_data.start_time,
        end_time=shift_data.end_time,
        slot_duration=shift_data.slot_duration
    )
    db.add(db_shift)
    db.commit()
    db.refresh(db_shift)
    return db_shift

@router.get("/{doctor_id}/shifts", response_model=list[DoctorShiftResponse])
def get_doctor_shifts(doctor_id: int, db: Session = Depends(get_db)):
    shifts = db.query(DoctorShiftModel).filter(DoctorShiftModel.doctor_id == doctor_id).all()
    return shifts
