# create_tables.py - Script to initialize database tables
import sys
import os

# Add the backend directory to path so imports work correctly
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import Base, engine
from modules.auth.models import UserModel
from modules.patient.models import PatientModel, PatientConsentModel
from modules.frontdesk.models import AppointmentModel
from modules.frontdesk.communication_models import CommunicationLogModel
from modules.lab.models import LabOrderModel
from modules.doctor.models import DoctorModel, ReferralModel
from modules.admin.models import AdminModel
from modules.leave.models import LeaveRequestModel
from modules.treatment_plan.models import TreatmentPlanModel, TreatmentPlanStepModel
from modules.complaint.models import ComplaintModel, ComplaintStatusLogModel
from modules.smilecare.models import DentalChartModel, ToothModel, ToothSurfaceModel, ClinicalFindingModel


def main():
    print("Initializing database tables for all modules...")
    try:
        # This will create all tables defined by models imported above
        Base.metadata.create_all(bind=engine)
        print("Database tables created successfully!")
    except Exception as e:
        print(f"Error creating database tables: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
