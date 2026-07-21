# main.py - Single entry point, everyone's routers register here
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Import routers from modules
from modules.auth.router import router as auth_router
from modules.admin.router import router as admin_router
from modules.patient.router import router as patient_router
from modules.frontdesk.router import router as frontdesk_router
from modules.lab.router import router as lab_router
from modules.leave.router import router as leave_router
from modules.treatment_plan.router import router as treatment_plan_router
from modules.smilecare.router import router as smilecare_router
from modules.doctor.router import router as doctor_router
from modules.procedures.router import router as procedures_router
from modules.billing.router import router as billing_router
from modules.payment.router import router as payment_router



from database import Base, engine, SessionLocal
from modules.auth.models import UserModel, StaffProfileModel
from modules.patient.models import PatientModel, PatientConsentModel
from modules.auth.models import UserModel
from modules.patient.models import PatientModel, PatientConsentModel, PatientPrescriptionModel, PatientNotificationModel, DoctorFeedbackModel
from modules.frontdesk.models import AppointmentModel
from modules.frontdesk.communication_models import CommunicationLogModel
from modules.lab.models import LabOrderModel, LabNotificationModel, LabVendorModel, LabOrderCommentModel, LabAuditTrailModel, InventoryItemModel, RestockRequestModel, ClinicalEncounterModel, ProstheticCaseDetailModel, PathologyCaseDetailModel
from modules.doctor.models import DoctorModel, ReferralModel
from modules.admin.models import AdminModel
from modules.leave.models import LeaveRequestModel
from modules.treatment_plan.models import TreatmentPlanModel, TreatmentPlanStepModel
from modules.procedures.models import ProcedureModel
from modules.billing.models import BillingRequestModel
from modules.payment.models import ConsultationPaymentModel
from modules.auth.service import hash_password



# Create database tables
Base.metadata.create_all(bind=engine)

