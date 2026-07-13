# models.py - database table definitions
from sqlalchemy import Column, Integer, String, JSON, ForeignKey
from database import Base

class DoctorModel(Base):
    __tablename__ = "doctors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    specialty = Column(String)
    status = Column(String, default="Active")
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    dob = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    address = Column(String, nullable=True)
    licence_id = Column(String, nullable=True)
    chair_setup = Column(String, nullable=True)
    board = Column(String, nullable=True)
    working_hours = Column(JSON, nullable=True)


class ReferralModel(Base):
    __tablename__ = "referrals"

    id = Column(String, primary_key=True, index=True)
    patient_token = Column(String, index=True)
    referred_by = Column(String)
    speciality = Column(String)
    target_doctor = Column(String, nullable=True)
    date = Column(String)
    reason = Column(String)
    clinical_notes = Column(String, nullable=True)
    status = Column(String, default="Pending")
    my_consultation_notes = Column(String, nullable=True)
    my_medications = Column(JSON, nullable=True)  # List or JSON object of medications
    referral_type = Column(String, default="Internal")
    external_facility = Column(String, nullable=True)

