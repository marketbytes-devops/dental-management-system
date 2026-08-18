# twilio_service.py - Twilio SMS & WhatsApp utility for SmileCare Dental Management System
import os
import logging
import urllib.parse
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER")
TWILIO_WHATSAPP_NUMBER = os.getenv("TWILIO_WHATSAPP_NUMBER", TWILIO_PHONE_NUMBER)


def _normalize_phone(phone: str) -> str:
    """
    Ensures phone number has a country code prefix.
    If the number doesn't start with '+', prepend +91 (India).
    Strips spaces, dashes, and parentheses.
    """
    if not phone:
        return ""
    # Remove common formatting characters
    cleaned = phone.replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
    if not cleaned.startswith("+"):
        cleaned = "+91" + cleaned
    return cleaned


def generate_whatsapp_web_link(phone: str, body: str) -> str:
    """
    Generates a direct WhatsApp web/app click-to-chat URL.
    Format: https://api.whatsapp.com/send?phone=919876543210&text=...
    """
    normalized = _normalize_phone(phone).replace("+", "")
    if not normalized:
        return ""
    encoded_text = urllib.parse.quote(body)
    return f"https://api.whatsapp.com/send?phone={normalized}&text={encoded_text}"


def send_sms(to_phone: str, body: str) -> bool:
    """
    Sends an SMS via Twilio to the given phone number.
    """
    if not all([TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER]):
        logger.warning(
            "Twilio credentials not fully configured. SMS not sent. "
            "Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in .env"
        )
        return False

    try:
        from twilio.rest import Client

        normalized_to = _normalize_phone(to_phone)
        if not normalized_to:
            logger.warning("No valid phone number provided to send_sms(). SMS skipped.")
            return False

        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        message = client.messages.create(
            body=body,
            from_=TWILIO_PHONE_NUMBER,
            to=normalized_to,
        )
        logger.info(f"SMS sent to {normalized_to}. SID: {message.sid}")
        return True

    except Exception as e:
        logger.error(f"Failed to send SMS to {to_phone}: {e}")
        return False


def send_whatsapp(to_phone: str, body: str) -> bool:
    """
    Sends a WhatsApp message via Twilio API.
    Uses 'whatsapp:<number>' formatting required by Twilio API.
    """
    if not all([TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER]):
        logger.warning(
            "Twilio WhatsApp credentials not configured. WhatsApp skipped. "
            "Ensure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_NUMBER are set in .env"
        )
        return False

    try:
        from twilio.rest import Client

        normalized_to = _normalize_phone(to_phone)
        if not normalized_to:
            logger.warning("No valid phone number provided to send_whatsapp(). WhatsApp skipped.")
            return False

        sender = TWILIO_WHATSAPP_NUMBER
        if not sender.startswith("whatsapp:"):
            sender = f"whatsapp:{sender}"

        recipient = f"whatsapp:{normalized_to}"

        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        message = client.messages.create(
            body=body,
            from_=sender,
            to=recipient,
        )
        logger.info(f"WhatsApp message sent to {normalized_to}. SID: {message.sid}")
        return True

    except Exception as e:
        logger.error(f"Failed to send WhatsApp message to {to_phone}: {e}")
        return False


def send_appointment_reminder(to_phone: str, body: str, channels: list = None) -> dict:
    """
    Sends appointment reminder via requested channels (WhatsApp, SMS, or Both).

    Args:
        to_phone: Recipient phone number.
        body: Message body.
        channels: List of channels e.g. ["whatsapp", "sms"] or ["whatsapp"] or ["sms"]

    Returns:
        Dict with status of each channel.
    """
    if channels is None:
        channels = ["whatsapp", "sms"]

    results = {}
    
    if "whatsapp" in channels or "WhatsApp" in channels:
        results["whatsapp"] = send_whatsapp(to_phone, body)
    
    if "sms" in channels or "SMS" in channels:
        results["sms"] = send_sms(to_phone, body)
        
    return results

