import sys
import os

# Add the backend directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
from modules.procedures.models import ProcedureModel

def seed_oral_surgery():
    db = SessionLocal()
    try:
        procedures_to_add = [
            {
                "name": "Simple Extraction",
                "description": "Routine removal of an visible tooth under local anesthesia",
                "rate": 2000.0,
                "specialty": "Oral Surgery",
                "parent_id": None,
                "is_active": True
            },
            {
                "name": "Surgical Extraction (impacted tooth, wisdom tooth)",
                "description": "Complex extraction of an impacted or wisdom tooth requiring surgical access",
                "rate": 8000.0,
                "specialty": "Oral Surgery",
                "parent_id": None,
                "is_active": True
            },
            {
                "name": "Orthognathic Surgery",
                "description": "Corrective jaw surgery to fix skeletal and dental irregularities",
                "rate": 150000.0,
                "specialty": "Oral Surgery",
                "parent_id": None,
                "is_active": True
            }
        ]

        print("Checking for existing procedures to avoid duplicates...")
        added_count = 0
        for p in procedures_to_add:
            # Check if procedure already exists in Oral Surgery
            existing = db.query(ProcedureModel).filter(
                ProcedureModel.name == p["name"],
                ProcedureModel.specialty == p["specialty"]
            ).first()
            
            if not existing:
                print(f"Adding: {p['name']} (Rate: Rs. {p['rate']})")
                new_proc = ProcedureModel(**p)
                db.add(new_proc)
                added_count += 1
            else:
                print(f"Skipping duplicate: {p['name']}")
        
        if added_count > 0:
            db.commit()
            print(f"Seeding completed successfully! Added {added_count} procedures.")
        else:
            print("No new procedures were added (all already exist).")
            
    except Exception as e:
        print("Error during seed:", e)
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_oral_surgery()
