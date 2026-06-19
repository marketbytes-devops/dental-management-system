# router.py - all /patient/* endpoints
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from .schemas import PatientCreate, PatientResponse
from .models import PatientModel
from .service import get_patient_by_phone, get_patient_by_email, create_patient
from dependencies import get_current_user


router = APIRouter(prefix="/patient", tags=["patient"])


@router.post("/register", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
def register_patient(patient_in: PatientCreate, db: Session = Depends(get_db)):
    # Check if phone number is already registered
    existing_phone = get_patient_by_phone(db, phone=patient_in.phone)
    if existing_phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A patient with this phone number is already registered."
        )
        
    # Check if email is already registered
    existing_email = get_patient_by_email(db, email=patient_in.email)
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A patient with this email address is already registered."
        )
        
    return create_patient(db, patient_in=patient_in)


@router.get("/profile", response_model=PatientResponse)
def get_profile(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    patient_id = current_user.get("patient_id")
    if not patient_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )
    
    patient = db.query(PatientModel).filter(PatientModel.id == patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    return patient
