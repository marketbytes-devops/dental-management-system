# router.py - all /patient/* endpoints
import os
import datetime
import shutil
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user
from modules.doctor.models import DoctorModel
from shared.utils.pdf_generator import generate_consent_pdf

from .models import (
    PatientConsent, 
    PatientModel, 
    ClinicalNoteModel,
    PatientNotificationModel,
    DoctorFeedbackModel
)
from .schemas import (
    ConsentRequest,
    ConsentCustomCreate,
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
        
        user_specs = user.specialties if (user and user.specialties) else []
        if not user_specs and doc.specialty:
            user_specs = [s.strip() for s in doc.specialty.split(",") if s.strip()]
        if not user_specs:
            user_specs = ["General Dentistry"]

        result.append({
            "id": doc.id,
            "name": doc.name if doc.name.startswith("Dr. ") else f"Dr. {doc.name}",
            "specialty": doc.specialty or "General Dentistry",
            "specialties": user_specs,
            "status": "On Duty" if doc.status == "Active" else doc.status,
            "profile_picture": profile_picture
        })
    return result

@router.get("/doctors/{doctor_id}/available-slots")
def get_doctor_available_slots(doctor_id: int, date: str, db: Session = Depends(get_db)):
    """Public endpoint to get available time slots for a doctor on a specific date."""
    from modules.doctor.models import DoctorModel, DoctorShiftModel
    from modules.frontdesk.models import AppointmentModel
    from modules.leave.models import LeaveRequestModel
    from datetime import datetime, timedelta

    doctor = db.query(DoctorModel).filter(DoctorModel.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    try:
        dt = datetime.strptime(date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    day_name = dt.strftime("%A")

    # Read working_hours from the doctor model
    working_hours = doctor.working_hours or {}
    schedule = working_hours.get(day_name, {})
    
    if schedule.get("is_off", True):
        return {"date": date, "available_slots": []}

    # Check if the doctor is on leave
    is_on_leave = db.query(LeaveRequestModel).filter(
        LeaveRequestModel.user_id == doctor.user_id,
        LeaveRequestModel.status == "Approved",
        LeaveRequestModel.start_date <= date,
        LeaveRequestModel.end_date >= date
    ).first()

    if is_on_leave:
        return {"date": date, "available_slots": []}

    # Generate slots
    slots = []
    
    def parse_time_to_minutes(time_str):
        if not time_str:
            return None
        try:
            time_obj = datetime.strptime(time_str.strip(), "%I:%M %p")
            return time_obj.hour * 60 + time_obj.minute
        except ValueError:
            return None

    def minutes_to_time_str(mins):
        hr = mins // 60
        mn = mins % 60
        ampm = "AM" if hr < 12 else "PM"
        display_hr = hr if hr <= 12 else hr - 12
        if display_hr == 0:
            display_hr = 12
        return f"{display_hr:02d}:{mn:02d} {ampm}"

    start_min = parse_time_to_minutes(schedule.get("start", "09:00 AM")) or (9 * 60)
    end_min = parse_time_to_minutes(schedule.get("end", "05:00 PM")) or (17 * 60)
    
    break_start_min = parse_time_to_minutes(schedule.get("break_start"))
    break_end_min = parse_time_to_minutes(schedule.get("break_end"))

    duration = 30
    current = start_min
    
    while current + duration <= end_min:
        # Check if this slot overlaps with break
        slot_end = current + duration
        is_break = False
        if break_start_min is not None and break_end_min is not None:
            # If slot overlaps with break period
            if (current < break_end_min) and (slot_end > break_start_min):
                is_break = True
                
        if not is_break:
            slots.append(minutes_to_time_str(current))
            
        current += duration

    # Get appointments for this doctor on this date
    appointments = db.query(AppointmentModel).filter(
        AppointmentModel.doctor_name == doctor.name,
        AppointmentModel.appointment_date == dt.date(),
        AppointmentModel.status != "Cancelled"
    ).all()

    # Count appointments per slot
    slot_counts = {}
    for appt in appointments:
        time_str = appt.appointment_time
        try:
            if "AM" in time_str or "PM" in time_str:
                appt_min = parse_time_to_minutes(time_str)
            else:
                time_obj = datetime.strptime(time_str.strip(), "%H:%M")
                appt_min = time_obj.hour * 60 + time_obj.minute
                
            if appt_min is not None:
                std_time = minutes_to_time_str(appt_min)
                slot_counts[std_time] = slot_counts.get(std_time, 0) + 1
        except Exception:
            continue

    # Filter available slots (limit 2 per slot)
    available = []
    for s in slots:
        is_full = slot_counts.get(s, 0) >= 2
        available.append({"time": s, "is_full": is_full})

    return {"date": date, "available_slots": available}


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
    ext = os.path.splitext(file.filename)[1]            #type:ignore
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
                
    patient.profile_picture = f"/static/uploads/{filename}"     #type:ignore
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


# (Consents section relocated to dedicated endpoints block below)


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
    patient = None
    if req.patient_id:
        patient = db.query(PatientModel).filter(PatientModel.id == req.patient_id).first()
    elif req.patient_token:
        patient = db.query(PatientModel).filter(PatientModel.token == req.patient_token).first()
        
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

    new_consent = PatientConsent(
        patient_id=patient.id,
        patient_token=patient.token,
        doctor_id=req.doctor_id or 0,
        doctor_name=req.doctor_name,
        procedure_name=req.procedure_name,
        custom_details=req.custom_details,
        treatment_plan_id=req.treatment_plan_id or 0,
        step_id=req.step_id or 0,
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


@router.post("/consents/custom-request", response_model=ConsentResponse)
def create_custom_consent(req: ConsentCustomCreate, db: Session = Depends(get_db)):
    """Doctor creates a custom consent form for a procedure in a treatment sitting."""
    patient = db.query(PatientModel).filter(PatientModel.token == req.patient_token).first()
    if not patient:
        # Fallback search by ID if token is numeric ID
        if req.patient_token.isdigit():
            patient = db.query(PatientModel).filter(PatientModel.id == int(req.patient_token)).first()
            
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

    title = req.title or f"Consent Form: {req.procedure_name}"
    now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
    patient_display_name = getattr(req, "patient_name", None) or patient.name

    formatted_content = (
        f"PROCEDURE INFORMED CONSENT FORM\n"
        f"====================================\n"
        f"Procedure Name: {req.procedure_name}\n"
        f"Doctor Name: {req.doctor_name}\n"
        f"Patient Name: {patient_display_name} (Token: {patient.token})\n"
        f"Date & Time: {now_str}\n\n"
        f"CLINICAL & PROCEDURE DETAILS:\n"
        f"{req.custom_details or 'No additional details specified.'}\n\n"
        f"ACKNOWLEDGMENT & AGREEMENT:\n"
        f"I have read and fully understand the procedure details described above. The doctor has explained the risks, benefits, and alternative treatment options. I hereby give my consent for this procedure."
    )

    # Check if a consent form already exists for this step to avoid duplicates
    existing_consent = None
    if req.step_id and req.step_id > 0:
        existing_consent = db.query(PatientConsent).filter(PatientConsent.step_id == req.step_id).first()
    elif req.treatment_plan_id and req.treatment_plan_id > 0:
        existing_consent = db.query(PatientConsent).filter(
            PatientConsent.patient_token == patient.token,
            PatientConsent.treatment_plan_id == req.treatment_plan_id,
            PatientConsent.procedure_name == req.procedure_name,
            PatientConsent.status == "PENDING"
        ).first()

    if existing_consent:
        existing_consent.doctor_name = req.doctor_name
        existing_consent.procedure_name = req.procedure_name
        existing_consent.custom_details = req.custom_details
        existing_consent.title = title
        existing_consent.content = formatted_content
        if req.step_id and req.step_id > 0:
            existing_consent.step_id = req.step_id
        db.commit()
        db.refresh(existing_consent)
        new_consent = existing_consent
    else:
        new_consent = PatientConsent(
            patient_id=patient.id,
            patient_token=patient.token,
            doctor_id=req.doctor_id or 0,
            doctor_name=req.doctor_name,
            procedure_name=req.procedure_name,
            custom_details=req.custom_details,
            treatment_plan_id=req.treatment_plan_id or 0,
            step_id=req.step_id or 0,
            title=title,
            content=formatted_content,
            status="PENDING",
        )
        db.add(new_consent)
        db.commit()
        db.refresh(new_consent)

    # Link to treatment step model if step_id provided
    if req.step_id and req.step_id > 0:
        step = db.query(TreatmentPlanStepModel).filter(TreatmentPlanStepModel.id == req.step_id).first()
        if step:
            step.consent_id = new_consent.id
            step.consent_status = "Pending"
            db.commit()

    # Trigger patient notification
    create_patient_notification(
        db=db,
        patient_token=patient.token,
        sender_role="doctor",
        type="consent",
        title=f"New Consent Request: {req.procedure_name}",
        message=f"Dr. {req.doctor_name} has requested your consent for procedure '{req.procedure_name}'."
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


@router.get("/consents/all-staff", response_model=List[ConsentResponse])
def get_all_consents_for_staff(
    search: Optional[str] = None,
    status_filter: Optional[str] = None,
    doctor_name: Optional[str] = None,
    patient_token: Optional[str] = None,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Staff (Receptionist, Doctor, Admin) endpoint to list and filter all consent forms."""
    roles = current_user.get("roles", [])
    patient_id = current_user.get("patient_id")

    if patient_id and not roles:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Staff access required")

    query = db.query(PatientConsent)

    if patient_token:
        patient = db.query(PatientModel).filter(PatientModel.token == patient_token).first()
        p_id = patient.id if patient else None
        query = query.filter((PatientConsent.patient_token == patient_token) | (PatientConsent.patient_id == p_id))

    if status_filter and status_filter.upper() != "ALL":
        query = query.filter(PatientConsent.status == status_filter.upper())

    if doctor_name and doctor_name.strip():
        query = query.filter(PatientConsent.doctor_name.ilike(f"%{doctor_name.strip()}%"))

    consents = query.order_by(PatientConsent.created_at.desc()).all()

    if search and search.strip():
        search_term = search.strip().lower()
        patients_matched = db.query(PatientModel).filter(
            (PatientModel.name.ilike(f"%{search_term}%")) |
            (PatientModel.token.ilike(f"%{search_term}%")) |
            (PatientModel.phone.ilike(f"%{search_term}%"))
        ).all()
        matched_tokens = {p.token for p in patients_matched}
        matched_ids = {p.id for p in patients_matched}

        filtered = []
        for c in consents:
            if (c.patient_token in matched_tokens) or (c.patient_id in matched_ids) or (c.title and search_term in c.title.lower()) or (c.procedure_name and search_term in c.procedure_name.lower()):
                filtered.append(c)
        return filtered

    return consents


@router.post("/consents/{consent_id}/sign", response_model=ConsentResponse)
def sign_consent(
    consent_id: int,
    req: ConsentSignRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Patient signs a consent form online, or Staff (Receptionist/Doctor/Admin) signs in-person with patient.
    """
    patient_id = current_user.get("patient_id")
    roles = current_user.get("roles", [])
    normalized_roles = [r.lower() for r in roles]

    consent = db.query(PatientConsent).filter(PatientConsent.id == consent_id).first()
    if not consent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Consent not found")

    if not patient_id:
        # Must be a staff member acting on behalf of the patient
        if not any(r in normalized_roles for r in ["admin", "doctor", "receptionist", "reception"]):
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

    # Authorisation check: ensure consent belongs to this patient if patient token
    if not roles and consent.patient_id and consent.patient_id != patient.id:
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
    consent.patient_token = patient.token
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


@router.post("/consents/{consent_id}/upload-signed", response_model=ConsentResponse)
def upload_signed_consent_file(
    consent_id: int,
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Receptionist/Staff uploads scanned physical paper consent form."""
    roles = current_user.get("roles", [])
    normalized_roles = [r.lower() for r in roles]
    if not any(r in normalized_roles for r in ["admin", "doctor", "receptionist", "reception"]):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Staff authorization required")

    consent = db.query(PatientConsent).filter(PatientConsent.id == consent_id).first()
    if not consent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Consent form not found")

    os.makedirs("static/uploads/consents", exist_ok=True)
    ext = os.path.splitext(file.filename)[1] or ".pdf"
    filename = f"signed_consent_{consent_id}_{int(datetime.datetime.now().timestamp())}{ext}"
    file_path = os.path.join("static/uploads/consents", filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    saved_url = f"/static/uploads/consents/{filename}"

    consent.status = "SIGNED"
    consent.signing_method = "RECEPTION_UPLOAD"
    consent.uploaded_document_path = saved_url
    consent.pdf_file_path = file_path
    consent.signed_at = datetime.datetime.now(datetime.timezone.utc)

    # Sync treatment plan step if linked
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
    """Serve the signed PDF or uploaded document file."""
    patient_id = current_user.get("patient_id")
    roles = current_user.get("roles", [])
    normalized_roles = [r.lower() for r in roles]

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
        if not any(r in normalized_roles for r in ["admin", "doctor", "receptionist", "reception"]):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    pdf_file = consent.pdf_file_path or consent.uploaded_document_path
    if pdf_file and pdf_file.startswith("/"):
        pdf_file = pdf_file.lstrip("/")

    if not pdf_file or not os.path.exists(pdf_file):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="PDF or uploaded document file not found")

    return FileResponse(
        path=pdf_file,
        filename=os.path.basename(pdf_file),
        media_type="application/pdf" if pdf_file.endswith(".pdf") else None,
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
            if isinstance(diag, dict):
                diag = diag.get("condition") or diag.get("name") or str(diag)
            elif not isinstance(diag, str):
                diag = str(diag)
                
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

    updated_at_val = None
    if active_plan and active_plan.created_at:
        try:
            updated_at_val = active_plan.created_at.isoformat()
        except AttributeError:
            updated_at_val = str(active_plan.created_at)

    return {
        "score": final_score,
        "label": label,
        "diagnoses": diagnoses,
        "deductions": deductions,
        "tips": tips[:4],  # limit to top 4 tips
        "completion_rate": completion_rate,
        "total_steps": total_steps,
        "updated_at": updated_at_val
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

    # 1. Automatically create a matching PatientPrescription record if medications list is present
    if req.medications and len(req.medications) > 0:
        from .models import PatientPrescription
        new_rx = PatientPrescription(
            patient_token=req.patient_token,
            doctor_name=req.doctor_name,
            medications=req.medications
        )
        db.add(new_rx)

    # Fetch patient name for dispensing & billing records
    patient_obj = db.query(PatientModel).filter(PatientModel.token == req.patient_token).first()
    patient_name = patient_obj.name if patient_obj else "Unknown Patient"

    # 2. Automatically create Dispensing entry for Receptionist
    from .models import MedicineDispenseModel
    new_dispense = MedicineDispenseModel(
        patient_token=req.patient_token,
        patient_name=patient_name,
        doctor_name=req.doctor_name,
        medications=req.medications or [],
        status="Pending"
    )
    db.add(new_dispense)

    # 3. Automatically create Consultation Charge for Accountant (Always, every visit)
    from modules.billing.models import BillingRequestModel
    consultation_charge = BillingRequestModel(
        patient_token=req.patient_token,
        doctor_name=req.doctor_name,
        total_amount=500.0,
        status="Pending",
        source_type="consultation",
        procedures=[{
            "name": "Clinical Consultation Charge",
            "rate": 500.0,
            "source": "consultation"
        }],
        notes=f"Automated consultation charge for diagnosis visit ({note_date[:10] if note_date else 'Today'})"
    )
    db.add(consultation_charge)

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


# ---------------------------------------------------------------------------
# Medicine Dispensing Queue Endpoints (For Receptionist)
# ---------------------------------------------------------------------------

def parse_pills_per_day(schedule: str) -> int:
    import re
    if not schedule:
        return 1
    s = str(schedule).strip().lower()
    if re.match(r"^\d+(?:-\d+)+$", s):
        parts = [int(p) for p in s.split("-") if p.isdigit()]
        return sum(parts) if parts else 1
    if "qid" in s or "4 times" in s or "4x" in s:
        return 4
    if "tds" in s or "tid" in s or "thrice" in s or "3 times" in s or "3x" in s:
        return 3
    if "bd" in s or "bid" in s or "twice" in s or "2 times" in s or "2x" in s:
        return 2
    if "od" in s or "once" in s or "1 time" in s or "1x" in s:
        return 1
    match = re.search(r"(\d+)\s*(?:pills?|tablets?|times?)", s)
    if match:
        return int(match.group(1))
    return 1

def parse_duration_days(duration: str) -> int:
    import re
    if not duration:
        return 1
    d = str(duration).strip().lower()
    num_match = re.search(r"\d+", d)
    val = int(num_match.group(0)) if num_match else 1
    if "week" in d:
        return max(1, val * 7)
    if "month" in d:
        return max(1, val * 30)
    return max(1, val)

@router.get("/dispensing")
def get_dispensing_queue(db: Session = Depends(get_db)):
    from .models import MedicineDispenseModel
    from modules.lab.models import InventoryItemModel

    dispenses = db.query(MedicineDispenseModel).order_by(MedicineDispenseModel.created_at.desc()).all()
    inventory_items = db.query(InventoryItemModel).all()
    inv_map = {}
    for item in inventory_items:
        if item.name:
            inv_map[item.name.strip().lower()] = float(item.unit_price) if item.unit_price is not None else 10.0

    result = []
    for d in dispenses:
        raw_meds = d.medications or []
        enriched_meds = []
        total_amount = 0.0

        for med in raw_meds:
            med_name = (med.get("medicine") or med.get("name") or "").strip()
            schedule = med.get("schedule", "")
            timing = med.get("timing", "")
            duration = med.get("duration", "")

            pills_per_day = parse_pills_per_day(schedule)
            duration_days = parse_duration_days(duration)
            total_pills = pills_per_day * duration_days

            # Unit price lookup from inventory or med object
            unit_price = inv_map.get(med_name.lower())
            if unit_price is None:
                unit_price = float(med.get("unit_price", 10.0))
            
            line_total = round(total_pills * unit_price, 2)
            total_amount += line_total

            enriched_meds.append({
                "medicine": med_name,
                "schedule": schedule,
                "timing": timing,
                "duration": duration,
                "pills_per_day": pills_per_day,
                "duration_days": duration_days,
                "total_pills": total_pills,
                "unit_price": unit_price,
                "line_total": line_total
            })

        result.append({
            "id": d.id,
            "patient_token": d.patient_token,
            "patient_name": d.patient_name,
            "doctor_name": d.doctor_name,
            "medications": enriched_meds,
            "total_amount": round(total_amount, 2),
            "status": d.status,
            "created_at": d.created_at.isoformat() if d.created_at else None,
            "dispensed_at": d.dispensed_at.isoformat() if d.dispensed_at else None
        })

    return result


@router.put("/dispensing/{dispense_id}/status")
def update_dispense_status(dispense_id: int, payload: dict, db: Session = Depends(get_db)):
    from .models import MedicineDispenseModel
    dispense = db.query(MedicineDispenseModel).filter(MedicineDispenseModel.id == dispense_id).first()
    if not dispense:
        raise HTTPException(status_code=404, detail="Dispensing record not found")

    new_status = payload.get("status", "Dispensed")
    dispense.status = new_status
    if new_status.lower() == "dispensed":
        dispense.dispensed_at = datetime.datetime.now()

    db.commit()
    db.refresh(dispense)
    return {
        "id": dispense.id,
        "status": dispense.status,
        "dispensed_at": dispense.dispensed_at.isoformat() if dispense.dispensed_at else None
    }



