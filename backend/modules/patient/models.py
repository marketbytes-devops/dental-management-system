# models.py - database table definitions
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date
from sqlalchemy.sql import func
from database import Base


class PatientModel(Base):
    __tablename__ = "patients"

    # Core
    id = Column(Integer, primary_key=True, index=True)
    token = Column(String, unique=True, index=True)

    name = Column(String, index=True, nullable=False)
    gender = Column(String, nullable=False)
    phone = Column(String, nullable=False)

    # Authentication
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)

    # Personal details
    date_of_birth = Column(Date, nullable=True)
    blood_group = Column(String, nullable=True)

    # Address
    address_line1 = Column(String, nullable=True)
    city = Column(String, nullable=True)
    state = Column(String, nullable=True)
    pincode = Column(String, nullable=True)

    # Emergency contact
    emergency_contact_name = Column(String, nullable=True)
    emergency_contact_phone = Column(String, nullable=True)

    # Medical
    known_allergies = Column(String, nullable=True)

    # Status / system fields
    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())