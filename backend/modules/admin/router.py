# router.py - all /admin/* endpoints
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from modules.auth.models import UserModel
from modules.auth.schemas import UserCreate, UserResponse
from modules.auth.service import hash_password

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/users", response_model=List[UserResponse])
def get_users(db: Session = Depends(get_db)):
    return db.query(UserModel).order_by(UserModel.created_at.asc()).all()

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
    return new_user

@router.put("/users/{user_id}/status", response_model=UserResponse)
def toggle_user_status(user_id: int, db: Session = Depends(get_db)):
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )
    
    user.status = "Inactive" if user.status == "Active" else "Active"
    db.commit()
    db.refresh(user)
    return user
