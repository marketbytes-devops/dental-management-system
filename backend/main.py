# main.py - Single entry point, everyone's routers register here
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import routers from modules
from modules.auth.router import router as auth_router
from modules.admin.router import router as admin_router
from modules.patient.router import router as patient_router
from modules.frontdesk.router import router as frontdesk_router
from modules.lab.router import router as lab_router
from modules.leave.router import router as leave_router
from modules.treatment_plan.router import router as treatment_plan_router


from database import Base, engine, SessionLocal
from modules.auth.models import UserModel
from modules.patient.models import PatientModel, PatientConsentModel
from modules.frontdesk.models import AppointmentModel
from modules.frontdesk.communication_models import CommunicationLogModel
from modules.lab.models import LabOrderModel, LabNotificationModel
from modules.doctor.models import DoctorModel
from modules.admin.models import AdminModel
from modules.leave.models import LeaveRequestModel
from modules.treatment_plan.models import TreatmentPlanModel, TreatmentPlanStepModel
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
    allow_origins=["*"],
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



@app.get("/")
def read_root():
    return {"message": "Welcome to the SmileCare Dental CRM backend API"}
