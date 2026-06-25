# router.py - all /patient/* endpoints
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db

from .schemas import PatientCreate, PatientResponse, PatientUpdate, PasswordChangeRequest
from .models import PatientModel
from .service import get_patient_by_phone, get_patient_by_email, create_patient, update_patient_profile, change_patient_password
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

@router.get("/all", response_model=List[PatientResponse])
def get_all_patients(db: Session = Depends(get_db)):
    return db.query(PatientModel).order_by(PatientModel.name.asc()).all()


@router.get("/token/{token}", response_model=PatientResponse)
def get_patient_by_token_endpoint(token: str, db: Session = Depends(get_db)):
    patient = db.query(PatientModel).filter(PatientModel.token == token).first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    return patient



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


import os
from fastapi.responses import FileResponse
from sqlalchemy.sql import func
from shared.utils.pdf import generate_consent_pdf
from .schemas import ConsentSignRequest, PatientConsentResponse
from .models import PatientConsentModel
from modules.treatment_plan.models import TreatmentPlanStepModel

@router.get("/consents/pending", response_model=List[PatientConsentResponse])
def get_pending_consents(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    patient_id = current_user.get("patient_id")
    if not patient_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    
    patient = db.query(PatientModel).filter(PatientModel.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    return db.query(PatientConsentModel).filter(
        PatientConsentModel.patient_token == patient.token,
        PatientConsentModel.status == "PENDING"
    ).all()


@router.get("/consents/documents", response_model=List[PatientConsentResponse])
def get_signed_documents(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    patient_id = current_user.get("patient_id")
    if not patient_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")
        
    patient = db.query(PatientModel).filter(PatientModel.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    return db.query(PatientConsentModel).filter(
        PatientConsentModel.patient_token == patient.token,
        PatientConsentModel.status == "SIGNED"
    ).all()


@router.post("/consents/{consent_id}/sign")
def sign_consent_form(
    consent_id: int,
    req: ConsentSignRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    patient_id = current_user.get("patient_id")
    if not patient_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")
        
    patient = db.query(PatientModel).filter(PatientModel.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    consent = db.query(PatientConsentModel).filter(
        PatientConsentModel.id == consent_id,
        PatientConsentModel.patient_token == patient.token
    ).first()
    if not consent:
        raise HTTPException(status_code=404, detail="Consent request not found")
        
    # Update consent status
    consent.status = "SIGNED"
    consent.signature_data = req.signature_data
    consent.signed_at = func.now()
    
    # Generate PDF path
    static_dir = os.path.join(os.getcwd(), "static", "consents")
    os.makedirs(static_dir, exist_ok=True)
    pdf_filename = f"consent_{consent.id}.pdf"
    pdf_path = os.path.join(static_dir, pdf_filename)
    
    # Generate PDF
    generate_consent_pdf(
        patient_name=patient.name,
        patient_token=patient.token,
        title=consent.title,
        content=consent.content,
        signature_data=req.signature_data,
        signature_method=req.method,
        output_path=pdf_path
    )
    
    consent.pdf_path = f"/patient/consents/{consent.id}/pdf"
    
    # Sync status to the treatment plan step
    step = db.query(TreatmentPlanStepModel).filter(TreatmentPlanStepModel.id == consent.step_id).first()
    if step:
        step.consent_status = "Given"
        step.consent_given_at = func.now()
        
    db.commit()
    return {"message": "Consent form signed successfully.", "pdf_url": consent.pdf_path}


@router.get("/consents/{consent_id}/pdf")
def get_consent_pdf(
    consent_id: int,
    db: Session = Depends(get_db)
):
    consent = db.query(PatientConsentModel).filter(PatientConsentModel.id == consent_id).first()
    if not consent or not consent.pdf_path:
        raise HTTPException(status_code=404, detail="PDF not found")
        
    # Reconstruct local path
    static_dir = os.path.join(os.getcwd(), "static", "consents")
    pdf_filename = f"consent_{consent.id}.pdf"
    pdf_path = os.path.join(static_dir, pdf_filename)
    
    if not os.path.exists(pdf_path):
        raise HTTPException(status_code=404, detail="PDF file not found on disk")
        
    return FileResponse(pdf_path, media_type="application/pdf", filename=pdf_filename)

