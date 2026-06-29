# router.py - auth endpoints
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from modules.auth.models import UserModel, StaffProfileModel
from modules.patient.models import PatientModel
from modules.doctor.models import DoctorModel
from modules.auth.schemas import UserLogin, UserResponse, TokenResponse, UserUpdate
from modules.auth.service import verify_password
from shared.utils.auth import create_access_token
from dependencies import get_current_user, get_current_active_user

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login", response_model=TokenResponse)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    # 1. Search in Staff (UserModel)
    user = db.query(UserModel).filter(
        (UserModel.email.ilike(login_data.username)) | 
        (UserModel.username.ilike(login_data.username))
    ).first()

    if user:
        if not verify_password(login_data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials. Verify your password."
            )
            
        if user.status != "Active":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This account has been deactivated. Please contact support."
            )
        
        token = create_access_token({
            "sub": user.username,
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
            "sub": patient.email,
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

    is_doctor = any(r.lower() == "doctor" for r in (user.roles or []))
    if is_doctor:
        doctor = db.query(DoctorModel).filter(DoctorModel.user_id == user.id).first()
        if doctor:
            user.dob = doctor.dob
            user.phone = doctor.phone
            user.address = doctor.address
            user.licence_id = doctor.licence_id
            user.chair_setup = doctor.chair_setup
            user.board = doctor.board
        else:
            user.dob = None
            user.phone = None
            user.address = None
            user.licence_id = None
            user.chair_setup = None
            user.board = None
    else:
        profile = db.query(StaffProfileModel).filter(StaffProfileModel.user_id == user.id).first()
        if profile:
            user.dob = profile.dob
            user.phone = profile.phone
            user.address = profile.address
            user.licence_id = profile.licence_id
            user.chair_setup = profile.chair_setup
            user.board = profile.board
        else:
            user.dob = None
            user.phone = None
            user.address = None
            user.licence_id = None
            user.chair_setup = None
            user.board = None

    return user


@router.put("/profile", response_model=UserResponse)
def update_profile(
    profile_data: UserUpdate,
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

    # Allow staff member to update their own profile fields
    if profile_data.name is not None:
        user.name = profile_data.name
    if profile_data.email is not None:
        # Check if email is already registered by another user
        existing = db.query(UserModel).filter(
            UserModel.email.ilike(profile_data.email),
            UserModel.id != user_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this email is already registered."
            )
        user.email = profile_data.email
        # Update username too
        user.username = profile_data.email.split("@")[0]

    if profile_data.password is not None:
        from modules.auth.service import hash_password
        user.password_hash = hash_password(profile_data.password)

    db.commit()
    db.refresh(user)

    is_doctor = any(r.lower() == "doctor" for r in (user.roles or []))
    if is_doctor:
        doctor = db.query(DoctorModel).filter(DoctorModel.user_id == user.id).first()
        if not doctor:
            specialty_str = ", ".join(user.specialties) if user.specialties else "General Dentistry"
            doctor = DoctorModel(
                name=user.name,
                specialty=specialty_str,
                status=user.status,
                user_id=user.id
            )
            db.add(doctor)
            db.commit()
            db.refresh(doctor)

        if profile_data.name is not None:
            doctor.name = user.name
        if profile_data.dob is not None:
            doctor.dob = profile_data.dob
        if profile_data.phone is not None:
            doctor.phone = profile_data.phone
        if profile_data.address is not None:
            doctor.address = profile_data.address
        if profile_data.licence_id is not None:
            doctor.licence_id = profile_data.licence_id
        if profile_data.chair_setup is not None:
            doctor.chair_setup = profile_data.chair_setup
        if profile_data.board is not None:
            doctor.board = profile_data.board

        db.commit()
        db.refresh(doctor)

        user.dob = doctor.dob
        user.phone = doctor.phone
        user.address = doctor.address
        user.licence_id = doctor.licence_id
        user.chair_setup = doctor.chair_setup
        user.board = doctor.board
    else:
        profile = db.query(StaffProfileModel).filter(StaffProfileModel.user_id == user.id).first()
        if not profile:
            profile = StaffProfileModel(user_id=user.id)
            db.add(profile)
            db.commit()
            db.refresh(profile)

        if profile_data.dob is not None:
            profile.dob = profile_data.dob
        if profile_data.phone is not None:
            profile.phone = profile_data.phone
        if profile_data.address is not None:
            profile.address = profile_data.address
        if profile_data.licence_id is not None:
            profile.licence_id = profile_data.licence_id
        if profile_data.chair_setup is not None:
            profile.chair_setup = profile_data.chair_setup
        if profile_data.board is not None:
            profile.board = profile_data.board

        db.commit()
        db.refresh(profile)

        user.dob = profile.dob
        user.phone = profile.phone
        user.address = profile.address
        user.licence_id = profile.licence_id
        user.chair_setup = profile.chair_setup
        user.board = profile.board

    return user


def match_doctor_appointment(doc_name: str, appt_doc_name: str) -> bool:
    if not doc_name or not appt_doc_name:
        return False
    d_name = doc_name.lower().replace("dr.", "").strip()
    a_name = appt_doc_name.lower().replace("dr.", "").strip()
    
    words_d = set(d_name.split())
    words_a = set(a_name.split())
    if words_d & words_a:
        return True
    return d_name in a_name or a_name in d_name


def build_doctor_slots(db: Session, doc_name: str, doc_status: str, today_appointments) -> list:
    if doc_status == "Off Duty" or doc_status == "Inactive" or doc_status == "Absent":
        return []
        
    base_slots = [
        "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
        "12:00 PM", "01:30 PM", "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM",
        "04:00 PM", "04:30 PM", "05:00 PM"
    ]
    
    def parse_to_minutes(t_str: str) -> int:
        try:
            parts = t_str.strip().upper().split()
            time_parts = parts[0].split(":")
            hr = int(time_parts[0])
            mn = int(time_parts[1]) if len(time_parts) > 1 else 0
            ampm = parts[1] if len(parts) > 1 else "AM"
            if ampm == "PM" and hr != 12:
                hr += 12
            elif ampm == "AM" and hr == 12:
                hr = 0
            return hr * 60 + mn
        except Exception:
            return 9999
            
    def format_time_str(t_str: str) -> str:
        try:
            parts = t_str.strip().upper().split()
            time_parts = parts[0].split(":")
            hr = int(time_parts[0])
            mn = int(time_parts[1]) if len(time_parts) > 1 else 0
            ampm = parts[1] if len(parts) > 1 else "AM"
            return f"{hr:02d}:{mn:02d} {ampm}"
        except Exception:
            return t_str
            
    doc_appts = []
    for appt in today_appointments:
        if match_doctor_appointment(doc_name, appt.doctor_name):
            doc_appts.append(appt)
            
    booked_slots = {}
    for appt in doc_appts:
        pat_name = "Patient"
        if appt.patient_id:
            pat = db.query(PatientModel).filter(PatientModel.id == appt.patient_id).first()
            if pat:
                pat_name = pat.name
                
        time_formatted = format_time_str(appt.appointment_time)
        minutes = parse_to_minutes(appt.appointment_time)
        booked_slots[minutes] = f"{time_formatted} (Booked - {pat_name})"
        
    final_slots = []
    used_booked_minutes = set()
    
    for b_slot in base_slots:
        b_min = parse_to_minutes(b_slot)
        exact_booked_min = None
        for min_val in booked_slots:
            if abs(min_val - b_min) < 15:
                exact_booked_min = min_val
                break
                
        if exact_booked_min is not None:
            final_slots.append(booked_slots[exact_booked_min])
            used_booked_minutes.add(exact_booked_min)
        else:
            final_slots.append(b_slot)
            
    for min_val, display_str in booked_slots.items():
        if min_val not in used_booked_minutes:
            final_slots.append(display_str)
            
    def slot_sort_key(s_val: str) -> int:
        t_part = s_val.split("(")[0].strip()
        return parse_to_minutes(t_part)
        
    final_slots.sort(key=slot_sort_key)
    return final_slots


@router.get("/doctors")
def get_doctors_list(
    date: str = None,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    import datetime
    from modules.frontdesk.models import AppointmentModel
    from modules.leave.models import LeaveRequestModel
    
    all_users = db.query(UserModel).all()
    doctors = [u for u in all_users if any(r.lower() == "doctor" for r in u.roles)]
    
    if date:
        on_leave_user_ids = db.query(LeaveRequestModel.user_id).filter(
            LeaveRequestModel.status == "Approved",
            LeaveRequestModel.start_date <= date,
            LeaveRequestModel.end_date >= date
        ).all()
        on_leave_set = {uid[0] for uid in on_leave_user_ids}
        doctors = [doc for doc in doctors if doc.id not in on_leave_set]
    
    today = datetime.date.today()
    today_appointments = db.query(AppointmentModel).filter(
        AppointmentModel.appointment_date == today,
        AppointmentModel.status != "Cancelled"
    ).all()
    
    roster = []
    for idx, doc in enumerate(doctors):
        doctor = db.query(DoctorModel).filter(DoctorModel.user_id == doc.id).first()
        
        today_str = today.isoformat()
        has_leave_today = db.query(LeaveRequestModel).filter(
            LeaveRequestModel.user_id == doc.id,
            LeaveRequestModel.status == "Approved",
            LeaveRequestModel.start_date <= today_str,
            LeaveRequestModel.end_date >= today_str
        ).first()
        
        status_map = "Available"
        if has_leave_today:
            status_map = "On Leave"
        elif doc.status == "Inactive":
            status_map = "Off Duty"
        elif doc.status == "On Break":
            status_map = "On Break"
            
        slots = build_doctor_slots(db, doc.name, status_map, today_appointments)
        
        roster.append({
            "id": doc.id,
            "name": doc.name if doc.name.startswith("Dr. ") else f"Dr. {doc.name}",
            "specialty": doctor.specialty if (doctor and doctor.specialty) else (", ".join(doc.specialties) if doc.specialties else "General Dentistry"),
            "dept": doctor.chair_setup if (doctor and doctor.chair_setup) else f"Operatory {idx % 6 + 1}",
            "operatory": doctor.chair_setup if (doctor and doctor.chair_setup) else f"Operatory {idx % 6 + 1}",
            "shift": "09:00 AM - 05:00 PM" if idx % 2 == 0 else "10:00 AM - 06:00 PM",
            "status": status_map,
            "slots": slots
        })
        
    return roster


@router.put("/status")
def update_my_status(
    status_data: dict,
    current_user: dict = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    user_id = current_user.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    new_status = status_data.get("status")
    if new_status not in ["Active", "On Break", "Inactive"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid status value. Must be 'Active', 'On Break', or 'Inactive'"
        )
        
    user.status = new_status
    db.commit()
    db.refresh(user)
    
    # Update DoctorModel status as well if user is a doctor
    doctor = db.query(DoctorModel).filter(DoctorModel.user_id == user.id).first()
    if doctor:
        doctor.status = new_status
        db.commit()
        
    return {"id": user.id, "status": user.status}


@router.put("/doctors/{doctor_id}/status")
def change_doctor_status_staff(
    doctor_id: int,
    status_data: dict = None,
    current_user: dict = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    user = db.query(UserModel).filter(UserModel.id == doctor_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
        
    is_doctor = any(r.lower() == "doctor" for r in (user.roles or []))
    if not is_doctor:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not a doctor"
        )
        
    new_status = status_data.get("status") if status_data else None
    if new_status:
        if new_status not in ["Active", "On Break", "Inactive"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid status value"
            )
        user.status = new_status
    else:
        # Cycle status
        if user.status == "Active":
            user.status = "On Break"
        elif user.status == "On Break":
            user.status = "Inactive"
        else:
            user.status = "Active"
            
    db.commit()
    db.refresh(user)
    
    doctor = db.query(DoctorModel).filter(DoctorModel.user_id == user.id).first()
    if doctor:
        doctor.status = user.status
        db.commit()
        
    status_map = "On Duty"
    if user.status == "Inactive":
        status_map = "Off Duty"
    elif user.status == "On Break":
        status_map = "On Break"
        
    return {"id": user.id, "status": status_map}





