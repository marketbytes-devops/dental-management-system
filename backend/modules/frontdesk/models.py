# models.py - database table definitions
from sqlalchemy import Column, Integer, String
from database import Base

class AppointmentModel(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    patient_name = Column(String, index=True)
    time = Column(String)
    status = Column(String)
