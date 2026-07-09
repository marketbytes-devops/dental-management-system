# migrate_clinical_notes.py - Migration script to create patient_clinical_notes table
import sys
import os

# Add the backend directory to path so imports work correctly
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import engine, Base
from modules.patient.models import ClinicalNoteModel

def main():
    print("Starting database migration for clinical notes...")
    print("Verifying/creating 'patient_clinical_notes' table...")
    
    # Create the table using SQLAlchemy Base metadata
    Base.metadata.create_all(bind=engine, tables=[ClinicalNoteModel.__table__])
    
    print("Database table 'patient_clinical_notes' verified/created successfully!")

if __name__ == "__main__":
    main()
