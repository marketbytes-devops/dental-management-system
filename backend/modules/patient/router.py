# router.py - all /patient/* endpoints
import os
import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user
from modules.doctor.models import DoctorModel
from shared.utils.pdf_generator import generate_consent_pdf

from .models import PatientConsent, PatientModel
from .schemas import (
    ConsentRequest,
    ConsentResponse,
    ConsentSignRequest,
    PasswordChangeRequest,
    PatientCreate,
    PatientResponse,
    PatientUpdate,
    PrescriptionCreate,
    PrescriptionResponse,
    ReferralCreate,
    ReferralResponse,
)
from .service import (
    change_patient_password,
    create_patient,
    get_patient_by_email,
    get_patient_by_phone,
    update_patient_profile,
)

router = APIRouter(prefix="/patient", tags=["patient"])


# ---------------------------------------------------------------------------
# Public: doctor listing (no auth)
# ---------------------------------------------------------------------------

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


# ---------------------------------------------------------------------------
# Registration
# ---------------------------------------------------------------------------

@router.post("/register", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
def register_patient(patient_in: PatientCreate, db: Session = Depends(get_db)):
    if get_patient_by_phone(db, phone=patient_in.phone):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A patient with this phone number is already registered.",
        )
    if get_patient_by_email(db, email=patient_in.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A patient with this email address is already registered.",
        )
    return create_patient(db, patient_in=patient_in)


# ---------------------------------------------------------------------------
# Profile
# ---------------------------------------------------------------------------

