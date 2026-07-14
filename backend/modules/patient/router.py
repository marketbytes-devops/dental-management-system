# router.py - all /patient/* endpoints
import os
import datetime
import shutil
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user
from modules.doctor.models import DoctorModel
from shared.utils.pdf_generator import generate_consent_pdf

from .models import PatientConsent, PatientModel, ClinicalNoteModel
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
    ReferralUpdate,
    ClinicalNoteCreate,
    ClinicalNoteResponse,
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
    from modules.auth.models import UserModel
    doctors = db.query(DoctorModel).filter(DoctorModel.status != "Inactive").all()
    
    result = []
    for doc in doctors:
        user = db.query(UserModel).filter(UserModel.id == doc.user_id).first()
        profile_picture = user.profile_picture if user else None
        
        result.append({
            "id": doc.id,
            "name": doc.name if doc.name.startswith("Dr. ") else f"Dr. {doc.name}",
            "specialty": doc.specialty or "General Dentistry",
            "status": "On Duty" if doc.status == "Active" else doc.status,
            "profile_picture": profile_picture
        })
    return result


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


@router.post("/profile/picture")
def upload_patient_profile_picture(
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    patient_id = current_user.get("patient_id")
    if not patient_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
        
    patient = db.query(PatientModel).filter(PatientModel.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
        
    os.makedirs("static/uploads", exist_ok=True)
    
    # Save the file
    ext = os.path.splitext(file.filename)[1]
    filename = f"patient_{patient_id}_{int(datetime.datetime.now().timestamp())}{ext}"
    file_path = os.path.join("static/uploads", filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Remove old profile picture if exists
    if patient.profile_picture:
        old_path = patient.profile_picture.lstrip("/")
        if os.path.exists(old_path):
            try:
                os.remove(old_path)
            except Exception:
                pass
                
    patient.profile_picture = f"/static/uploads/{filename}"
    db.commit()
    db.refresh(patient)
    
    return {"profile_picture": patient.profile_picture}


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
        title=consent.title,     #type:ignore
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


@router.get("/referrals/all", response_model=List[ReferralResponse])
def get_all_referrals_route(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    from modules.doctor.models import ReferralModel
    ref_list = db.query(ReferralModel).order_by(ReferralModel.date.desc()).all()
    return ref_list


@router.put("/referrals/{ref_id}", response_model=ReferralResponse)
def update_referral_route(
    ref_id: str,
    req: ReferralUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    from modules.doctor.models import ReferralModel
    ref = db.query(ReferralModel).filter(ReferralModel.id == ref_id).first()
    if not ref:
        raise HTTPException(status_code=404, detail="Referral not found")
    
    ref.status = req.status
    if req.my_consultation_notes is not None:
        ref.my_consultation_notes = req.my_consultation_notes
    if req.my_medications is not None:
        ref.my_medications = req.my_medications
        
    db.commit()
    db.refresh(ref)
    return ref
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

from .models import (
    PatientModel, PatientConsent, PatientNotificationModel, DoctorFeedbackModel
)
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
    PatientNotificationResponse,
    DoctorFeedbackCreate,
    DoctorFeedbackResponse,
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
    from modules.auth.models import UserModel
    doctors = db.query(DoctorModel).filter(DoctorModel.status != "Inactive").all()
    
    result = []
    for doc in doctors:
        user = db.query(UserModel).filter(UserModel.id == doc.user_id).first()
        profile_picture = user.profile_picture if user else None
        
        result.append({
            "id": doc.id,
            "name": doc.name if doc.name.startswith("Dr. ") else f"Dr. {doc.name}",
            "specialty": doc.specialty or "General Dentistry",
            "status": "On Duty" if doc.status == "Active" else doc.status,
            "profile_picture": profile_picture
        })
    return result


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

    # Trigger patient notification
    create_patient_notification(
        db=db,
        patient_token=patient.token,
        sender_role="doctor",
        type="consent",
        title="Pending Dental Consent Form",
        message=f"You have a new consent form '{req.title}' to sign."
    )

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


@router.get("/oral-health-details")
def get_oral_health_details(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    patient_id = current_user.get("patient_id")
    if not patient_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
    
    patient = db.query(PatientModel).filter(PatientModel.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

    from modules.treatment_plan.models import TreatmentPlanModel, TreatmentPlanStepModel

    # Find the active treatment plan for this patient
    active_plan = db.query(TreatmentPlanModel).filter(
        TreatmentPlanModel.patient_token == patient.token,
        TreatmentPlanModel.status == "Active"
    ).order_by(TreatmentPlanModel.created_at.desc()).first()

    if not active_plan:
        # Fallback to any latest treatment plan (e.g. Draft) if no active one exists
        active_plan = db.query(TreatmentPlanModel).filter(
            TreatmentPlanModel.patient_token == patient.token
        ).order_by(TreatmentPlanModel.created_at.desc()).first()

    base_score = 100
    diagnoses = []
    tips = []
    deductions = []
    completed_steps = 0
    total_steps = 0
    completion_rate = 0.0

    if active_plan:
        # Parse diagnoses
        raw_diagnoses = active_plan.diagnoses or []
        if isinstance(raw_diagnoses, list):
            diagnoses = raw_diagnoses
        elif isinstance(raw_diagnoses, str):
            import json
            try:
                diagnoses = json.loads(raw_diagnoses)
            except Exception:
                diagnoses = [d.strip() for d in raw_diagnoses.split(",") if d.strip()]

        # Calculate completion rate from steps
        steps = db.query(TreatmentPlanStepModel).filter(TreatmentPlanStepModel.plan_id == active_plan.id).all()
        total_steps = len(steps)
        if total_steps > 0:
            completed_steps = sum(1 for s in steps if s.status == "Completed")
            completion_rate = completed_steps / total_steps

        # Compute deductions
        total_deduction = 0
        for diag in diagnoses:
            diag_lower = diag.lower()
            penalty = 0
            name = diag
            
            if any(kw in diag_lower for kw in ["pulpitis", "abscess", "infection", "root canal needed"]):
                penalty = 20
                name = "Pulpitis/Infection"
            elif any(kw in diag_lower for kw in ["periodontitis", "deep pocket", "gum disease"]):
                penalty = 20
                name = "Periodontal Disease"
            elif any(kw in diag_lower for kw in ["caries", "cavity", "decay"]):
                penalty = 15
                name = "Active Caries (Decay)"
            elif any(kw in diag_lower for kw in ["gingivitis", "bleeding gums", "calculus", "plaque"]):
                penalty = 10
                name = "Gingivitis/Calculus Deposit"
            elif any(kw in diag_lower for kw in ["crowding", "malocclusion", "bite", "crossbite", "deep bite"]):
                penalty = 8
                name = "Malocclusion/Crowding"
            elif any(kw in diag_lower for kw in ["missing", "extraction"]):
                penalty = 5
                name = "Unreplaced Missing Tooth"
            elif any(kw in diag_lower for kw in ["impacted", "wisdom"]):
                penalty = 5
                name = "Impacted Tooth"
            else:
                penalty = 5
                name = diag

            if penalty > 0:
                total_deduction += penalty
                deductions.append({"condition": name, "penalty": penalty})

        # Cap max deduction at 60 points so score doesn't drop below 40
        if total_deduction > 60:
            total_deduction = 60

        # Apply progress recovery offset
        actual_deduction = total_deduction * (1.0 - completion_rate)
        final_score = int(round(100 - actual_deduction))
    else:
        # Default fallback if no treatment plans
        final_score = 95
        completion_rate = 1.0

    # Categorize label
    if final_score >= 80:
        label = "Excellent" if final_score >= 90 else "Good"
    elif final_score >= 60:
        label = "Moderate"
    else:
        label = "Needs Attention"

    # Generate personalized tips
    unique_types = set()
    for diag in diagnoses:
        diag_lower = diag.lower()
        if any(kw in diag_lower for kw in ["caries", "cavity", "decay"]):
            unique_types.add("caries")
        if any(kw in diag_lower for kw in ["periodontitis", "gingivitis", "calculus", "plaque", "gum"]):
            unique_types.add("gum")
        if any(kw in diag_lower for kw in ["crowding", "bite", "malocclusion"]):
            unique_types.add("ortho")
        if any(kw in diag_lower for kw in ["pulpitis", "infection", "abscess"]):
            unique_types.add("infection")

    if "caries" in unique_types:
        tips.append("Use fluoride toothpaste and brush twice daily for at least 2 minutes.")
        tips.append("Limit sugary snacks and sticky beverages between meals to restrict bacterial growth.")
    if "gum" in unique_types:
        tips.append("Floss daily to remove plaque from between teeth where toothbrushes can't reach.")
        tips.append("Consider using an antiseptic mouthwash to reduce plaque-causing bacteria.")
        tips.append("Attend professional cleaning (scaling and root planing) as scheduled in your treatment plan.")
    if "ortho" in unique_types:
        tips.append("Wear orthodontic aligners/retainers exactly as directed by your dentist.")
        tips.append("Use interdental brushes or floss threaders to clean hard-to-reach areas.")
    if "infection" in unique_types:
        tips.append("Avoid chewing hard foods on the affected side until treatment (like a root canal) is completed.")
        tips.append("Rinse with warm saltwater to alleviate gum discomfort and inflammation.")

    # General tips
    tips.append("Stay hydrated and rinse your mouth with water after meals to clear food residues.")
    tips.append("Schedule a routine dental examination and clean-up every 6 months.")

    return {
        "score": final_score,
        "label": label,
        "diagnoses": diagnoses,
        "deductions": deductions,
        "tips": tips[:4],  # limit to top 4 tips
        "completion_rate": completion_rate,
        "total_steps": total_steps,
        "updated_at": active_plan.created_at.isoformat() if active_plan and active_plan.created_at else None
    }


# ---------------------------------------------------------------------------
# Patient Notifications & Doctor Feedback (New)
# ---------------------------------------------------------------------------

def create_patient_notification(db: Session, patient_token: str, sender_role: str, type: str, title: str, message: str):
    """Utility function to create a new notification for a patient."""
    notif = PatientNotificationModel(
        patient_token=patient_token,
        sender_role=sender_role,
        type=type,
        title=title,
        message=message,
        read=False
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif


@router.get("/notifications", response_model=List[PatientNotificationResponse])
def get_patient_notifications(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    patient_id = current_user.get("patient_id")
    if not patient_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
    
    patient = db.query(PatientModel).filter(PatientModel.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

    notifs = db.query(PatientNotificationModel).filter(
        PatientNotificationModel.patient_token == patient.token
    ).order_by(PatientNotificationModel.created_at.desc()).all()

    return notifs


@router.put("/notifications/{notif_id}/read", response_model=PatientNotificationResponse)
def mark_patient_notif_read(
    notif_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    patient_id = current_user.get("patient_id")
    if not patient_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
    
    patient = db.query(PatientModel).filter(PatientModel.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

    notif = db.query(PatientNotificationModel).filter(
        PatientNotificationModel.id == notif_id,
        PatientNotificationModel.patient_token == patient.token
    ).first()
    if not notif:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    
    notif.read = True
    db.commit()
    db.refresh(notif)
    return notif


@router.put("/notifications/read-all")
def mark_all_patient_notifs_read(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    patient_id = current_user.get("patient_id")
    if not patient_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
    
    patient = db.query(PatientModel).filter(PatientModel.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

    db.query(PatientNotificationModel).filter(
        PatientNotificationModel.patient_token == patient.token,
        PatientNotificationModel.read == False
    ).update({"read": True}, synchronize_session=False)
    db.commit()
    return {"detail": "All notifications marked as read"}


@router.delete("/notifications/{notif_id}")
def delete_patient_notif(
    notif_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    patient_id = current_user.get("patient_id")
    if not patient_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
    
    patient = db.query(PatientModel).filter(PatientModel.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

    notif = db.query(PatientNotificationModel).filter(
        PatientNotificationModel.id == notif_id,
        PatientNotificationModel.patient_token == patient.token
    ).first()
    if not notif:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    
    db.delete(notif)
    db.commit()
    return {"detail": "Notification deleted successfully"}


@router.post("/feedback", response_model=DoctorFeedbackResponse)
def submit_doctor_feedback(
    req: DoctorFeedbackCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    patient_id = current_user.get("patient_id")
    if not patient_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
    
    patient = db.query(PatientModel).filter(PatientModel.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

    feedback = DoctorFeedbackModel(
        patient_token=patient.token,
        patient_name=patient.name,
        doctor_name=req.doctor_name,
        rating=req.rating,
        feedback_text=req.feedback_text,
        escalated=True
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    return feedback


@router.get("/feedback", response_model=List[DoctorFeedbackResponse])
def get_all_feedback(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    patient_id = current_user.get("patient_id")
    roles = current_user.get("roles", [])

    if patient_id:
        patient = db.query(PatientModel).filter(PatientModel.id == patient_id).first()
        if not patient:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
        feedbacks = db.query(DoctorFeedbackModel).filter(
            DoctorFeedbackModel.patient_token == patient.token
        ).order_by(DoctorFeedbackModel.created_at.desc()).all()
    else:
        # Staff role (Admin or Doctor)
        if "Admin" not in roles and "Doctor" not in roles and "Receptionist" not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        feedbacks = db.query(DoctorFeedbackModel).order_by(DoctorFeedbackModel.created_at.desc()).all()
    
    return feedbacks


@router.get("/feedback/doctor/{doctor_name}")
def get_doctor_feedback_summary(
    doctor_name: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    feedbacks = db.query(DoctorFeedbackModel).filter(
        DoctorFeedbackModel.doctor_name.ilike(f"%{doctor_name}%")
    ).order_by(DoctorFeedbackModel.created_at.desc()).all()

    ratings = [f.rating for f in feedbacks]
    avg_rating = sum(ratings) / len(ratings) if ratings else 0.0

    return {
        "doctor_name": doctor_name,
        "average_rating": round(avg_rating, 2),
        "total_reviews": len(feedbacks),
        "feedbacks": [
            {
                "id": f.id,
                "patient_name": f.patient_name,
                "rating": f.rating,
                "feedback_text": f.feedback_text,
                "created_at": f.created_at.isoformat() if f.created_at else None
            }
            for f in feedbacks
        ]
    }


@router.post("/clinical-notes", response_model=ClinicalNoteResponse)
def save_clinical_note_route(
    req: ClinicalNoteCreate,
    db: Session = Depends(get_db)
):
    note_date = req.date or datetime.datetime.now().isoformat()
    new_note = ClinicalNoteModel(
        patient_token=req.patient_token,
        doctor_name=req.doctor_name,
        note=req.note,
        date=note_date,
        medications=req.medications
    )
    db.add(new_note)

    # Automatically create a matching PatientPrescription record if medications list is present
    if req.medications and len(req.medications) > 0:
        from .models import PatientPrescription
        new_rx = PatientPrescription(
            patient_token=req.patient_token,
            doctor_name=req.doctor_name,
            medications=req.medications
        )
        db.add(new_rx)

    db.commit()
    db.refresh(new_note)
    return new_note


@router.get("/clinical-notes", response_model=List[ClinicalNoteResponse])
def get_my_clinical_notes_route(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    patient_id = current_user.get("patient_id")
    if not patient_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
        
    patient = db.query(PatientModel).filter(PatientModel.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    notes = db.query(ClinicalNoteModel).filter(
        ClinicalNoteModel.patient_token == patient.token
    ).order_by(ClinicalNoteModel.created_at.desc()).all()
    
    return notes


@router.get("/clinical-notes/{patient_token}", response_model=List[ClinicalNoteResponse])
def get_patient_clinical_notes_route(
    patient_token: str,
    db: Session = Depends(get_db)
):
    notes = db.query(ClinicalNoteModel).filter(
        ClinicalNoteModel.patient_token == patient_token
    ).order_by(ClinicalNoteModel.created_at.desc()).all()
    return notes


