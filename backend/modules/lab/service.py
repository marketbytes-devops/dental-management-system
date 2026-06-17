# service.py - business logic
from sqlalchemy.orm import Session
from .models import LabOrderModel

def get_active_lab_orders(db: Session):
    return db.query(LabOrderModel).filter(LabOrderModel.status != "Delivered").all()