@router.get("/profile", response_model=PatientResponse)
def get_profile(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    patient_id = current_user.get("patient_id")
    if not patient_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

    patient = db.query(PatientModel).filter(PatientModel.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    return patient


@router.put("/profile", response_model=PatientResponse)
def update_profile(
    update_in: PatientUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
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
    db: Session = Depends(get_db),
):
    patient_id = current_user.get("patient_id")
    if not patient_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

    success = change_patient_password(
        db,
        patient_id=patient_id,
        current_password=req.current_password,
        new_password=req.new_password,
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect.",
        )
    return {"message": "Password updated successfully."}


# ---------------------------------------------------------------------------
# Staff-only helpers
# ---------------------------------------------------------------------------

@router.get("/all", response_model=List[PatientResponse])
def get_all_patients(db: Session = Depends(get_db)):
    return db.query(PatientModel).order_by(PatientModel.name.asc()).all()


@router.get("/token/{token}", response_model=PatientResponse)
def get_patient_by_token_endpoint(token: str, db: Session = Depends(get_db)):
    patient = db.query(PatientModel).filter(PatientModel.token == token).first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    return patient


# ---------------------------------------------------------------------------
# Consents
# ---------------------------------------------------------------------------

@router.post("/consents/request", response_model=ConsentResponse)
def request_consent(req: ConsentRequest, db: Session = Depends(get_db)):
    """Staff/doctor creates a consent request for a patient."""
    patient = db.query(PatientModel).filter(PatientModel.id == req.patient_id).first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

    new_consent = PatientConsent(
        patient_id=req.patient_id,
        doctor_id=req.doctor_id,
        treatment_plan_id=req.treatment_plan_id,
        title=req.title,
        content=req.content,
        status="PENDING",
    )
    db.add(new_consent)
    db.commit()
    db.refresh(new_consent)
    return new_consent


@router.get("/consents/pending", response_model=List[ConsentResponse])
def get_pending_consents(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Returns all PENDING consents for the logged-in patient."""
    patient_id = current_user.get("patient_id")
    if not patient_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

    patient = db.query(PatientModel).filter(PatientModel.id == patient_id).first()
    patient_token = patient.token if patient else None

    return (
        db.query(PatientConsent)
        .filter(
            (PatientConsent.patient_id == patient_id) | (PatientConsent.patient_token == patient_token),
            PatientConsent.status == "PENDING"
        )
        .order_by(PatientConsent.created_at.desc())
        .all()
    )


@router.get("/consents/documents", response_model=List[ConsentResponse])
def get_signed_consents(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Returns all SIGNED consent documents for the logged-in patient."""
    patient_id = current_user.get("patient_id")
    if not patient_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

    patient = db.query(PatientModel).filter(PatientModel.id == patient_id).first()
    patient_token = patient.token if patient else None

    return (
        db.query(PatientConsent)
        .filter(
            (PatientConsent.patient_id == patient_id) | (PatientConsent.patient_token == patient_token),
            PatientConsent.status == "SIGNED"
        )
        .order_by(PatientConsent.signed_at.desc())
        .all()
    )


@router.post("/consents/{consent_id}/sign", response_model=ConsentResponse)
def sign_consent(
    consent_id: int,
    req: ConsentSignRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Patient signs a consent form, or a Doctor/Admin signs on behalf of a patient (IN_PERSON).
    """
    patient_id = current_user.get("patient_id")
    roles = current_user.get("roles", [])

    consent = db.query(PatientConsent).filter(PatientConsent.id == consent_id).first()
    if not consent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Consent not found")

    if not patient_id:
        # Must be a staff member acting on behalf of the patient
        if "Admin" not in roles and "Doctor" not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorised")
        
        # Determine patient_id
        if consent.patient_id:
            patient_id = consent.patient_id
        else:
            patient = db.query(PatientModel).filter(PatientModel.token == consent.patient_token).first()
            if patient:
                patient_id = patient.id

    patient = db.query(PatientModel).filter(PatientModel.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

    # Authorisation check: ensure consent belongs to this patient
    if consent.patient_id and consent.patient_id != patient.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorised")
    if consent.patient_token and consent.patient_token != patient.token:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorised")

    if consent.status == "SIGNED":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Consent already signed")

    # Generate PDF
    pdf_path = generate_consent_pdf(
        title=consent.title,
        body_text=consent.content or "",
        signature_data=req.signature_data,
        patient_name=patient.name,
    )

    consent.status = "SIGNED"
    consent.patient_id = patient.id
    consent.signature_data = req.signature_data
    consent.signing_method = req.signing_method
    consent.signed_at = datetime.datetime.now(datetime.timezone.utc)
    consent.pdf_file_path = pdf_path

    # Update associated treatment plan step if it exists
    if consent.step_id:
        from modules.treatment_plan.models import TreatmentPlanStepModel
        step = db.query(TreatmentPlanStepModel).filter(TreatmentPlanStepModel.id == consent.step_id).first()
        if step:
            step.consent_status = "Given"
            step.consent_given_at = consent.signed_at

    db.commit()
    db.refresh(consent)
    return consent


@router.get("/consents/{consent_id}/pdf")
def get_consent_pdf(
    consent_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Serve the signed PDF. Accessible by the owning patient or by Admin/Doctor."""
    patient_id = current_user.get("patient_id")
    roles = current_user.get("roles", [])

    consent = db.query(PatientConsent).filter(PatientConsent.id == consent_id).first()
    if not consent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Consent not found")

    # Authorisation check
    if patient_id:
        patient = db.query(PatientModel).filter(PatientModel.id == patient_id).first()
        is_owner = (consent.patient_id == patient_id) or (patient and consent.patient_token == patient.token)
        if not is_owner:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    else:
        if "Admin" not in roles and "Doctor" not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    pdf_file = consent.pdf_file_path
    if not pdf_file or not os.path.exists(pdf_file):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="PDF file not found")

    return FileResponse(
        path=pdf_file,
        filename=os.path.basename(pdf_file),
        media_type="application/pdf",
    )


# ---------------------------------------------------------------------------
# Prescriptions
# ---------------------------------------------------------------------------

@router.post("/prescriptions", response_model=PrescriptionResponse)
def create_prescription_route(
    req: PrescriptionCreate,
    db: Session = Depends(get_db)
):
    from .models import PatientPrescription
    new_rx = PatientPrescription(
        patient_token=req.patient_token,
        doctor_name=req.doctor_name,
        medications=req.medications
    )
    db.add(new_rx)
    db.commit()
    db.refresh(new_rx)
    return new_rx

@router.get("/prescriptions", response_model=List[PrescriptionResponse])
def get_prescriptions_route(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    patient_id = current_user.get("patient_id")
    if not patient_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
    
    patient = db.query(PatientModel).filter(PatientModel.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

    from .models import PatientPrescription
    rx_list = db.query(PatientPrescription).filter(PatientPrescription.patient_token == patient.token).order_by(PatientPrescription.created_at.desc()).all()
    return rx_list

# ---------------------------------------------------------------------------
# Referrals
# ---------------------------------------------------------------------------

@router.post("/referrals", response_model=ReferralResponse)
def create_referral_route(
    req: ReferralCreate,
    db: Session = Depends(get_db)
):
    from modules.doctor.models import ReferralModel
    new_ref = ReferralModel(
        id=req.id,
        patient_token=req.patient_token,
        referred_by=req.referred_by,
        speciality=req.speciality,
        target_doctor=req.target_doctor,
        date=req.date,
        reason=req.reason,
        clinical_notes=req.clinical_notes,
        status="Pending",
        referral_type=req.referral_type,
        external_facility=req.external_facility
    )
    db.add(new_ref)
    db.commit()
    db.refresh(new_ref)
    return new_ref

@router.get("/referrals", response_model=List[ReferralResponse])
def get_referrals_route(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    patient_id = current_user.get("patient_id")
    if not patient_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
    
    patient = db.query(PatientModel).filter(PatientModel.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

    from modules.doctor.models import ReferralModel
    ref_list = db.query(ReferralModel).filter(ReferralModel.patient_token == patient.token).order_by(ReferralModel.date.desc()).all()
    return ref_list