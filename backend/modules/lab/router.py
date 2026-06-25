# router.py - lab technician and doctor lab endpoints
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from dependencies import get_current_user
from modules.lab.models import LabOrderModel, LabNotificationModel
from modules.lab.schemas import (
    LabOrderCreate,
    LabOrderStatusUpdate,
    LabOrderEdit,
    LabOrderResponse,
    LabNotificationResponse
)
from modules.patient.models import PatientModel
from modules.doctor.models import DoctorModel
from modules.auth.models import UserModel
import random
from datetime import datetime

router = APIRouter(
    prefix="/lab",
    tags=["lab"]
)

@router.post("/orders", response_model=LabOrderResponse)
def create_lab_order(
    order_data: LabOrderCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    # 1. Fetch patient name if not provided
    patient_name = order_data.patient_name
    if not patient_name:
        patient = db.query(PatientModel).filter(PatientModel.token == order_data.patient_token).first()
        if patient:
            patient_name = patient.name
        else:
            patient_name = "Walk-in Patient"

    # 2. Fetch doctor name and phone from current active user / DoctorModel
    dentist_name = order_data.dentist_name
    dentist_contact = order_data.dentist_contact
    
    user_id = current_user.get("user_id")
    if user_id:
        user = db.query(UserModel).filter(UserModel.id == user_id).first()
        if user:
            if not dentist_name:
                dentist_name = user.name if user.name.startswith("Dr. ") else f"Dr. {user.name}"
            doctor = db.query(DoctorModel).filter(DoctorModel.user_id == user.id).first()
            if doctor and not dentist_contact:
                dentist_contact = doctor.phone

    # Default fallbacks if still not resolved
    if not dentist_name:
        dentist_name = "Dr. Anoop Nair"
    if not dentist_contact:
        dentist_contact = "+91 98765 43210"

    # 3. Generate a case ID
    # Format e.g.: CASE-2026-009 or similar. Let's make it unique
    random_suffix = f"{random.randint(1, 999):03d}"
    case_id = f"CASE-2026-{random_suffix}"
    
    # Check uniqueness
    while db.query(LabOrderModel).filter(LabOrderModel.id == case_id).first():
        random_suffix = f"{random.randint(1, 999):03d}"
        case_id = f"CASE-2026-{random_suffix}"

    new_order = LabOrderModel(
        id=case_id,
        patient_token=order_data.patient_token,
        patient_name=patient_name,
        dentist_name=dentist_name,
        dentist_contact=dentist_contact,
        prosthetic_type=order_data.prosthetic_type,
        material=order_data.material,
        shade=order_data.shade,
        priority=order_data.priority,
        status="Pending",
        notes=order_data.notes,
        due_date=order_data.due_date or "2026-06-15",
        rejection_reason=None
    )

    db.add(new_order)
    db.commit()
    db.refresh(new_order)

    # 4. Generate notification for Lab Technician
    notif = LabNotificationModel(
        recipient_role="lab tech",
        type="Orders",
        title="New Lab Order Received",
        desc=f"Case {case_id} has been registered by {dentist_name} for patient {patient_name}.",
        read=False
    )
    db.add(notif)
    db.commit()

    return new_order

@router.get("/orders", response_model=List[LabOrderResponse])
def get_lab_orders(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    orders = db.query(LabOrderModel).order_by(LabOrderModel.created_at.desc()).all()
    return orders

@router.put("/orders/{order_id}/status", response_model=LabOrderResponse)
def update_lab_order_status(
    order_id: str,
    status_data: LabOrderStatusUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    order = db.query(LabOrderModel).filter(LabOrderModel.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Lab order not found")

    order.status = status_data.status
    if status_data.status == "Rejected":
        order.rejection_reason = status_data.rejection_reason
    else:
        order.rejection_reason = None
        
    db.commit()
    db.refresh(order)

    # Generate notification for Doctor
    desc = f"Case {order_id} for patient {order.patient_name or 'Walk-in Patient'} has been updated to '{status_data.status}' by Lab Technician."
    if status_data.status == "Rejected" and status_data.rejection_reason:
        desc += f" Reason: {status_data.rejection_reason}"

    notif = LabNotificationModel(
        recipient_role="doctor",
        type="labs",
        title=f"Lab Case {order_id} Updated",
        desc=desc,
        read=False
    )
    db.add(notif)
    db.commit()

    return order

@router.put("/orders/{order_id}", response_model=LabOrderResponse)
def edit_lab_order(
    order_id: str,
    edit_data: LabOrderEdit,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    order = db.query(LabOrderModel).filter(LabOrderModel.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Lab order not found")

    if edit_data.prosthetic_type is not None:
        order.prosthetic_type = edit_data.prosthetic_type
    if edit_data.material is not None:
        order.material = edit_data.material
    if edit_data.shade is not None:
        order.shade = edit_data.shade
    if edit_data.priority is not None:
        order.priority = edit_data.priority
    if edit_data.due_date is not None:
        order.due_date = edit_data.due_date
    if edit_data.notes is not None:
        order.notes = edit_data.notes

    db.commit()
    db.refresh(order)
    return order

@router.get("/notifications", response_model=List[LabNotificationResponse])
def get_lab_notifications(
    recipient_role: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    query = db.query(LabNotificationModel)
    if recipient_role:
        query = query.filter(LabNotificationModel.recipient_role == recipient_role)
    notifications = query.order_by(LabNotificationModel.created_at.desc()).all()
    return notifications

@router.put("/notifications/read-all")
def mark_all_notifications_as_read(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    db.query(LabNotificationModel).filter(LabNotificationModel.read == False).update({"read": True})
    db.commit()
    return {"detail": "All notifications marked as read"}

@router.put("/notifications/{notif_id}/read", response_model=LabNotificationResponse)
def mark_notification_as_read(
    notif_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    notif = db.query(LabNotificationModel).filter(LabNotificationModel.id == notif_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.read = True
    db.commit()
    db.refresh(notif)
    return notif

@router.delete("/notifications/{notif_id}")
def delete_notification(
    notif_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    notif = db.query(LabNotificationModel).filter(LabNotificationModel.id == notif_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    db.delete(notif)
    db.commit()
    return {"detail": "Notification deleted successfully"}
