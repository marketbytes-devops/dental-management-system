# test_full_reminder_system.py - Full Automated Test Suite for Appointment Reminders
import sys
import os
from datetime import date, datetime, timedelta

# Ensure backend directory is in path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, Base, engine
from modules.patient.models import PatientModel
from modules.frontdesk.models import AppointmentModel
from modules.frontdesk.communication_models import CommunicationLogModel
from modules.frontdesk.schemas import AppointmentCreate
from modules.frontdesk.service import create_appointment
from modules.frontdesk.reminder_service import (
    run_all_automated_reminders,
    send_booked_reminder,
    send_1day_before_reminders,
    send_sameday_reminders
)
from fastapi.testclient import TestClient
from main import app

def run_test_suite():
    print("=" * 70)
    print(" STARTING FULL AUTOMATED TEST SUITE FOR REMINDER SYSTEM")
    print("=" * 70)

    db = SessionLocal()
    passed_tests = 0
    total_tests = 5

    try:
        # 0. Setup Test Patient
        patient = db.query(PatientModel).filter(PatientModel.phone == "+919876543210").first()
        if not patient:
            patient = PatientModel(
                token="TEST-PATIENT-REMINDER-001",
                name="Test Automated Patient",
                gender="Male",
                phone="+919876543210",
                email="test.patient.reminders@example.com",
                password="hashed_test_password"
            )
            db.add(patient)
            db.commit()
            db.refresh(patient)
        print(f"[+] Test Patient initialized: {patient.name} (ID: {patient.id}, Phone: {patient.phone})")

        # -----------------------------------------------------------------------
        # TEST 1: Active When Booked Trigger
        # -----------------------------------------------------------------------
        print("\n--- TEST 1: Instant 'Active When Booked' Confirmation Reminder ---")
        today = date.today()
        future_date = today + timedelta(days=5)

        appt_create = AppointmentCreate(
            patient_id=patient.id,
            doctor_name="Dr. Automated Test",
            appointment_date=future_date,
            appointment_time="10:30 AM",
            treatment_type="Dental Checkup",
            status="Confirmed",
            priority="Routine",
            symptoms="Automated reminder test"
        )
        
        appt_booked = create_appointment(db, appt_in=appt_create)
        print(f"Created appointment ID {appt_booked.id} for date {future_date}")

        # Check model flag
        if appt_booked.reminder_booked_sent:
            print("[PASS] 'reminder_booked_sent' is True immediately after booking.")
        else:
            print("[FAIL] 'reminder_booked_sent' was not set to True.")

        # Check log
        booked_log = db.query(CommunicationLogModel).filter(
            CommunicationLogModel.appointment_id == appt_booked.id,
            CommunicationLogModel.trigger_type == "booked"
        ).first()

        if booked_log:
            print(f"[PASS] Communication log created (Channel: {booked_log.channel}, Template: {booked_log.template})")
            passed_tests += 1
        else:
            print("[FAIL] Communication log missing for booked trigger.")

        # -----------------------------------------------------------------------
        # TEST 2: 1-Day Before Automated Reminder Sweep
        # -----------------------------------------------------------------------
        print("\n--- TEST 2: 1-Day Before Automated Reminder Sweep ---")
        tomorrow = today + timedelta(days=1)
        appt_1day = AppointmentModel(
            patient_id=patient.id,
            doctor_name="Dr. Tomorrow Test",
            appointment_date=tomorrow,
            appointment_time="02:00 PM",
            treatment_type="Scaling & Cleaning",
            status="Confirmed",
            priority="Routine",
            reminder_booked_sent=True,
            reminder_1day_sent=False,
            reminder_sameday_sent=False
        )
        db.add(appt_1day)
        db.commit()
        db.refresh(appt_1day)

        print(f"Created 1-Day test appointment ID {appt_1day.id} for date {tomorrow} (1day_sent=False)")

        # Run 1-day reminder sweep
        count_1day = send_1day_before_reminders(db)
        db.refresh(appt_1day)

        if appt_1day.reminder_1day_sent:
            print(f"[PASS] Automated sweep updated 'reminder_1day_sent' to True. Dispatched count: {count_1day}")
            passed_tests += 1
        else:
            print("[FAIL] 'reminder_1day_sent' was not updated.")

        # -----------------------------------------------------------------------
        # TEST 3: On-The-Day Automated Reminder Sweep
        # -----------------------------------------------------------------------
        print("\n--- TEST 3: On-The-Day Automated Reminder Sweep ---")
        appt_today = AppointmentModel(
            patient_id=patient.id,
            doctor_name="Dr. Today Test",
            appointment_date=today,
            appointment_time="04:30 PM",
            treatment_type="Root Canal Consultation",
            status="Confirmed",
            priority="Urgent",
            reminder_booked_sent=True,
            reminder_1day_sent=True,
            reminder_sameday_sent=False
        )
        db.add(appt_today)
        db.commit()
        db.refresh(appt_today)

        print(f"Created Same-Day test appointment ID {appt_today.id} for today {today} (sameday_sent=False)")

        count_today = send_sameday_reminders(db)
        db.refresh(appt_today)

        if appt_today.reminder_sameday_sent:
            print(f"[PASS] Automated sweep updated 'reminder_sameday_sent' to True. Dispatched count: {count_today}")
            passed_tests += 1
        else:
            print("[FAIL] 'reminder_sameday_sent' was not updated.")

        # -----------------------------------------------------------------------
        # TEST 4: FastAPI Endpoints Verification (TestClient)
        # -----------------------------------------------------------------------
        print("\n--- TEST 4: FastAPI REST API Endpoints Verification ---")
        client = TestClient(app)

        # A. Test GET /frontdesk/reminders
        response_queue = client.get("/frontdesk/reminders")
        if response_queue.status_code == 200:
            reminders_data = response_queue.json()
            print(f"[PASS] GET /frontdesk/reminders returned HTTP 200 with {len(reminders_data)} queue items.")
            
            # Verify fields on first item
            if len(reminders_data) > 0:
                first_item = reminders_data[0]
                has_keys = all(k in first_item for k in ["reminder_booked_sent", "reminder_1day_sent", "reminder_sameday_sent", "whatsapp_link", "message_preview"])
                if has_keys:
                    print("  [+] Verified payload fields (whatsapp_link, stage flags, preview text).")
                else:
                    print("  [-] Missing required fields in GET /frontdesk/reminders payload.")
        else:
            print(f"[FAIL] GET /frontdesk/reminders returned HTTP {response_queue.status_code}")

        # B. Test POST /frontdesk/reminders/trigger-now
        response_trigger = client.post("/frontdesk/reminders/trigger-now")
        if response_trigger.status_code == 200 and response_trigger.json().get("status") == "success":
            print(f"[PASS] POST /frontdesk/reminders/trigger-now returned success: {response_trigger.json()}")
            passed_tests += 1
        else:
            print("[FAIL] POST /frontdesk/reminders/trigger-now failed.")

        # -----------------------------------------------------------------------
        # TEST 5: Manual WhatsApp & SMS API Dispatch
        # -----------------------------------------------------------------------
        print("\n--- TEST 5: Direct WhatsApp & SMS API Endpoints ---")
        res_wa = client.post("/frontdesk/reminders/send-whatsapp", json={
            "appointment_id": appt_today.id,
            "message": "Custom test WhatsApp message for automated test."
        })

        res_sms = client.post("/frontdesk/reminders/send-sms", json={
            "appointment_id": appt_today.id,
            "message": "Custom test SMS message for automated test."
        })

        if res_wa.status_code == 200 and res_sms.status_code == 200:
            print(f"[PASS] Send WhatsApp response: {res_wa.json().get('message')}")
            print(f"[PASS] Send SMS response: {res_sms.json().get('message')}")
            passed_tests += 1
        else:
            print(f"[FAIL] Direct dispatch endpoints failed (WA status: {res_wa.status_code}, SMS status: {res_sms.status_code})")

    except Exception as e:
        print(f"\n[-] EXCEPTION DURING TEST EXECUTION: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

    print("\n" + "=" * 70)
    print(f" TEST SUMMARY: {passed_tests}/{total_tests} TEST SUITES PASSED")
    print("=" * 70)

if __name__ == "__main__":
    run_test_suite()
