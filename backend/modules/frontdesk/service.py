# service.py - business logic
from sqlalchemy.orm import Session
from .models import AppointmentModel

def get_lobby_appointments(db: Session):
    return db.query(AppointmentModel).all()
