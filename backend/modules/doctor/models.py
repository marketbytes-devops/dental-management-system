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


class DoctorShiftModel(Base):
    __tablename__ = "doctor_shifts"

    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(Integer, ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False)
    
    # Flexible scheduling: can specify a day of the week (e.g. "Monday") OR a specific date
    day_of_week = Column(String, nullable=True) # e.g. Monday, Tuesday...
    specific_date = Column(String, nullable=True) # e.g. 2026-10-12
    
    start_time = Column(String, nullable=False) # e.g. "09:00"
    end_time = Column(String, nullable=False)   # e.g. "15:00"
    slot_duration = Column(Integer, default=30) # in minutes
