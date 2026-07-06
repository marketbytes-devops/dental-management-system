# router.py - lab technician and doctor lab endpoints
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from dependencies import get_current_user
from modules.lab.models import (
    LabOrderModel, 
    LabNotificationModel, 
    LabVendorModel, 
    LabOrderCommentModel, 
    LabAuditTrailModel
)
from modules.lab.schemas import (
    LabOrderCreate,
    LabOrderStatusUpdate,
    LabOrderEdit,
    LabOrderResponse,
    LabNotificationResponse,
    LabVendorCreate,
    LabVendorResponse,
    LabOrderCommentResponse,
    LabAuditTrailResponse
)
from modules.patient.models import PatientModel, PatientNotificationModel
from modules.doctor.models import DoctorModel
from modules.auth.models import UserModel
import random
import os
import shutil
from datetime import datetime

router = APIRouter(
    prefix="/lab",
    tags=["lab"]
)

# -------------------------------------------------------------
# File Upload Endpoint (Local Storage)
# -------------------------------------------------------------
@router.post("/upload")
def upload_lab_file(file: UploadFile = File(...)):
    # Ensure static/uploads exists
    upload_dir = os.path.join("static", "uploads")
    os.makedirs(upload_dir, exist_ok=True)
    
    file_path = os.path.join(upload_dir, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    return {"name": file.filename, "url": f"/static/uploads/{file.filename}"}

# -------------------------------------------------------------
# Lab Orders Endpoints
# -------------------------------------------------------------
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
        rejection_reason=None,
        
        # Extended fields
        treatment_plan_step_id=order_data.treatment_plan_step_id,
        tooth_quadrant=order_data.tooth_quadrant,
        procedure_code=order_data.procedure_code,
        margin_design=order_data.margin_design,
        impression_type=order_data.impression_type or "Physical",
        attachments=order_data.attachments,
        vendor_id=order_data.vendor_id,
        courier_name=order_data.courier_name,
        tracking_number=order_data.tracking_number,
        dispatch_date=order_data.dispatch_date,
        expected_return_date=order_data.expected_return_date,
        external_cost=order_data.external_cost or 0,
        parent_order_id=order_data.parent_order_id,
        rejection_category=order_data.rejection_category,
        stage=order_data.stage or "New Cases"
    )

    db.add(new_order)
    db.commit()
    db.refresh(new_order)

    # Create audit trail entry
    audit = LabAuditTrailModel(
        order_id=case_id,
        user_name=dentist_name,
        action="Created",
        note=f"Lab order submitted for {patient_name}."
    )
    db.add(audit)
    
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

    old_status = order.status
    order.status = status_data.status
    if status_data.status == "Rejected":
        order.rejection_reason = status_data.rejection_reason
        order.rejection_category = status_data.rejection_category
        order.stage = "New Cases"
    else:
        order.rejection_reason = None
        order.rejection_category = None
        
        # Align stage when status changes
        if status_data.status == "Accepted":
            order.stage = "Design Complete"
        elif status_data.status == "In Progress":
            order.stage = "Milling"
        elif status_data.status == "QC Pending":
            order.stage = "QC"
        
    db.commit()
    db.refresh(order)

    user_name = current_user.get("name") or "System User"
    
    # Audit trail
    audit = LabAuditTrailModel(
        order_id=order_id,
        user_name=user_name,
        action=f"Status changed to: {status_data.status}",
        note=f"From {old_status}. Reason: {status_data.rejection_reason}" if status_data.status == "Rejected" else f"From {old_status}."
    )
    db.add(audit)

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

    changes = []
    
    if edit_data.prosthetic_type is not None:
        order.prosthetic_type = edit_data.prosthetic_type
        changes.append("prosthetic type")
    if edit_data.material is not None:
        order.material = edit_data.material
        changes.append("material")
    if edit_data.shade is not None:
        order.shade = edit_data.shade
        changes.append("shade")
    if edit_data.priority is not None:
        order.priority = edit_data.priority
        changes.append("priority")
    if edit_data.due_date is not None:
        order.due_date = edit_data.due_date
        changes.append("due date")
    if edit_data.notes is not None:
        order.notes = edit_data.notes
        changes.append("notes")
    if edit_data.lab_name is not None:
        order.lab_name = edit_data.lab_name
        changes.append("lab name")
    if edit_data.status is not None:
        order.status = edit_data.status
        changes.append("status")
        
    # Extended fields
    if edit_data.treatment_plan_step_id is not None:
        order.treatment_plan_step_id = edit_data.treatment_plan_step_id
    if edit_data.tooth_quadrant is not None:
        order.tooth_quadrant = edit_data.tooth_quadrant
        changes.append("tooth #")
    if edit_data.procedure_code is not None:
        order.procedure_code = edit_data.procedure_code
    if edit_data.margin_design is not None:
        order.margin_design = edit_data.margin_design
        changes.append("margin design")
    if edit_data.impression_type is not None:
        order.impression_type = edit_data.impression_type
        changes.append("impression type")
    if edit_data.attachments is not None:
        order.attachments = edit_data.attachments
        changes.append("attachments")
    if edit_data.vendor_id is not None:
        order.vendor_id = edit_data.vendor_id
        changes.append("vendor selection")
    if edit_data.courier_name is not None:
        order.courier_name = edit_data.courier_name
        changes.append("courier partner")
    if edit_data.tracking_number is not None:
        order.tracking_number = edit_data.tracking_number
        changes.append("tracking number")
    if edit_data.dispatch_date is not None:
        order.dispatch_date = edit_data.dispatch_date
    if edit_data.expected_return_date is not None:
        order.expected_return_date = edit_data.expected_return_date
    if edit_data.external_cost is not None:
        order.external_cost = edit_data.external_cost
    if edit_data.stage is not None:
        order.stage = edit_data.stage
        changes.append("stage")

    db.commit()
    db.refresh(order)

    # Log audit entry
    user_name = current_user.get("name") or "User"
    if changes:
        db.add(LabAuditTrailModel(
            order_id=order_id,
            user_name=user_name,
            action="Order Edited",
            note=f"Modified fields: {', '.join(changes)}"
        ))
        db.commit()

    return order

