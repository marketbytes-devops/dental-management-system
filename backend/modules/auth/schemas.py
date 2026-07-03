# schemas.py - auth schemas
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

class UserLogin(BaseModel):
    username: str  # Can be username or email
    password: str

class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    roles: List[str]
    specialties: List[str] = []
    dob: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    licence_id: Optional[str] = None
    chair_setup: Optional[str] = None
    board: Optional[str] = None

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    roles: Optional[List[str]] = None
    specialties: Optional[List[str]] = None
    dob: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    licence_id: Optional[str] = None
    chair_setup: Optional[str] = None
    board: Optional[str] = None
    profile_picture: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    name: str
    username: str
    email: str
    roles: List[str]
    specialties: List[str]
    status: str
    dob: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    licence_id: Optional[str] = None
    chair_setup: Optional[str] = None
    board: Optional[str] = None
    profile_picture: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    role_type: str
    roles: List[str]