# Run schema migrations for missing columns in both SQLite and PostgreSQL
from sqlalchemy import text
try:
    if engine is not None:
        with engine.begin() as conn:
            # Query existing columns for lab_orders
            if engine.dialect.name == "sqlite":
                col_query = conn.execute(text("PRAGMA table_info(lab_orders);")).fetchall()
                existing_cols = [row[1] for row in col_query]
            else:
                col_query = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='lab_orders';")).fetchall()
                existing_cols = [row[0] for row in col_query]
            
            # Helper to add column if it doesn't exist
            def add_col_if_missing(col_name, col_type):
                if col_name not in existing_cols:
                    conn.execute(text(f"ALTER TABLE lab_orders ADD COLUMN {col_name} {col_type};"))
                    print(f"Added column {col_name} to lab_orders.")

            # List of columns to migrate
            add_col_if_missing("lab_name", "VARCHAR")
            add_col_if_missing("rejection_reason", "VARCHAR")
            add_col_if_missing("treatment_plan_step_id", "INTEGER")
            add_col_if_missing("tooth_quadrant", "VARCHAR")
            add_col_if_missing("procedure_code", "VARCHAR")
            add_col_if_missing("margin_design", "VARCHAR")
            add_col_if_missing("impression_type", "VARCHAR")
            add_col_if_missing("attachments", "JSON")
            add_col_if_missing("parent_order_id", "VARCHAR")
            add_col_if_missing("rejection_category", "VARCHAR")
            add_col_if_missing("vendor_id", "INTEGER")
            add_col_if_missing("courier_name", "VARCHAR")
            add_col_if_missing("tracking_number", "VARCHAR")
            add_col_if_missing("dispatch_date", "VARCHAR")
            add_col_if_missing("expected_return_date", "VARCHAR")
            add_col_if_missing("external_cost", "INTEGER")
            add_col_if_missing("stage", "VARCHAR DEFAULT 'New Cases'")
            add_col_if_missing("order_category", "VARCHAR DEFAULT 'Prosthetic'")
            add_col_if_missing("order_details", "JSON")
            add_col_if_missing("result_document_url", "VARCHAR")
            add_col_if_missing("is_rework", "BOOLEAN DEFAULT FALSE")
            add_col_if_missing("original_case_id", "VARCHAR")
            add_col_if_missing("tech_notes", "VARCHAR")
            add_col_if_missing("email_sent_at", "VARCHAR")

            # Also check patient_consents table
            if engine.dialect.name == "sqlite":
                consent_col_query = conn.execute(text("PRAGMA table_info(patient_consents);")).fetchall()
                existing_consent_cols = [row[1] for row in consent_col_query]
            else:
                consent_col_query = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='patient_consents';")).fetchall()
                existing_consent_cols = [row[0] for row in consent_col_query]

            def add_consent_col_if_missing(col_name, col_type):
                if col_name not in existing_consent_cols:
                    conn.execute(text(f"ALTER TABLE patient_consents ADD COLUMN {col_name} {col_type};"))

            add_consent_col_if_missing("patient_id", "INTEGER")
            add_consent_col_if_missing("doctor_id", "INTEGER")
            add_consent_col_if_missing("content", "VARCHAR")
            add_consent_col_if_missing("signing_method", "VARCHAR")
            add_consent_col_if_missing("pdf_file_path", "VARCHAR")

            # Also check lab_inventory_items table
            if engine.dialect.name == "sqlite":
                inv_col_query = conn.execute(text("PRAGMA table_info(lab_inventory_items);")).fetchall()
                existing_inv_cols = [row[1] for row in inv_col_query]
            else:
                inv_col_query = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='lab_inventory_items';")).fetchall()
                existing_inv_cols = [row[0] for row in inv_col_query]

            def add_inv_col_if_missing(col_name, col_type):
                if col_name not in existing_inv_cols:
                    conn.execute(text(f"ALTER TABLE lab_inventory_items ADD COLUMN {col_name} {col_type};"))

            add_inv_col_if_missing("supplier", "VARCHAR")
            add_inv_col_if_missing("expiry_date", "VARCHAR")
            add_inv_col_if_missing("batch_number", "VARCHAR")
            add_inv_col_if_missing("unit_price", "FLOAT")

            # Also check procedures table
            if engine.dialect.name == "sqlite":
                proc_col_query = conn.execute(text("PRAGMA table_info(procedures);")).fetchall()
                existing_proc_cols = [row[1] for row in proc_col_query]
            else:
                proc_col_query = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='procedures';")).fetchall()
                existing_proc_cols = [row[0] for row in proc_col_query]

            if "parent_id" not in existing_proc_cols:
                conn.execute(text("ALTER TABLE procedures ADD COLUMN parent_id INTEGER;"))
                print("Added column parent_id to procedures table.")

            if "specialty" not in existing_proc_cols:
                conn.execute(text("ALTER TABLE procedures ADD COLUMN specialty VARCHAR DEFAULT 'General Dentistry';"))
                print("Added column specialty to procedures table.")

            # Also check treatment_plans table
            if engine.dialect.name == "sqlite":
                tp_col_query = conn.execute(text("PRAGMA table_info(treatment_plans);")).fetchall()
                existing_tp_cols = [row[1] for row in tp_col_query]
            else:
                tp_col_query = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='treatment_plans';")).fetchall()
                existing_tp_cols = [row[0] for row in tp_col_query]

            def add_tp_col_if_missing(col_name, col_type):
                if col_name not in existing_tp_cols:
                    conn.execute(text(f"ALTER TABLE treatment_plans ADD COLUMN {col_name} {col_type};"))
                    print(f"Added column {col_name} to treatment_plans table.")

            add_tp_col_if_missing("next_visit_date", "VARCHAR")
            add_tp_col_if_missing("next_visit_procedure", "VARCHAR")

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
    
    # Seed default lab vendors if table is empty
    vendor_count = db.query(LabVendorModel).count()
    if vendor_count == 0:
        default_vendors = [
            LabVendorModel(
                name="Apex Dental Laboratories",
                contact_person="Rajesh Kumar",
                phone="+91 40 2345 6789",
                email="apex@dentalab.com",
                average_tat_days=5,
                pricing_list={"Zirconia Crown": 3500, "E-max Veneer": 4500},
                rating=4.8
            ),
            LabVendorModel(
                name="Precision Milling Centre",
                contact_person="Amit Sharma",
                phone="+91 40 6678 9012",
                email="precision@millingcentre.com",
                average_tat_days=3,
                pricing_list={"CAD-CAM Milling": 2000, "PMMA Temporary": 1200},
                rating=4.7
            ),
            LabVendorModel(
                name="City Path Labs",
                contact_person="Srinivas Rao",
                phone="+91 40 4456 7890",
                email="citypath@pathlabs.com",
                average_tat_days=2,
                pricing_list={"CBC": 500, "Biopsy": 1500},
                rating=4.5
            )
        ]
        db.add_all(default_vendors)
        db.commit()
        print("Default lab vendors seeded successfully.")
except Exception as e:
    print(f"Error seeding default admin: {e}")
finally:
    db.close()

app = FastAPI(title="SmileCare Dental Management API", version="1.0.0")

app.mount("/static", StaticFiles(directory="static"), name="static")

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=".*",
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
app.include_router(smilecare_router)
app.include_router(doctor_router)
app.include_router(procedures_router)
app.include_router(billing_router)
app.include_router(payment_router)




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
        if doc and doc.specialty:
            specialty = doc.specialty
        elif isinstance(u.specialties, list) and u.specialties:
            specialty = ", ".join(str(s) for s in u.specialties)
        else:
            specialty = "General Dentistry"
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
