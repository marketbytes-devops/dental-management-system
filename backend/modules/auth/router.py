# router.py - auth endpoints
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from modules.auth.models import UserModel
from modules.patient.models import PatientModel
from modules.auth.schemas import UserLogin, UserResponse, TokenResponse
from modules.auth.service import verify_password
from shared.utils.auth import create_access_token
from dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login", response_model=TokenResponse)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    # 1. Search in Staff (UserModel)
    user = db.query(UserModel).filter(
        (UserModel.email.ilike(login_data.username)) | 
        (UserModel.username.ilike(login_data.username))
    ).first()

    if user:
        if user.status != "Active":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This account has been deactivated. Please contact support."
            )
        if not verify_password(login_data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials. Verify your password."
            )
        
        token = create_access_token({
            "user_id": user.id,
            "username": user.username,
            "email": user.email,
            "roles": user.roles,
            "type": "staff"
        })
        return {
            "access_token": token,
            "token_type": "bearer",
            "role_type": "staff",
            "roles": user.roles
        }

    # 2. Search in Patient (PatientModel)
    patient = db.query(PatientModel).filter(
        (PatientModel.email.ilike(login_data.username)) |
        (PatientModel.phone == login_data.username)
    ).first()

    if patient:
        if not patient.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This account has been deactivated. Please contact support."
            )
        from modules.patient.service import verify_password as verify_patient_password
        if not verify_patient_password(login_data.password, patient.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials. Verify your password."
            )
        
        token = create_access_token({
            "patient_id": patient.id,
            "email": patient.email,
            "roles": ["Patient"],
            "type": "patient"
        })
        return {
            "access_token": token,
            "token_type": "bearer",
            "role_type": "patient",
            "roles": ["Patient"]
        }

    # 3. Neither matches
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid credentials. Verify your username/email and password."
    )

@router.get("/profile", response_model=UserResponse)
def get_profile(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload: missing user_id"
        )
    
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user

