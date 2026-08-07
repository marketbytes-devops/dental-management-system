import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), "smilecare.db")

def clear_sqlite():
    if not os.path.exists(db_path):
        print(f"Database file not found at {db_path}")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    tables = ["lab_orders", "lab_order_comments", "lab_audit_trails", "lab_notifications", "prosthetic_case_details", "pathology_case_details"]
    
    for table in tables:
        try:
            cursor.execute(f"DELETE FROM {table};")
            count = cursor.rowcount
            print(f"[OK] Cleared table '{table}': deleted {count} rows.")
        except Exception as e:
            print(f"[NOTE] Table '{table}': {e}")

    conn.commit()
    conn.close()
    print("\nAll lab data successfully cleared from smilecare.db!")

if __name__ == "__main__":
    clear_sqlite()
