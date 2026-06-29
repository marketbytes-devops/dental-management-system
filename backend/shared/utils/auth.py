from jose import JWTError, ExpiredSignatureError, jwt
from datetime import datetime, timedelta, timezone
from typing import Optional
import os
from dotenv import load_dotenv
from pathlib import Path

env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path, override=True)

SECRET_KEY = os.getenv("SECRET_KEY", "fallback-secret-key-change-me-in-production")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60))


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a signed JWT access token.

    Args:
        data: Payload dict to encode (should include 'sub' and 'role_type').
        expires_delta: Optional custom TTL; defaults to ACCESS_TOKEN_EXPIRE_MINUTES.

    Returns:
        Encoded JWT string.
    """
    to_encode = data.copy()

    expire = datetime.now(timezone.utc) + (
        expires_delta if expires_delta else timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})

    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def verify_token(token: str) -> dict:
    """
    Decode and validate a JWT token.

    Args:
        token: The raw JWT string.

    Returns:
        Decoded payload dict.

    Raises:
        ExpiredSignatureError: If the token has expired.
        JWTError: If the token is invalid or tampered with.
        ValueError: If required claims ('sub') are missing.
    """
    # ExpiredSignatureError is a subclass of JWTError — catch it first
    # so callers can distinguish between "expired" (401 → refresh) and
    # "invalid" (403 → force logout).
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except ExpiredSignatureError:
        raise ExpiredSignatureError("Token has expired. Please log in again.")
    except JWTError as e:
        raise JWTError(f"Invalid token: {e}")

    # Validate required claims
    if not payload.get("sub"):
        raise ValueError("Token is missing required 'sub' claim.")

    return payload


def decode_token_unverified(token: str) -> dict:
    """
    Decode a token WITHOUT signature verification.
    Safe only for reading non-sensitive claims (e.g. 'role_type' before
    routing to the correct auth flow). Never trust the payload for access control.
    """
    return jwt.decode(token, options={"verify_signature": False})