# reminder_service.py - Automated WhatsApp & SMS Appointment Reminder Logic
import logging
from datetime import date, datetime, timedelta
from sqlalchemy.orm import Session
from modules.frontdesk.models import AppointmentModel
from modules.frontdesk.communication_models import CommunicationLogModel
from modules.patient.models import PatientModel, PatientNotificationModel
from twilio_service import send_appointment_reminder, generate_whatsapp_web_link

logger = logging.getLogger(__name__)


def format_booking_message(patient_name: str, appt_date: str, appt_time: str, doctor_name: str, treatment_type: str = "") -> str:
    treatment_str = f" for {treatment_type}" if treatment_type else ""
    return (
        f"SmileCare Dental: Hi {patient_name}, your appointment{treatment_str} with {doctor_name} "
        f"has been CONFIRMED for {appt_date} at {appt_time}. "
        f"Thank you for choosing SmileCare Dental Clinic!"
    )


def format_1day_message(patient_name: str, appt_date: str, appt_time: str, doctor_name: str, treatment_type: str = "") -> str:
    treatment_str = f" for {treatment_type}" if treatment_type else ""
    return (
        f"SmileCare Dental REMINDER: Hi {patient_name}, you have a dental appointment scheduled "
        f"tomorrow ({appt_date}) at {appt_time} with {doctor_name}{treatment_str}. "
        f"Please arrive 10 minutes early. Call us if you need to reschedule."
    )


def format_sameday_message(patient_name: str, appt_date: str, appt_time: str, doctor_name: str, treatment_type: str = "") -> str:
    treatment_str = f" for {treatment_type}" if treatment_type else ""
    return (
        f"SmileCare Dental TODAY'S VISIT: Hi {patient_name}, this is a reminder for your appointment TODAY "
        f"at {appt_time} with {doctor_name}{treatment_str}. "
        f"We look forward to seeing you!"
    )


def send_booked_reminder(db: Session, appt: AppointmentModel) -> bool:
    """
    Sends instant WhatsApp and SMS confirmation right after appointment booking.
    """
    if not appt or appt.reminder_booked_sent:
        return False

    patient = db.query(PatientModel).filter(PatientModel.id == appt.patient_id).first()
    if not patient or not patient.phone:
        logger.warning(f"[REMINDER BOOKED] No patient phone found for appointment ID {appt.id}")
        return False

    patient_name = patient.name or "Patient"
    date_str = appt.appointment_date.strftime("%Y-%m-%d") if isinstance(appt.appointment_date, date) else str(appt.appointment_date)
    msg_body = format_booking_message(patient_name, date_str, appt.appointment_time, appt.doctor_name, appt.treatment_type or "")

    # Dispatch via Twilio SMS & WhatsApp
    results = send_appointment_reminder(patient.phone, msg_body, channels=["whatsapp", "sms"])
    
    wa_sent = results.get("whatsapp", False)
    sms_sent = results.get("sms", False)
    overall_sent = wa_sent or sms_sent

    # Log communication
    log = CommunicationLogModel(
        patient_id=patient.id,
        appointment_id=appt.id,
        recipient_name=patient_name,
        recipient_phone=patient.phone,
        recipient_email=patient.email,
        channel="WhatsApp + SMS",
        template="appointment_booking",
        trigger_type="booked",
        message_body=msg_body,
        status="Sent" if overall_sent else "Logged",
        error_message=None if overall_sent else "Twilio credentials pending or dispatch simulated",
        sent_by="System (Active When Booked)"
    )
    db.add(log)

    # In-app patient notification
    if patient.token:
        notif = PatientNotificationModel(
            patient_token=patient.token,
            sender_role="system",
            type="appointment",
            title="Appointment Booking Confirmed",
            message=msg_body,
            read=False
        )
        db.add(notif)

    # Mark reminder flag
    appt.reminder_booked_sent = True
    appt.reminder_booked_at = datetime.now()

    try:
        db.commit()
        db.refresh(appt)
        logger.info(f"[REMINDER BOOKED SUCCESS] Sent booking reminder to {patient_name} for appointment {appt.id}")
        return True
    except Exception as e:
        db.rollback()
        logger.error(f"[REMINDER BOOKED ERROR] Failed to record booking reminder for appointment {appt.id}: {e}")
        return False


