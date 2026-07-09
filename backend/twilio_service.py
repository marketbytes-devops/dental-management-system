# twilio_service.py - Twilio SMS utility for SmileCare Dental Management System
import os
import logging
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER")


def _normalize_phone(phone: str) -> str:
    """
    Ensures phone number has a country code prefix.
    If the number doesn't start with '+', prepend +91 (India).
    Strips spaces, dashes, and parentheses.
    """
    if not phone:
        return phone
    # Remove common formatting characters
    cleaned = phone.replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
    if not cleaned.startswith("+"):
        cleaned = "+91" + cleaned
    return cleaned


def send_sms(to_phone: str, body: str) -> bool:
    """
    Sends an SMS via Twilio to the given phone number.

    Args:
        to_phone: Recipient phone number (with or without country code).
        body: The SMS message body.

    Returns:
        True if the message was sent successfully, False otherwise.
    """
    if not all([TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER]):
        logger.warning(
            "Twilio credentials not configured. SMS not sent. "
            "Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in .env"
        )
        return False

    try:
        from twilio.rest import Client

        normalized_to = _normalize_phone(to_phone)
        if not normalized_to:
            logger.warning("No phone number provided to send_sms(). SMS skipped.")
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
