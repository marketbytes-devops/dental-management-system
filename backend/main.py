# main.py - Single entry point, everyone's routers register here
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware

# Import routers from modules
from modules.auth.router import router as auth_router
from modules.admin.router import router as admin_router
from modules.patient.router import router as patient_router
from modules.frontdesk.router import router as frontdesk_router
from modules.lab.router import router as lab_router
from modules.leave.router import router as leave_router
from modules.treatment_plan.router import router as treatment_plan_router
from modules.complaint.router import router as complaint_router



from database import Base, engine, SessionLocal
from modules.auth.models import UserModel, StaffProfileModel
from modules.patient.models import PatientModel, PatientConsentModel
from modules.auth.models import UserModel
from modules.patient.models import PatientModel, PatientConsentModel, PatientPrescriptionModel, PatientNotificationModel, DoctorFeedbackModel
from modules.frontdesk.models import AppointmentModel
from modules.frontdesk.communication_models import CommunicationLogModel
from modules.lab.models import LabOrderModel, LabNotificationModel, LabVendorModel, LabOrderCommentModel, LabAuditTrailModel
from modules.doctor.models import DoctorModel, ReferralModel
from modules.admin.models import AdminModel
from modules.leave.models import LeaveRequestModel
from modules.treatment_plan.models import TreatmentPlanModel, TreatmentPlanStepModel
from modules.complaint.models import ComplaintModel
from modules.auth.service import hash_password



# Create database tables
Base.metadata.create_all(bind=engine)

# Run schema migrations for missing columns in remote PostgreSQL
from sqlalchemy import text
try:
    with engine.begin() as conn:
        if not engine.url.drivername.startswith("sqlite"):
            conn.execute(text("ALTER TABLE lab_orders ADD COLUMN IF NOT EXISTS lab_name VARCHAR;"))
            conn.execute(text("ALTER TABLE lab_orders ADD COLUMN IF NOT EXISTS rejection_reason VARCHAR;"))
            conn.execute(text("ALTER TABLE lab_orders ADD COLUMN IF NOT EXISTS treatment_plan_step_id INTEGER;"))
            conn.execute(text("ALTER TABLE lab_orders ADD COLUMN IF NOT EXISTS tooth_quadrant VARCHAR;"))
            conn.execute(text("ALTER TABLE lab_orders ADD COLUMN IF NOT EXISTS procedure_code VARCHAR;"))
            conn.execute(text("ALTER TABLE lab_orders ADD COLUMN IF NOT EXISTS margin_design VARCHAR;"))
            conn.execute(text("ALTER TABLE lab_orders ADD COLUMN IF NOT EXISTS impression_type VARCHAR;"))
            conn.execute(text("ALTER TABLE lab_orders ADD COLUMN IF NOT EXISTS attachments JSON;"))
            conn.execute(text("ALTER TABLE lab_orders ADD COLUMN IF NOT EXISTS parent_order_id VARCHAR;"))
            conn.execute(text("ALTER TABLE lab_orders ADD COLUMN IF NOT EXISTS rejection_category VARCHAR;"))
            conn.execute(text("ALTER TABLE lab_orders ADD COLUMN IF NOT EXISTS vendor_id INTEGER;"))
            conn.execute(text("ALTER TABLE lab_orders ADD COLUMN IF NOT EXISTS courier_name VARCHAR;"))
            conn.execute(text("ALTER TABLE lab_orders ADD COLUMN IF NOT EXISTS tracking_number VARCHAR;"))
            conn.execute(text("ALTER TABLE lab_orders ADD COLUMN IF NOT EXISTS dispatch_date VARCHAR;"))
            conn.execute(text("ALTER TABLE lab_orders ADD COLUMN IF NOT EXISTS expected_return_date VARCHAR;"))
            conn.execute(text("ALTER TABLE lab_orders ADD COLUMN IF NOT EXISTS external_cost INTEGER;"))
            conn.execute(text("ALTER TABLE lab_orders ADD COLUMN IF NOT EXISTS stage VARCHAR DEFAULT 'New Cases';"))
            
            conn.execute(text("ALTER TABLE patient_consents ADD COLUMN IF NOT EXISTS patient_id INTEGER;"))
            conn.execute(text("ALTER TABLE patient_consents ADD COLUMN IF NOT EXISTS doctor_id INTEGER;"))
            conn.execute(text("ALTER TABLE patient_consents ADD COLUMN IF NOT EXISTS content VARCHAR;"))
            conn.execute(text("ALTER TABLE patient_consents ADD COLUMN IF NOT EXISTS signing_method VARCHAR;"))
            conn.execute(text("ALTER TABLE patient_consents ADD COLUMN IF NOT EXISTS pdf_file_path VARCHAR;"))
            print("Database migrations applied successfully.")
except Exception as e:
    print(f"Error running database migrations: {e}")

# Seed default admin user if not exists
db = SessionLocal()
try:
    admin_exists = db.query(UserModel).filter(UserModel.username == "admin").first()
    if not admin_exists:
        admin_user = UserModel(
            name="Admin User",
            email="admin@smilecare.com",
            username="admin",
            password_hash=hash_password("admin123"),
            roles=["Admin"],
            specialties=[],
            status="Active"
        )
        db.add(admin_user)
        db.commit()
except Exception as e:
    print(f"Error seeding default admin: {e}")
finally:
    db.close()

app = FastAPI(title="SmileCare Dental Management API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(patient_router)
app.include_router(frontdesk_router)
app.include_router(lab_router)
app.include_router(leave_router)
app.include_router(treatment_plan_router)
app.include_router(complaint_router)




@app.get("/")
def read_root():
    return {"message": "Welcome to the SmileCare Dental CRM backend API"}


# ---------------------------------------------------------------------------
# Public About-Us stats (no authentication required)
# ---------------------------------------------------------------------------

from sqlalchemy.orm import Session
from database import get_db

@app.get("/public/about-stats")
def get_about_stats(db: Session = Depends(get_db)):
    from modules.auth.models import UserModel
    from modules.patient.models import PatientModel
    from modules.doctor.models import DoctorModel

    # Collect all doctor users
    all_users = db.query(UserModel).all()
    doctor_users = [u for u in all_users if any(r.lower() == "doctor" for r in (u.roles or []))]
    total_doctors = len(doctor_users)

    doctors_list = []
    for u in doctor_users:
        doc = db.query(DoctorModel).filter(DoctorModel.user_id == u.id).first()
        specialty = doc.specialty if (doc and doc.specialty) else (", ".join(u.specialties) if u.specialties else "General Dentistry")
        doctors_list.append({
            "id": u.id,
            "name": u.name if u.name.startswith("Dr. ") else f"Dr. {u.name}",
            "specialty": specialty,
            "status": u.status,
        })

    total_patients = db.query(PatientModel).count()
    total_staff = db.query(UserModel).count()

    return {
        "total_patients": total_patients,
        "total_doctors": total_doctors,
        "total_staff": total_staff,
        "doctors": doctors_list,
    }
