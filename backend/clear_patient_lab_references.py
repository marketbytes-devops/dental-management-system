import sqlite3
import os
from database import SessionLocal
from sqlalchemy import text

def clear_patient_lab_references():
    print("=========================================================")
    print("Clearing Patient & Encounter References to Lab Orders")
    print("=========================================================\n")

    db = SessionLocal()
    try:
        # Clear lab_case_id references in clinical_encounters if any
        try:
            enc_updated = db.execute(text("UPDATE clinical_encounters SET lab_case_id = NULL WHERE lab_case_id IS NOT NULL;")).rowcount
            print(f"[OK] Cleared lab references in clinical_encounters: {enc_updated} rows updated.")
        except Exception as e:
            print(f"[NOTE] clinical_encounters update: {e}")

        # Clear lab_case_id in treatment_plan_steps if column exists
        try:
            tp_updated = db.execute(text("UPDATE treatment_plan_steps SET lab_case_id = NULL WHERE lab_case_id IS NOT NULL;")).rowcount
            print(f"[OK] Cleared lab references in treatment_plan_steps: {tp_updated} rows updated.")
        except Exception as e:
            print(f"[NOTE] treatment_plan_steps update: {e}")

        db.commit()
        print("\nPatient module lab references successfully purged!")
        print("=========================================================")
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Failed to clear patient lab references: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    clear_patient_lab_references()
