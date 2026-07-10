import sys
import os

# Add the backend directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
from modules.lab.models import InventoryItemModel

def seed():
    db = SessionLocal()
    try:
        # Check if table is empty
        count = db.query(InventoryItemModel).count()
        print(f"Current inventory items count: {count}")
        
        # We will insert standard medicines if count is 0 or less than 5
        if count < 5:
            print("Seeding standard medicines under 'clinical pharmacy' category...")
            medicines = [
                {"name": "Paracetamol 500mg", "category": "clinical pharmacy", "current_stock": 150, "unit": "tablets", "unit_price": 0.5},
                {"name": "Amoxicillin 500mg", "category": "clinical pharmacy", "current_stock": 100, "unit": "capsules", "unit_price": 1.2},
                {"name": "Ibuprofen 400mg", "category": "clinical pharmacy", "current_stock": 120, "unit": "tablets", "unit_price": 0.8},
                {"name": "Clindamycin 300mg", "category": "clinical pharmacy", "current_stock": 80, "unit": "capsules", "unit_price": 2.0},
                {"name": "Metronidazole 400mg", "category": "clinical pharmacy", "current_stock": 90, "unit": "tablets", "unit_price": 1.0},
                {"name": "Chlorhexidine Gluconate 0.2% Mouthwash", "category": "clinical pharmacy", "current_stock": 50, "unit": "bottles", "unit_price": 4.5},
                {"name": "Amoxicillin + Clavulanate 625mg", "category": "clinical pharmacy", "current_stock": 70, "unit": "tablets", "unit_price": 2.5},
                {"name": "Ketorolac 10mg", "category": "clinical pharmacy", "current_stock": 60, "unit": "tablets", "unit_price": 1.5}
            ]
            for m in medicines:
                item = InventoryItemModel(
                    name=m["name"],
                    category=m["category"],
                    current_stock=m["current_stock"],
                    unit=m["unit"],
                    unit_price=m["unit_price"]
                )
                db.add(item)
            db.commit()
            print("Seeding completed successfully!")
        else:
            # Update existing items to make sure some have the 'clinical pharmacy' category if none do
            pharmacy_count = db.query(InventoryItemModel).filter(InventoryItemModel.category == 'clinical pharmacy').count()
            print(f"Existing clinical pharmacy items: {pharmacy_count}")
            if pharmacy_count == 0:
                print("No clinical pharmacy items found. Adding standard medicines...")
                medicines = [
                    {"name": "Paracetamol 500mg", "category": "clinical pharmacy", "current_stock": 150, "unit": "tablets", "unit_price": 0.5},
                    {"name": "Amoxicillin 500mg", "category": "clinical pharmacy", "current_stock": 100, "unit": "capsules", "unit_price": 1.2},
                    {"name": "Ibuprofen 400mg", "category": "clinical pharmacy", "current_stock": 120, "unit": "tablets", "unit_price": 0.8}
                ]
                for m in medicines:
                    item = InventoryItemModel(
                        name=m["name"],
                        category=m["category"],
                        current_stock=m["current_stock"],
                        unit=m["unit"],
                        unit_price=m["unit_price"]
                    )
                    db.add(item)
                db.commit()
                print("Clinical pharmacy seeding completed successfully!")
    except Exception as e:
        print("Error during seed:", e)
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed()
