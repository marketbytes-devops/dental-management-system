# router.py - auth endpoints
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from modules.auth.models import UserModel
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
            
        is_doctor = any(r.lower() == "doctor" for r in (user.roles or []))
        if is_doctor:
            if user.status != "Active":
                user.status = "Active"
                db.commit()
                db.refresh(user)
                # Also update DoctorModel status
                doctor = db.query(DoctorModel).filter(DoctorModel.user_id == user.id).first()
                if doctor:
                    doctor.status = "Active"
                    db.commit()
        else:
            if user.status != "Active":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="This account has been deactivated. Please contact support."
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
        user.dob = None
        user.phone = None
        user.address = None
        user.licence_id = None
        user.chair_setup = None
        user.board = None

    return user


@router.get("/doctors")
def get_doctors_list(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    all_users = db.query(UserModel).all()
    doctors = [u for u in all_users if any(r.lower() == "doctor" for r in u.roles)]
    
    roster = []
    for idx, doc in enumerate(doctors):
        status_map = "On Duty"
        if doc.status == "Inactive":
            status_map = "Off Duty"
        elif doc.status == "On Break":
            status_map = "On Break"
            
        roster.append({
            "id": doc.id,
            "name": doc.name if doc.name.startswith("Dr. ") else f"Dr. {doc.name}",
            "specialty": ", ".join(doc.specialties) if doc.specialties else "General Dentistry",
            "operatory": doc.chair_setup or f"Operatory {idx % 6 + 1}",
            "shift": "09:00 AM - 05:00 PM" if idx % 2 == 0 else "10:00 AM - 06:00 PM",
            "status": status_map
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





