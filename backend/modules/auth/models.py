# models.py - database table definitions for auth / users
from sqlalchemy import Column, Integer, String, JSON, DateTime
from sqlalchemy.sql import func
from database import Base

class UserModel(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    roles = Column(JSON, nullable=False, default=[])
    specialties = Column(JSON, nullable=False, default=[])
    status = Column(String, default="Active")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