def send_1day_before_reminders(db: Session) -> int:
    """
    Finds active appointments scheduled for tomorrow that haven't received a 1-day reminder yet.
    Sends WhatsApp + SMS reminders automatically.
    """
    tomorrow = date.today() + timedelta(days=1)
    upcoming_appts = db.query(AppointmentModel).filter(
        AppointmentModel.appointment_date == tomorrow,
        AppointmentModel.status.in_(["Confirmed", "Pending", "Scheduled"]),
        AppointmentModel.reminder_1day_sent == False
    ).all()

    sent_count = 0
    for appt in upcoming_appts:
        patient = db.query(PatientModel).filter(PatientModel.id == appt.patient_id).first()
        if not patient or not patient.phone:
            continue

        patient_name = patient.name or "Patient"
        date_str = tomorrow.strftime("%Y-%m-%d")
        msg_body = format_1day_message(patient_name, date_str, appt.appointment_time, appt.doctor_name, appt.treatment_type or "")

        results = send_appointment_reminder(patient.phone, msg_body, channels=["whatsapp", "sms"])
        overall_sent = results.get("whatsapp", False) or results.get("sms", False)

        log = CommunicationLogModel(
            patient_id=patient.id,
            appointment_id=appt.id,
            recipient_name=patient_name,
            recipient_phone=patient.phone,
            recipient_email=patient.email,
            channel="WhatsApp + SMS",
            template="appointment_reminder_1day",
            trigger_type="1day_before",
            message_body=msg_body,
            status="Sent" if overall_sent else "Logged",
            error_message=None if overall_sent else "Twilio credentials pending or dispatch simulated",
            sent_by="System (1-Day Before Auto)"
        )
        db.add(log)

        if patient.token:
            notif = PatientNotificationModel(
                patient_token=patient.token,
                sender_role="system",
                type="appointment_reminder",
                title="Upcoming Dental Appointment Tomorrow",
                message=msg_body,
                read=False
            )
            db.add(notif)

        appt.reminder_1day_sent = True
        appt.reminder_1day_at = datetime.now()
        sent_count += 1

    if sent_count > 0:
        try:
            db.commit()
            logger.info(f"[REMINDER 1DAY] Dispatched {sent_count} 1-day before reminders for date {tomorrow}")
        except Exception as e:
            db.rollback()
            logger.error(f"[REMINDER 1DAY ERROR] Failed to commit 1-day reminders: {e}")

    return sent_count


def send_sameday_reminders(db: Session) -> int:
    """
    Finds active appointments scheduled for today that haven't received a same-day reminder yet.
    Sends WhatsApp + SMS reminders automatically.
    """
    today = date.today()
    today_appts = db.query(AppointmentModel).filter(
        AppointmentModel.appointment_date == today,
        AppointmentModel.status.in_(["Confirmed", "Pending", "Scheduled"]),
        AppointmentModel.reminder_sameday_sent == False
    ).all()

    sent_count = 0
    for appt in today_appts:
        patient = db.query(PatientModel).filter(PatientModel.id == appt.patient_id).first()
        if not patient or not patient.phone:
            continue

        patient_name = patient.name or "Patient"
        date_str = today.strftime("%Y-%m-%d")
        msg_body = format_sameday_message(patient_name, date_str, appt.appointment_time, appt.doctor_name, appt.treatment_type or "")

        results = send_appointment_reminder(patient.phone, msg_body, channels=["whatsapp", "sms"])
        overall_sent = results.get("whatsapp", False) or results.get("sms", False)

        log = CommunicationLogModel(
            patient_id=patient.id,
            appointment_id=appt.id,
            recipient_name=patient_name,
            recipient_phone=patient.phone,
            recipient_email=patient.email,
            channel="WhatsApp + SMS",
            template="appointment_reminder_sameday",
            trigger_type="on_the_day",
            message_body=msg_body,
            status="Sent" if overall_sent else "Logged",
            error_message=None if overall_sent else "Twilio credentials pending or dispatch simulated",
            sent_by="System (On-The-Day Auto)"
        )
        db.add(log)

        if patient.token:
            notif = PatientNotificationModel(
                patient_token=patient.token,
                sender_role="system",
                type="appointment_reminder",
                title="Your Appointment Today",
                message=msg_body,
                read=False
            )
            db.add(notif)

        appt.reminder_sameday_sent = True
        appt.reminder_sameday_at = datetime.now()
        sent_count += 1

    if sent_count > 0:
        try:
            db.commit()
            logger.info(f"[REMINDER SAMEDAY] Dispatched {sent_count} same-day reminders for date {today}")
        except Exception as e:
            db.rollback()
            logger.error(f"[REMINDER SAMEDAY ERROR] Failed to commit same-day reminders: {e}")

    return sent_count


def run_all_automated_reminders(db: Session) -> dict:
    """
    Main runner invoked by background scheduler or manual trigger.
    Checks and dispatches 1-day before and on-the-day automated reminders.
    """
    count_1day = send_1day_before_reminders(db)
    count_sameday = send_sameday_reminders(db)
    return {
        "status": "success",
        "reminders_1day_sent": count_1day,
        "reminders_sameday_sent": count_sameday,
        "total_dispatched": count_1day + count_sameday
    }
