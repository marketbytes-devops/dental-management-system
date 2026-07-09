# migrate_complaints.py - Migration script for complaints table and logs
import sys
import os
from sqlalchemy import inspect, text

# Add the backend directory to path so imports work correctly
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import engine, Base
from modules.complaint.models import ComplaintModel, ComplaintStatusLogModel

def main():
    print("Starting database migration for complaints module...")
    
    # 1. Create complaint_status_logs table (using SQLAlchemy Base metadata)
    print("Verifying/creating 'complaint_status_logs' table...")
    Base.metadata.create_all(bind=engine, tables=[ComplaintStatusLogModel.__table__])
    
    # 2. Add columns to complaints table if missing
    inspector = inspect(engine)
    if not inspector.has_table("complaints"):
        print("Error: complaints table does not exist yet. Please run create_tables.py first.")
        sys.exit(1)
        
    columns = [col["name"] for col in inspector.get_columns("complaints")]
    
    # Determine the dialect
    is_postgresql = engine.dialect.name == "postgresql"
    dt_type = "TIMESTAMP WITH TIME ZONE" if is_postgresql else "DATETIME"
    
    with engine.begin() as connection:
        # Add columns if missing
        if "resolved_at" not in columns:
            print("Adding column 'resolved_at' to 'complaints' table...")
            connection.execute(text(f"ALTER TABLE complaints ADD COLUMN resolved_at {dt_type};"))
            
        if "closed_at" not in columns:
            print("Adding column 'closed_at' to 'complaints' table...")
            connection.execute(text(f"ALTER TABLE complaints ADD COLUMN closed_at {dt_type};"))
            
        if "related_complaint_id" not in columns:
            print("Adding column 'related_complaint_id' to 'complaints' table...")
            connection.execute(text("ALTER TABLE complaints ADD COLUMN related_complaint_id INTEGER REFERENCES complaints(id) ON DELETE SET NULL;"))
            
        # 3. Populate initial status logs for existing complaints if they have none
        existing_complaints = connection.execute(text("SELECT id, status, user_id, created_at FROM complaints")).fetchall()
        for row in existing_complaints:
            c_id, status, user_id, created_at = row
            # Check if log already exists
            existing_log = connection.execute(
                text("SELECT id FROM complaint_status_logs WHERE complaint_id = :c_id"),
                {"c_id": c_id}
            ).fetchone()
            
            if not existing_log:
                print(f"Creating initial audit log for existing complaint ID {c_id} (Status: {status})...")
                connection.execute(
                    text("""
                        INSERT INTO complaint_status_logs (complaint_id, from_status, to_status, changed_by, note, created_at)
                        VALUES (:c_id, NULL, :status, :user_id, 'Migration: Initial complaint state', :created_at)
                    """),
                    {"c_id": c_id, "status": status, "user_id": user_id, "created_at": created_at}
                )
                
    print("Database migration completed successfully!")

if __name__ == "__main__":
    main()
