# models.py - database table definitions
from sqlalchemy import Column, Integer, String
from database import Base

class PatientModel(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    token = Column(String, unique=True, index=True)
    name = Column(String, index=True)
    age = Column(Integer)
    gender = Column(String)
    phone = Column(String)
