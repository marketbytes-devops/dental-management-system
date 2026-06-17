# service.py - business logic
from sqlalchemy.orm import Session
from .models import AdminModel

def get_admin_settings(db: Session):
    return db.query(AdminModel).all()
