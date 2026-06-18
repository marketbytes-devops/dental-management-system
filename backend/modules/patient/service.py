# service.py - business logic
from sqlalchemy.orm import Session
from passlib.context import CryptContext
import random
from .models import PatientModel
from .schemas import PatientCreate

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def get_patient_by_token(db: Session, token: str):
    return db.query(PatientModel).filter(PatientModel.token == token).first()

def get_patient_by_phone(db: Session, phone: str):
    return db.query(PatientModel).filter(PatientModel.phone == phone).first()

def get_patient_by_email(db: Session, email: str):
    return db.query(PatientModel).filter(PatientModel.email == email).first()

def generate_unique_token(db: Session) -> str:
    while True:
        token = f"PT-{random.randint(10000, 99999)}"
        exists = db.query(PatientModel).filter(PatientModel.token == token).first()
        if not exists:
            return token

def create_patient(db: Session, patient_in: PatientCreate):
    hashed_password = get_password_hash(patient_in.password)
    token = generate_unique_token(db)
    
    db_patient = PatientModel(
        name=patient_in.name,
        age=patient_in.age,
        gender=patient_in.gender,
        phone=patient_in.phone,
        email=patient_in.email,
        password=hashed_password,
        token=token
    )
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    return db_patient
