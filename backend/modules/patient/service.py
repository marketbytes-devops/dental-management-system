# service.py - business logic
from sqlalchemy.orm import Session
from .models import PatientModel

def get_patient_by_token(db: Session, token: str):
    return db.query(PatientModel).filter(PatientModel.token == token).first()
