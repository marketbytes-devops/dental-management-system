# router.py - lab technician and doctor lab endpoints
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from dependencies import get_current_user
from modules.lab.models import LabOrderModel, LabNotificationModel, InventoryItemModel, RestockRequestModel
from modules.lab.schemas import (
    LabOrderCreate,
    LabOrderStatusUpdate,
    LabOrderEdit,
    LabOrderResponse,
    LabNotificationResponse,
    InventoryItemCreate,
    InventoryItemUpdate,
    InventoryItemResponse,
    RestockRequestCreate,
    RestockRequestStatusUpdate,
    RestockRequestResponse
)
from modules.patient.models import PatientModel, PatientNotificationModel
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
        order_category=order_data.order_category,
        order_details=order_data.order_details,
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
    if status_data.result_document_url:
        order.result_document_url = status_data.result_document_url
        
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

    # Trigger patient notification for lab updates
    if order.patient_token and status_data.status in ["Dispatched", "Delivered", "Ready", "Completed"]:
        status_map = {
            "Dispatched": "dispatched",
            "Delivered": "delivered",
            "Ready": "ready for fitting",
            "Completed": "completed"
        }
        status_lbl = status_map.get(status_data.status, status_data.status.lower())
        patient_notif = PatientNotificationModel(
            patient_token=order.patient_token,
            sender_role="lab tech",
            type="lab_delivery",
            title="Dental Prosthetic Update",
            message=f"Your custom dental prosthetic ({order.prosthetic_type}) is {status_lbl}.",
            read=False
        )
        db.add(patient_notif)
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

    if edit_data.order_category is not None:
        order.order_category = edit_data.order_category
    if edit_data.order_details is not None:
        order.order_details = edit_data.order_details
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

# ---------------------------------------------------------
# Inventory & Restock Endpoints
# ---------------------------------------------------------

@router.get("/inventory", response_model=List[InventoryItemResponse])
def get_inventory(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    items = db.query(InventoryItemModel).order_by(InventoryItemModel.name.asc()).all()
    return items

@router.post("/inventory", response_model=InventoryItemResponse)
def create_inventory_item(
    item_data: InventoryItemCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    new_item = InventoryItemModel(
        name=item_data.name,
        category=item_data.category,
        current_stock=item_data.current_stock,
        minimum_stock_alert=item_data.minimum_stock_alert,
        unit=item_data.unit,
        unit_price=item_data.unit_price
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item

@router.put("/inventory/{item_id}", response_model=InventoryItemResponse)
def update_inventory_item(
    item_id: int,
    item_data: InventoryItemUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    item = db.query(InventoryItemModel).filter(InventoryItemModel.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    if item_data.name is not None: item.name = item_data.name
    if item_data.category is not None: item.category = item_data.category
    if item_data.current_stock is not None: item.current_stock = item_data.current_stock
    if item_data.minimum_stock_alert is not None: item.minimum_stock_alert = item_data.minimum_stock_alert
    if item_data.unit is not None: item.unit = item_data.unit
    if item_data.unit_price is not None: item.unit_price = item_data.unit_price

    db.commit()
    db.refresh(item)
    return item

@router.get("/restock-requests", response_model=List[RestockRequestResponse])
def get_restock_requests(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    requests = db.query(RestockRequestModel).order_by(RestockRequestModel.created_at.desc()).all()
    return requests

@router.post("/restock-requests", response_model=RestockRequestResponse)
def create_restock_request(
    request_data: RestockRequestCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    new_request = RestockRequestModel(
        item_id=request_data.item_id,
        item_name=request_data.item_name,
        requested_quantity=request_data.requested_quantity,
        notes=request_data.notes,
        status="Pending"
    )
    db.add(new_request)
    db.commit()
    db.refresh(new_request)

    # Notify admin
    notif = LabNotificationModel(
        recipient_role="admin",
        type="inventory",
        title="Restock Requested",
        desc=f"Lab Tech requested {request_data.requested_quantity} of {request_data.item_name}.",
        read=False
    )
    db.add(notif)
    db.commit()

    return new_request

@router.put("/restock-requests/{req_id}/status", response_model=RestockRequestResponse)
def update_restock_request_status(
    req_id: int,
    status_data: RestockRequestStatusUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    req = db.query(RestockRequestModel).filter(RestockRequestModel.id == req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    req.status = status_data.status
    
    # If fulfilled, update inventory stock automatically
    if req.status == "Fulfilled":
        if req.item_id:
            item = db.query(InventoryItemModel).filter(InventoryItemModel.id == req.item_id).first()
            if item:
                item.current_stock += req.requested_quantity
        else:
            # Create a new inventory item
            new_item = InventoryItemModel(
                name=req.item_name,
                category="Material",
                current_stock=req.requested_quantity,
                minimum_stock_alert=10,
                unit="pcs",
                unit_price=0.0
            )
            db.add(new_item)
            db.flush()
            req.item_id = new_item.id
            
    db.commit()
    db.refresh(req)

    # Notify lab tech
    notif = LabNotificationModel(
        recipient_role="lab tech",
        type="inventory",
        title=f"Restock Request {req.status}",
        desc=f"Your restock request for {req.item_name} is marked as {req.status}.",
        read=False
    )
    db.add(notif)
    db.commit()

    return req
