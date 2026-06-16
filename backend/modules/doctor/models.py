# models.py - database table definitions
from sqlalchemy import Column, Integer, String
from database import Base

class DoctorModel(Base):
    __tablename__ = "doctors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    specialty = Column(String)
