# service.py - business logic
from sqlalchemy.orm import Session
import bcrypt
import random
from .models import PatientModel
from .schemas import PatientCreate, PatientUpdate, PasswordChangeRequest


def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8")
        )
    except Exception:
        return False


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


def create_patient(db: Session, patient_in: PatientCreate) -> PatientModel:
    hashed_password = get_password_hash(patient_in.password)
    token = generate_unique_token(db)

    db_patient = PatientModel(
        token=token,
        # Personal
        name=patient_in.name,
        date_of_birth=patient_in.date_of_birth,
        gender=patient_in.gender,
        blood_group=patient_in.blood_group,
        # Contact
        phone=patient_in.phone,
        email=patient_in.email,
        # Address
        address_line1=patient_in.address_line1,
        city=patient_in.city,
        state=patient_in.state,
        pincode=patient_in.pincode,
        # Emergency contact
        emergency_contact_name=patient_in.emergency_contact_name,
        emergency_contact_phone=patient_in.emergency_contact_phone,
        # Medical
        known_allergies=patient_in.known_allergies,
        # Auth
        password=hashed_password,
        is_active=True,
    )
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    return db_patient


def update_patient_profile(db: Session, patient_id: int, update_in) -> PatientModel:
    patient = db.query(PatientModel).filter(PatientModel.id == patient_id).first()
    if not patient:
        return None
    update_data = update_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(patient, field, value)
    db.commit()
    db.refresh(patient)
    return patient


def change_patient_password(db: Session, patient_id: int, current_password: str, new_password: str) -> bool:
    patient = db.query(PatientModel).filter(PatientModel.id == patient_id).first()
    if not patient:
        return False
    if not verify_password(current_password, patient.password):
        return False
    patient.password = get_password_hash(new_password)
    db.commit()
    return True