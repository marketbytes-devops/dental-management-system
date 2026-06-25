# router.py - all /patient/* endpoints
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db

from .schemas import PatientCreate, PatientResponse, PatientUpdate, PasswordChangeRequest
from .models import PatientModel
from .service import get_patient_by_phone, get_patient_by_email, create_patient, update_patient_profile, change_patient_password
from dependencies import get_current_user
from modules.doctor.models import DoctorModel


router = APIRouter(prefix="/patient", tags=["patient"])


# --- Public endpoint: list available doctors for booking (no auth required) ---
@router.get("/doctors-list")
def get_available_doctors(db: Session = Depends(get_db)):
    """Public endpoint for the patient portal to list doctors for appointment booking."""
    doctors = db.query(DoctorModel).filter(DoctorModel.status != "Inactive").all()
    return [
        {
            "id": doc.id,
            "name": doc.name if doc.name.startswith("Dr. ") else f"Dr. {doc.name}",
            "specialty": doc.specialty or "General Dentistry",
            "status": "On Duty" if doc.status == "Active" else doc.status,
        }
        for doc in doctors
    ]


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

@router.get("/all", response_model=List[PatientResponse])
def get_all_patients(db: Session = Depends(get_db)):
    return db.query(PatientModel).order_by(PatientModel.name.asc()).all()


@router.put("/profile", response_model=PatientResponse)
def update_profile(
    update_in: PatientUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    patient_id = current_user.get("patient_id")
    if not patient_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
    updated = update_patient_profile(db, patient_id=patient_id, update_in=update_in)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    return updated


@router.post("/change-password")
def change_password(
    req: PasswordChangeRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    patient_id = current_user.get("patient_id")
    if not patient_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
    success = change_patient_password(db, patient_id=patient_id, current_password=req.current_password, new_password=req.new_password)
    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect.")
    return {"message": "Password updated successfully."}


# --- Consent Endpoints ---
from .schemas import ConsentRequest, ConsentSignRequest, ConsentResponse
from .models import PatientConsent
from shared.utils.pdf_generator import generate_consent_pdf
import datetime
import os
from fastapi.responses import FileResponse

@router.post("/consents/request", response_model=ConsentResponse)
def request_consent(
    req: ConsentRequest,
    db: Session = Depends(get_db)
):
    # Verify patient exists
    patient = db.query(PatientModel).filter(PatientModel.id == req.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    new_consent = PatientConsent(
        patient_id=req.patient_id,
        doctor_id=req.doctor_id,
        treatment_plan_id=req.treatment_plan_id,
        title=req.title,
        body_text=req.body_text,
        status="PENDING"
    )
    db.add(new_consent)
    db.commit()
    db.refresh(new_consent)
    return new_consent

@router.get("/consents/pending", response_model=List[ConsentResponse])
def get_pending_consents(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    patient_id = current_user.get("patient_id")
    if not patient_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
    
    consents = db.query(PatientConsent).filter(
        PatientConsent.patient_id == patient_id,
        PatientConsent.status == "PENDING"
    ).order_by(PatientConsent.created_at.desc()).all()
    return consents

@router.get("/consents/documents", response_model=List[ConsentResponse])
def get_signed_consents(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    patient_id = current_user.get("patient_id")
    if not patient_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
    
    consents = db.query(PatientConsent).filter(
        PatientConsent.patient_id == patient_id,
        PatientConsent.status == "SIGNED"
    ).order_by(PatientConsent.signed_at.desc()).all()
    return consents

@router.post("/consents/{consent_id}/sign", response_model=ConsentResponse)
def sign_consent(
    consent_id: int,
    req: ConsentSignRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    patient_id = current_user.get("patient_id")
    if not patient_id:
        # Check if requested by admin or doctor (for IN_PERSON)
        roles = current_user.get("roles", [])
        if "Admin" not in roles and "Doctor" not in roles:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
        
        # If doctor/admin, we must fetch the consent to verify
        consent = db.query(PatientConsent).filter(PatientConsent.id == consent_id).first()
        if not consent:
            raise HTTPException(status_code=404, detail="Consent not found")
        patient_id = consent.patient_id

    # Fetch patient name for PDF
    patient = db.query(PatientModel).filter(PatientModel.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    consent = db.query(PatientConsent).filter(
        PatientConsent.id == consent_id,
        PatientConsent.patient_id == patient_id
    ).first()
    
    if not consent:
        raise HTTPException(status_code=404, detail="Consent not found")
        
    if consent.status == "SIGNED":
        raise HTTPException(status_code=400, detail="Consent already signed")

    # Generate PDF
    pdf_path = generate_consent_pdf(
        title=consent.title,
        body_text=consent.body_text,
        signature_data=req.signature_data,
        patient_name=patient.name
    )

    consent.status = "SIGNED"
    consent.signature_data = req.signature_data
    consent.signing_method = req.signing_method
    consent.signed_at = datetime.datetime.now(datetime.timezone.utc)
    consent.pdf_file_path = pdf_path
    
    db.commit()
    db.refresh(consent)
    return consent

@router.get("/consents/{consent_id}/pdf")
def get_consent_pdf(
    consent_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify access
    patient_id = current_user.get("patient_id")
    roles = current_user.get("roles", [])
    
    consent = db.query(PatientConsent).filter(PatientConsent.id == consent_id).first()
    if not consent:
        raise HTTPException(status_code=404, detail="Consent not found")
        
    if patient_id and consent.patient_id != patient_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
    elif not patient_id and ("Admin" not in roles and "Doctor" not in roles):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)

    if not consent.pdf_file_path or not os.path.exists(consent.pdf_file_path):
        raise HTTPException(status_code=404, detail="PDF file not found")
        
    return FileResponse(
        path=consent.pdf_file_path,
        filename=os.path.basename(consent.pdf_file_path),
        media_type="application/pdf"
    )

