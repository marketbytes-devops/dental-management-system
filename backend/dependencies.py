# dependencies.py - Shared authentication & session dependencies
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from database import get_db
from modules.auth.models import UserModel
from modules.patient.models import PatientModel
from shared.utils.auth import verify_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    try:
        payload = verify_token(token)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )

    # Check if user/patient is still active
    user_type = payload.get("type")
    if user_type == "staff":
        user_id = payload.get("user_id")
        user = db.query(UserModel).filter(UserModel.id == user_id).first()
        if not user or user.status != "Active":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account is deactivated or status is invalid. Please log in again."
            )
    elif user_type == "patient":
        patient_id = payload.get("patient_id")
        patient = db.query(PatientModel).filter(PatientModel.id == patient_id).first()
        if not patient or not patient.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account is deactivated. Please log in again."
            )

    return payload


def get_current_active_user(current_user: dict = Depends(get_current_user)):
    if current_user.get("type") != "staff":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden. Staff credentials required."
        )
    return current_user


def require_admin(current_user: dict = Depends(get_current_active_user)):
    roles = [r.lower() for r in current_user.get("roles", [])]
    if "admin" not in roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden. Administrator role required."
        )
    return current_user