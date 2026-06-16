# models.py - database table definitions
from sqlalchemy import Column, Integer, String
from database import Base

class LabOrderModel(Base):
    __tablename__ = "lab_orders"

    id = Column(Integer, primary_key=True, index=True)
    patient_token = Column(String, index=True)
    item = Column(String)
    status = Column(String)
