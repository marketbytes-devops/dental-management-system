import sys
import os

# Add the backend directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
from modules.procedures.models import ProcedureModel

def seed_orthodontics():
    db = SessionLocal()
    try:
        # Parent procedures
        parents = [
            {
                "name": "Metallic Braces Treatment",
                "description": "Comprehensive orthodontic treatment using stainless steel brackets and archwires.",
                "rate": 35000.0,
                "specialty": "Orthodontics",
                "parent_id": None,
                "is_active": True
            },
            {
                "name": "Ceramic Braces Treatment",
                "description": "Esthetic tooth-colored ceramic bracket orthodontic treatment.",
                "rate": 50000.0,
                "specialty": "Orthodontics",
                "parent_id": None,
                "is_active": True
            },
            {
                "name": "Clear Aligners (Invisalign)",
                "description": "Custom transparent removable aligners for discreet teeth straightening.",
                "rate": 85000.0,
                "specialty": "Orthodontics",
                "parent_id": None,
                "is_active": True
            },
            {
                "name": "Orthodontic Consultation & Cephalometric Analysis",
                "description": "Initial orthodontic assessment, facial photography, cephalometric analysis, and treatment planning.",
                "rate": 2500.0,
                "specialty": "Orthodontics",
                "parent_id": None,
                "is_active": True
            },
            {
                "name": "Monthly Archwire Adjustment & Activation",
                "description": "Routine orthodontic adjustment, wire change, and elastomeric tie placement.",
                "rate": 1500.0,
                "specialty": "Orthodontics",
                "parent_id": None,
                "is_active": True
            },
            {
                "name": "Orthodontic Debonding & Enamel Polishing",
                "description": "Removal of bracket appliances, adhesive clean-up, and dental enamel polishing.",
                "rate": 4000.0,
                "specialty": "Orthodontics",
                "parent_id": None,
                "is_active": True
            },
            {
                "name": "Orthodontic Retainers",
                "description": "Post-treatment retention appliance to preserve alignment.",
                "rate": 6000.0,
                "specialty": "Orthodontics",
                "parent_id": None,
                "is_active": True
            },
            {
                "name": "Palatal Expander Appliance",
                "description": "Rapid maxilla expansion appliance for narrow upper arches.",
                "rate": 12000.0,
                "specialty": "Orthodontics",
                "parent_id": None,
                "is_active": True
            }
        ]

        added_count = 0
        parent_map = {}

        for p in parents:
            existing = db.query(ProcedureModel).filter(
                ProcedureModel.name == p["name"],
                ProcedureModel.specialty == p["specialty"]
            ).first()
            if not existing:
                new_proc = ProcedureModel(**p)
                db.add(new_proc)
                db.commit()
                db.refresh(new_proc)
                parent_map[p["name"]] = new_proc.id
                added_count += 1
                print(f"Added Orthodontics Procedure: {new_proc.name}")
            else:
                parent_map[p["name"]] = existing.id

        # Children / Sub-procedures
        children = [
            # Metallic Braces children
            {
                "name": "Traditional Metal Braces",
                "description": "Standard high-grade stainless steel brackets with elastic ties.",
                "rate": 35000.0,
                "specialty": "Orthodontics",
                "parent_name": "Metallic Braces Treatment",
                "is_active": True
            },
            {
                "name": "Self-Ligating Metal Braces (Damon)",
                "description": "Frictionless self-ligating metal bracket system for faster movement.",
                "rate": 45000.0,
                "specialty": "Orthodontics",
                "parent_name": "Metallic Braces Treatment",
                "is_active": True
            },
            # Ceramic Braces children
            {
                "name": "Standard Ceramic Braces",
                "description": "Translucent ceramic brackets designed to blend with natural tooth shade.",
                "rate": 50000.0,
                "specialty": "Orthodontics",
                "parent_name": "Ceramic Braces Treatment",
                "is_active": True
            },
            {
                "name": "Self-Ligating Ceramic Braces",
                "description": "Clear self-ligating brackets combining aesthetics and reduced friction.",
                "rate": 60000.0,
                "specialty": "Orthodontics",
                "parent_name": "Ceramic Braces Treatment",
                "is_active": True
            },
            # Clear Aligners children
            {
                "name": "Full Arch Clear Aligners (20+ Trays)",
                "description": "Full course treatment for moderate to severe orthodontic crowding.",
                "rate": 85000.0,
                "specialty": "Orthodontics",
                "parent_name": "Clear Aligners (Invisalign)",
                "is_active": True
            },
            {
                "name": "Lite Clear Aligners (Up to 10 Trays)",
                "description": "Short-term alignment correction for minor anterior relapse or spacing.",
                "rate": 50000.0,
                "specialty": "Orthodontics",
                "parent_name": "Clear Aligners (Invisalign)",
                "is_active": True
            },
            # Retainers children
            {
                "name": "Fixed Bonded Lingual Retainer",
                "description": "Concealed stainless steel wire bonded behind anterior teeth.",
                "rate": 5000.0,
                "specialty": "Orthodontics",
                "parent_name": "Orthodontic Retainers",
                "is_active": True
            },
            {
                "name": "Essix Clear Vacuum Retainer (Pair)",
                "description": "Durable clear plastic thermoformed retainer set.",
                "rate": 6000.0,
                "specialty": "Orthodontics",
                "parent_name": "Orthodontic Retainers",
                "is_active": True
            },
            {
                "name": "Hawley Removable Retainer",
                "description": "Traditional acrylic retainer with labial bow wire.",
                "rate": 5500.0,
                "specialty": "Orthodontics",
                "parent_name": "Orthodontic Retainers",
                "is_active": True
            }
        ]

        for c in children:
            p_id = parent_map.get(c["parent_name"])
            if not p_id:
                continue
            existing = db.query(ProcedureModel).filter(
                ProcedureModel.name == c["name"],
                ProcedureModel.parent_id == p_id
            ).first()
            if not existing:
                new_child = ProcedureModel(
                    name=c["name"],
                    description=c["description"],
                    rate=c["rate"],
                    specialty=c["specialty"],
                    parent_id=p_id,
                    is_active=c["is_active"]
                )
                db.add(new_child)
                db.commit()
                added_count += 1
                print(f"  - Added Sub-Procedure: {new_child.name}")

        print(f"Seeding completed successfully! Total new items added: {added_count}")
    except Exception as e:
        db.rollback()
        print(f"Error seeding Orthodontics procedures: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_orthodontics()
