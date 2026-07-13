import sys
import os

# Add the backend directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
from modules.procedures.models import ProcedureModel

def seed_prosthodontics():
    db = SessionLocal()
    try:
        procedures_to_add = [
            {
                "name": "Crown – Single Tooth",
                "description": "Custom dental crown for a single tooth restoration",
                "rate": 5000.0,
                "specialty": "Prosthodontics",
                "parent_id": None,
                "is_active": True
            },
            {
                "name": "Bridge (multi-tooth)",
                "description": "Dental bridge to replace multiple missing teeth",
                "rate": 15000.0,
                "specialty": "Prosthodontics",
                "parent_id": None,
                "is_active": True
            },
            {
                "name": "Complete Denture (full set)",
                "description": "Full mouth complete denture set",
                "rate": 25000.0,
                "specialty": "Prosthodontics",
                "parent_id": None,
                "is_active": True
            },
            {
                "name": "Partial Denture (removable)",
                "description": "Removable partial denture for missing teeth replacement",
                "rate": 8000.0,
                "specialty": "Prosthodontics",
                "parent_id": None,
                "is_active": True
            },
            {
                "name": "Implant-Supported Crown/Bridge",
                "description": "Implant retained custom dental crown or bridge",
                "rate": 45000.0,
                "specialty": "Prosthodontics",
                "parent_id": None,
                "is_active": True
            },
            {
                "name": "Veneers",
                "description": "Cosmetic porcelain or composite dental veneers per tooth",
                "rate": 12000.0,
                "specialty": "Prosthodontics",
                "parent_id": None,
                "is_active": True
            }
        ]

        print("Checking for existing procedures to avoid duplicates...")
        added_count = 0
        for p in procedures_to_add:
            # Check if procedure already exists in Prosthodontics
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
    seed_prosthodontics()
