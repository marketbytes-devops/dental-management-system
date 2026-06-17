# create_tables.py - Script to initialize database tables
import sys
import os

# Add the backend directory to path so imports work correctly
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import Base, engine
from modules.doctor.models import DoctorModel, ReferralModel

def main():
    print("Initializing database tables for Doctor module...")
    try:
        # This will create all tables defined by models imported above
        Base.metadata.create_all(bind=engine)
        print("Database tables created successfully!")
    except Exception as e:
        print(f"Error creating database tables: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
