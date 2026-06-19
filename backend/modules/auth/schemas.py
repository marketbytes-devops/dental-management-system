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

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    roles: Optional[List[str]] = None
    specialties: Optional[List[str]] = None


class UserResponse(BaseModel):
    id: int
    name: str
    username: str
    email: str
    roles: List[str]
    specialties: List[str]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
