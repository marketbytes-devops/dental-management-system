import sys
import os

# Add the backend directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
from modules.procedures.models import ProcedureModel

def seed_general_dentistry():
    db = SessionLocal()
    try:
        procedures_to_add = [
            {
                "name": "Dental Filling – Composite",
                "description": "Composite resin tooth-colored filling restoration",
                "rate": 1500.0,
                "specialty": "General Dentistry",
                "parent_id": None,
                "is_active": True
            },
            {
                "name": "Dental Filling – Amalgam",
                "description": "Silver amalgam filling restoration",
                "rate": 1200.0,
                "specialty": "General Dentistry",
                "parent_id": None,
                "is_active": True
            },
            {
                "name": "Teeth Cleaning / Polishing",
                "description": "Professional scaling and teeth polishing",
                "rate": 1800.0,
                "specialty": "General Dentistry",
                "parent_id": None,
                "is_active": True
            },
            {
                "name": "Fluoride Treatment",
                "description": "Topical fluoride application for strengthening enamel",
                "rate": 1000.0,
                "specialty": "General Dentistry",
                "parent_id": None,
                "is_active": True
            },
            {
                "name": "Sealants (pit and fissure)",
                "description": "Preventive pit and fissure sealants for teeth",
                "rate": 800.0,
                "specialty": "General Dentistry",
                "parent_id": None,
                "is_active": True
            },
            {
                "name": "Teeth Whitening",
                "description": "In-office teeth bleaching and whitening treatment",
                "rate": 8000.0,
                "specialty": "General Dentistry",
                "parent_id": None,
                "is_active": True
            },
            {
                "name": "Night Guard / Occlusal Splint",
                "description": "Custom night guard to prevent bruxism and teeth grinding",
                "rate": 3500.0,
                "specialty": "General Dentistry",
                "parent_id": None,
                "is_active": True
            }
        ]

        print("Checking for existing procedures to avoid duplicates...")
        added_count = 0
        for p in procedures_to_add:
            # Check if procedure already exists in General Dentistry
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
    seed_general_dentistry()
