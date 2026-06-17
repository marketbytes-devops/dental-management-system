# service.py - business logic
from sqlalchemy.orm import Session
from .models import DoctorModel

def get_doctors(db: Session):
    return db.query(DoctorModel).all()
