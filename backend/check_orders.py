import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
print("Connecting to:", DATABASE_URL)

engine = create_engine(DATABASE_URL)
with engine.begin() as conn:
    # Delete from details tables first to respect foreign keys
    # But wait, did they have detail records? Let's check
    res = conn.execute(text("DELETE FROM prosthetic_case_details WHERE lab_case_id LIKE 'LAB-%';"))
    print("Deleted prosthetic details:", res.rowcount)
    res = conn.execute(text("DELETE FROM pathology_case_details WHERE lab_case_id LIKE 'LAB-%';"))
    print("Deleted pathology details:", res.rowcount)
    res = conn.execute(text("DELETE FROM clinical_encounters WHERE lab_case_id LIKE 'LAB-%';"))
    print("Deleted encounters:", res.rowcount)
    res = conn.execute(text("DELETE FROM lab_audit_trails WHERE order_id LIKE 'LAB-%';"))
    print("Deleted audit trails:", res.rowcount)
    res = conn.execute(text("DELETE FROM lab_order_comments WHERE order_id LIKE 'LAB-%';"))
    print("Deleted comments:", res.rowcount)

    # Finally delete from lab_orders
    res = conn.execute(text("DELETE FROM lab_orders WHERE id LIKE 'LAB-%';"))
    print("Deleted lab orders:", res.rowcount)

print("Legacy dummy orders successfully removed.")
