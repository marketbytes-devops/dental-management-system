import database
from sqlalchemy import text

s = database.SessionLocal()

print("=== Appointments by Doctor ===")
r = s.execute(text("SELECT doctor_name, count(*) as cnt FROM appointments GROUP BY doctor_name ORDER BY cnt DESC LIMIT 10")).fetchall()
for row in r: print(row)

print("\n=== Completed Appointments by Doctor ===")
r = s.execute(text("SELECT doctor_name, count(*) as cnt FROM appointments WHERE status='Completed' GROUP BY doctor_name ORDER BY cnt DESC")).fetchall()
for row in r: print(row)

print("\n=== Appointments by Treatment ===")
r = s.execute(text("SELECT treatment_type, count(*) as cnt FROM appointments GROUP BY treatment_type ORDER BY cnt DESC LIMIT 10")).fetchall()
for row in r: print(row)

print("\n=== Appointments by Month (last 6) ===")
r = s.execute(text("SELECT to_char(appointment_date, 'Mon YYYY') as m, count(*) FROM appointments WHERE appointment_date >= (CURRENT_DATE - INTERVAL '6 months') GROUP BY m ORDER BY m")).fetchall()
for row in r: print(row)

print("\n=== Lab Orders by Month ===")
r = s.execute(text("SELECT to_char(created_at, 'Mon YYYY') as m, count(*), status FROM lab_orders WHERE created_at >= NOW() - INTERVAL '6 months' GROUP BY m, status ORDER BY m")).fetchall()
for row in r: print(row)

print("\n=== Expenses by Category ===")
r = s.execute(text("SELECT category, sum(amount) FROM expenses GROUP BY category ORDER BY sum(amount) DESC")).fetchall()
for row in r: print(row)

print("\n=== Expenses by Month ===")
r = s.execute(text("SELECT to_char(date, 'Mon YYYY') as m, category, sum(amount) FROM expenses WHERE date >= NOW() - INTERVAL '6 months' GROUP BY m, category ORDER BY m")).fetchall()
for row in r: print(row)
