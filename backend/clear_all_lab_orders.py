import logging
from database import SessionLocal, engine
from sqlalchemy import text

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def clear_all_lab_data():
    print("=========================================================")
    print("Clearing All Lab Orders, Comments & Related Records")
    print("=========================================================\n")

    db = SessionLocal()
    try:
        # Delete related tables first (foreign keys)
        comments_deleted = db.execute(text("DELETE FROM lab_order_comments;")).rowcount
        audits_deleted = db.execute(text("DELETE FROM lab_audit_trails;")).rowcount
        notifs_deleted = db.execute(text("DELETE FROM lab_notifications;")).rowcount
        
        # Check if details tables exist before deleting
        try:
            db.execute(text("DELETE FROM prosthetic_case_details;"))
        except Exception:
            pass

        try:
            db.execute(text("DELETE FROM pathology_case_details;"))
        except Exception:
            pass

        # Delete lab orders
        orders_deleted = db.execute(text("DELETE FROM lab_orders;")).rowcount
        
        db.commit()
        
        print(f"[SUCCESS] Deleted {orders_deleted} lab order(s).")
        print(f"[SUCCESS] Deleted {comments_deleted} lab order comment(s).")
        print(f"[SUCCESS] Deleted {audits_deleted} lab audit trail(s).")
        print(f"[SUCCESS] Deleted {notifs_deleted} lab notification(s).")
        print("\nThe database lab tables are now completely EMPTY.")
        print("=========================================================")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Failed to clear lab data: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    clear_all_lab_data()