# -------------------------------------------------------------
# Rework Handling Endpoint
# -------------------------------------------------------------
@router.post("/orders/{order_id}/rework", response_model=LabOrderResponse)
def create_lab_rework_order(
    order_id: str,
    status_data: LabOrderStatusUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    original_order = db.query(LabOrderModel).filter(LabOrderModel.id == order_id).first()
    if not original_order:
        raise HTTPException(status_code=404, detail="Original lab order not found")

    # Mark original order as Reworked
    original_order.status = "Reworked"
    original_order.rejection_reason = status_data.rejection_reason
    original_order.rejection_category = status_data.rejection_category
    
    # Count reworks for this parent to format R1, R2, etc.
    rework_count = db.query(LabOrderModel).filter(LabOrderModel.parent_order_id == order_id).count()
    new_id = f"{order_id}-R{rework_count + 1}"
    
    # Clone and create new subcase
    new_order = LabOrderModel(
        id=new_id,
        patient_token=original_order.patient_token,
        patient_name=original_order.patient_name,
        dentist_name=original_order.dentist_name,
        dentist_contact=original_order.dentist_contact,
        prosthetic_type=original_order.prosthetic_type,
        material=original_order.material,
        shade=original_order.shade,
        priority=original_order.priority,
        status="Pending",
        notes=f"REWORK: {status_data.rejection_reason or ''}. Original Notes: {original_order.notes or ''}",
        due_date=original_order.due_date,
        lab_name=original_order.lab_name,
        treatment_plan_step_id=original_order.treatment_plan_step_id,
        tooth_quadrant=original_order.tooth_quadrant,
        procedure_code=original_order.procedure_code,
        margin_design=original_order.margin_design,
        impression_type=original_order.impression_type,
        attachments=original_order.attachments,
        parent_order_id=order_id,
        rejection_category=status_data.rejection_category
    )
    
    db.add(new_order)
    db.commit()
    db.refresh(new_order)
    
    # Audit trail for parent
    user_name = current_user.get("name") or "Doctor"
    db.add(LabAuditTrailModel(
        order_id=order_id,
        user_name=user_name,
        action="Rework Initiated",
        note=f"Category: {status_data.rejection_category}. Reason: {status_data.rejection_reason}"
    ))
    
    # Audit trail for child
    db.add(LabAuditTrailModel(
        order_id=new_id,
        user_name=user_name,
        action="Created as Rework",
        note=f"Linked to parent case: {order_id}"
    ))
    
    # Notification for Lab Tech
    db.add(LabNotificationModel(
        recipient_role="lab tech",
        type="Orders",
        title="Rework Order Submitted",
        desc=f"Rework case {new_id} submitted for {original_order.patient_name}. Reason: {status_data.rejection_reason}",
        read=False
    ))
    
    db.commit()
    return new_order

# -------------------------------------------------------------
# Comments Endpoints
# -------------------------------------------------------------
@router.get("/orders/{order_id}/comments", response_model=List[LabOrderCommentResponse])
def get_lab_comments(order_id: str, db: Session = Depends(get_db)):
    comments = db.query(LabOrderCommentModel).filter(LabOrderCommentModel.order_id == order_id).order_by(LabOrderCommentModel.created_at.asc()).all()
    return comments

@router.post("/orders/{order_id}/comments", response_model=LabOrderCommentResponse)
def post_lab_comment(
    order_id: str,
    comment_data: LabOrderCommentCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_name = current_user.get("name") or "User"
    user_roles = current_user.get("roles") or []
    user_role = "doctor" if any(r.lower() == "doctor" for r in user_roles) else "lab tech"
    
    new_comment = LabOrderCommentModel(
        order_id=order_id,
        user_name=user_name,
        user_role=user_role,
        message=comment_data.message
    )
    
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    return new_comment

# -------------------------------------------------------------
# Audit Trail Endpoint
# -------------------------------------------------------------
@router.get("/orders/{order_id}/audit", response_model=List[LabAuditTrailResponse])
def get_lab_audit_trail(order_id: str, db: Session = Depends(get_db)):
    logs = db.query(LabAuditTrailModel).filter(LabAuditTrailModel.order_id == order_id).order_by(LabAuditTrailModel.created_at.asc()).all()
    return logs

# -------------------------------------------------------------
# Lab Vendors Directory Endpoints
# -------------------------------------------------------------
@router.get("/vendors", response_model=List[LabVendorResponse])
def get_lab_vendors(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    vendors = db.query(LabVendorModel).all()
    return vendors

@router.post("/vendors", response_model=LabVendorResponse)
def create_lab_vendor(
    vendor_data: LabVendorCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    new_vendor = LabVendorModel(
        name=vendor_data.name,
        contact_person=vendor_data.contact_person,
        phone=vendor_data.phone,
        email=vendor_data.email,
        average_tat_days=vendor_data.average_tat_days,
        pricing_list=vendor_data.pricing_list,
        rating=5.0
    )
    db.add(new_vendor)
    db.commit()
    db.refresh(new_vendor)
    return new_vendor

@router.put("/vendors/{vendor_id}", response_model=LabVendorResponse)
def update_lab_vendor(
    vendor_id: int,
    vendor_data: LabVendorCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    vendor = db.query(LabVendorModel).filter(LabVendorModel.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
        
    vendor.name = vendor_data.name
    vendor.contact_person = vendor_data.contact_person
    vendor.phone = vendor_data.phone
    vendor.email = vendor_data.email
    vendor.average_tat_days = vendor_data.average_tat_days
    vendor.pricing_list = vendor_data.pricing_list
    
    db.commit()
    db.refresh(vendor)
    return vendor

@router.delete("/vendors/{vendor_id}")
def delete_lab_vendor(vendor_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    vendor = db.query(LabVendorModel).filter(LabVendorModel.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    db.delete(vendor)
    db.commit()
    return {"detail": "Vendor deleted successfully"}

# -------------------------------------------------------------
# Notifications Hub Endpoints
# -------------------------------------------------------------
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
