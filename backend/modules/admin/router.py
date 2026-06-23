# router.py - all /admin/* endpoints
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from modules.auth.models import UserModel
from modules.doctor.models import DoctorModel
from modules.auth.schemas import UserCreate, UserResponse, UserUpdate
from modules.auth.service import hash_password

from dependencies import require_admin

router = APIRouter(
    prefix="/admin",
    tags=["admin"],
    dependencies=[Depends(require_admin)]
)

@router.get("/users", response_model=List[UserResponse])
def get_users(db: Session = Depends(get_db)):
    users = db.query(UserModel).order_by(UserModel.created_at.asc()).all()
    for user in users:
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
    return users

@router.post("/users", response_model=UserResponse)
def create_user(user_data: UserCreate, db: Session = Depends(get_db)):
    # Check if email already exists
    existing_email = db.query(UserModel).filter(UserModel.email.ilike(user_data.email)).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email is already registered."
        )

    # Derive username from email prefix (e.g. "anoop" from "anoop@smilecare.com")
    username = user_data.email.split("@")[0]
    
    # Ensure username is unique in database
    existing_username = db.query(UserModel).filter(UserModel.username.ilike(username)).first()
    if existing_username:
        username = user_data.email

    hashed = hash_password(user_data.password)
    
    new_user = UserModel(
        name=user_data.name,
        email=user_data.email,
        username=username,
        password_hash=hashed,
        roles=user_data.roles,
        specialties=user_data.specialties,
        status="Active"
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    is_doctor = any(r.lower() == "doctor" for r in (new_user.roles or []))
    if is_doctor:
        specialty_str = ", ".join(new_user.specialties) if new_user.specialties else "General Dentistry"
        new_doctor = DoctorModel(
            name=new_user.name,
            specialty=specialty_str,
            status="Active",
            user_id=new_user.id,
            dob=user_data.dob,
            phone=user_data.phone,
            address=user_data.address,
            licence_id=user_data.licence_id,
            chair_setup=user_data.chair_setup,
            board=user_data.board
        )
        db.add(new_doctor)
        db.commit()
        db.refresh(new_doctor)

        new_user.dob = new_doctor.dob
        new_user.phone = new_doctor.phone
        new_user.address = new_doctor.address
        new_user.licence_id = new_doctor.licence_id
        new_user.chair_setup = new_doctor.chair_setup
        new_user.board = new_doctor.board
    else:
        new_user.dob = None
        new_user.phone = None
        new_user.address = None
        new_user.licence_id = None
        new_user.chair_setup = None
        new_user.board = None

    return new_user

@router.put("/users/{user_id}/status", response_model=UserResponse)
def toggle_user_status(user_id: int, db: Session = Depends(get_db)):
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )
    assert user is not None
    
    user.status = "Inactive" if user.status == "Active" else "Active"
    db.commit()
    db.refresh(user)

    doctor = db.query(DoctorModel).filter(DoctorModel.user_id == user.id).first()
    if doctor:
        doctor.status = user.status
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

@router.put("/users/{user_id}", response_model=UserResponse)
def update_user(user_id: int, user_data: UserUpdate, db: Session = Depends(get_db)):
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )
    assert user is not None
    
    if user_data.name is not None:
        user.name = user_data.name
        
    if user_data.email is not None:
        existing = db.query(UserModel).filter(
            UserModel.email.ilike(user_data.email),
            UserModel.id != user_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this email is already registered."
            )
        user.email = user_data.email
        
        username = user_data.email.split("@")[0]
        existing_username = db.query(UserModel).filter(
            UserModel.username.ilike(username),
            UserModel.id != user_id
        ).first()
        if existing_username:
            username = user_data.email
        user.username = username

    if user_data.password is not None:
        user.password_hash = hash_password(user_data.password)

    if user_data.roles is not None:
        user.roles = user_data.roles

    if user_data.specialties is not None:
        user.specialties = user_data.specialties

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
            
        if user_data.name is not None:
            doctor.name = user.name
        if user_data.specialties is not None:
            doctor.specialty = ", ".join(user.specialties) if user.specialties else "General Dentistry"
        if user_data.dob is not None:
            doctor.dob = user_data.dob
        if user_data.phone is not None:
            doctor.phone = user_data.phone
        if user_data.address is not None:
            doctor.address = user_data.address
        if user_data.licence_id is not None:
            doctor.licence_id = user_data.licence_id
        if user_data.chair_setup is not None:
            doctor.chair_setup = user_data.chair_setup
        if user_data.board is not None:
            doctor.board = user_data.board
            
        db.commit()
        db.refresh(doctor)
        
        user.dob = doctor.dob
        user.phone = doctor.phone
        user.address = doctor.address
        user.licence_id = doctor.licence_id
        user.chair_setup = doctor.chair_setup
        user.board = doctor.board
    else:
        doctor = db.query(DoctorModel).filter(DoctorModel.user_id == user.id).first()
        if doctor:
            db.delete(doctor)
            db.commit()
        user.dob = None
        user.phone = None
        user.address = None
        user.licence_id = None
        user.chair_setup = None
        user.board = None

    return user

@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )
    assert user is not None
    db.delete(user)
    db.commit()
    return {"detail": "User deleted successfully."}

