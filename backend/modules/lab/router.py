# router.py - lab technician and doctor lab endpoints
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from database import get_db
from dependencies import get_current_user, get_optional_current_user
from modules.lab.models import (
    LabOrderModel, 
    LabNotificationModel, 
    LabVendorModel, 
    LabOrderCommentModel, 
    LabAuditTrailModel,
    InventoryItemModel,
    RestockRequestModel,
    ClinicalEncounterModel,
    ProstheticCaseDetailModel,
    PathologyCaseDetailModel
)
from modules.lab.schemas import (
    LabOrderCreate,
    LabOrderStatusUpdate,
    LabOrderEdit,
    LabOrderResponse,
    LabNotificationResponse,
    LabVendorCreate,
    LabVendorResponse,
    LabOrderCommentCreate,
    LabOrderCommentResponse,
    LabAuditTrailResponse,
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
import os
import shutil
from datetime import datetime
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders

def send_smtp_email(to_email: str, subject: str, body_text: str, attachment_files: list = None) -> bool:
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = os.getenv("SMTP_PORT")
    smtp_user = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_PASSWORD")
    smtp_from = os.getenv("SMTP_FROM", smtp_user)
    
    if not all([smtp_host, smtp_port, smtp_user, smtp_password]):
        print(f"[SMTP WARNING] SMTP configuration variables are missing in .env. Real email skipped. To: {to_email}", flush=True)
        return False
        
    try:
        msg = MIMEMultipart('mixed')
        msg['From'] = smtp_from
        msg['To'] = to_email
        msg['Subject'] = subject
        
        msg.attach(MIMEText(body_text, 'plain', 'utf-8'))
        
        if attachment_files:
            for file_path in attachment_files:
                if os.path.exists(file_path):
                    filename = os.path.basename(file_path)
                    try:
                        with open(file_path, "rb") as attachment:
                            part = MIMEBase("application", "octet-stream")
                            part.set_payload(attachment.read())
                            encoders.encode_base64(part)
                            part.add_header("Content-Disposition", "attachment", filename=filename)
                            msg.attach(part)
                            print(f"[SMTP ATTACHMENT] Attached file: {file_path}", flush=True)
                    except Exception as att_err:
                        print(f"[SMTP ATTACHMENT ERROR] Failed to attach {file_path}: {att_err}", flush=True)
                else:
                    print(f"[SMTP ATTACHMENT WARNING] File not found at path: {file_path}", flush=True)

        server = smtplib.SMTP(smtp_host, int(smtp_port))
        server.starttls()
        server.login(smtp_user, smtp_password)
        server.sendmail(smtp_from, to_email, msg.as_string())
        server.quit()
        print(f"[SMTP SUCCESS] Real email dispatched successfully to {to_email}", flush=True)
        return True
    except Exception as e:
        print(f"[SMTP ERROR] Failed to dispatch real email to {to_email}: {e}", flush=True)
        return False

def serialize_order(order: LabOrderModel):
    if not order:
        return order
    # Dynamically attach fields from detail records for easy serialization
    order.tooth_number = None
    order.fabrication_type = None
    order.scan_file = None
    order.opposing_bite_scan = None
    order.implant_system = None
    order.test_type = None
    order.sample_type = None
    order.reason_for_test = None
    order.external_lab_name = None
    order.sample_collected_confirm = None

    if order.order_category == "Prosthetic":
        detail = order.prosthetic_detail
        if detail:
            order.tooth_number = detail.tooth_number
            order.fabrication_type = detail.fabrication_type
            order.scan_file = detail.scan_file
            order.material = detail.material
            order.shade = detail.shade
            order.opposing_bite_scan = detail.opposing_bite_scan
            order.implant_system = detail.implant_system
    else: # Diagnostic / Pathology
        detail = order.pathology_detail
        if detail:
            order.test_type = detail.test_type
            order.sample_type = detail.sample_type
            order.reason_for_test = detail.reason_for_test
            order.external_lab_name = detail.external_lab_name
            order.sample_collected_confirm = detail.sample_collected_confirm
    return order

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

    # 3. Generate Case ID atomically (SELECT ... FOR UPDATE lock)
    last_order = db.query(LabOrderModel).with_for_update().order_by(LabOrderModel.created_at.desc()).first()
    next_num = 631
    if last_order and last_order.id and "CASE-2026-" in last_order.id:
        try:
            num = int(last_order.id.replace("CASE-2026-", ""))
            next_num = max(631, num + 1)
        except Exception:
            pass

    while True:
        case_id = f"CASE-2026-{next_num:03d}"
        if not db.query(LabOrderModel).filter(LabOrderModel.id == case_id).first():
            break
        next_num += 1

    initial_status = order_data.status or "Pending Review"
    if order_data.order_category in ["Diagnostic", "Blood Work", "Pathology", "Blood Work / Pathology"] and not order_data.status:
        initial_status = "Ordered"

    new_order = LabOrderModel(
        id=case_id,
        patient_token=order_data.patient_token,
        patient_name=patient_name,
        dentist_name=dentist_name,
        dentist_contact=dentist_contact,
        order_category=order_data.order_category,
        order_details=order_data.order_details,
        prosthetic_type=order_data.prosthetic_type or order_data.fabrication_type,
        material=order_data.material,
        shade=order_data.shade,
        priority=order_data.priority,
        status=initial_status,
        notes=order_data.notes,
        rejection_reason=None,
        
        # Extended fields
        treatment_plan_step_id=order_data.treatment_plan_step_id,
        tooth_quadrant=order_data.tooth_quadrant or order_data.tooth_number,
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
        is_rework=order_data.is_rework or False,
        original_case_id=order_data.original_case_id,
        stage=order_data.stage or "New Cases",
        tech_notes=order_data.tech_notes,
        email_sent_at=order_data.email_sent_at,
        rework_history=[],
        physical_mold_sent=(order_data.impression_type == "Physical" or bool(order_data.notes and "physical" in order_data.notes.lower())),
        physical_opposing_mold_sent=bool(order_data.opposing_bite_scan or (order_data.notes and "opposing" in order_data.notes.lower()))
    )

    db.add(new_order)

    # Automatically create pending Receptionist Billing Request so Receptionist can collect payment beforehand
    try:
        from modules.billing.models import BillingRequestModel
        clinic_price = 3500.0
        if order_data.order_category == "Prosthetic":
            price_record = db.query(LabItemPriceModel).filter(LabItemPriceModel.item_name.ilike(f"%{order_data.prosthetic_type or 'Crown'}%")).first()
            if price_record and price_record.patient_price:
                clinic_price = price_record.patient_price

        billing_req = BillingRequestModel(
            patient_token=order_data.patient_token,
            doctor_name=dentist_name,
            total_amount=clinic_price,
            status="Pending",
            source_type="lab",
            procedures=[{
                "name": f"Lab Prescription ({order_data.prosthetic_type or order_data.order_category})",
                "cost": clinic_price,
                "tooth": order_data.tooth_number or order_data.tooth_quadrant or "Full Arch"
            }],
            notes=f"Prescription charges for Lab Case {case_id}"
        )
        db.add(billing_req)
    except Exception as b_err:
        print(f"[RECEPTIONIST BILLING INTEGRATION] Warning: {b_err}", flush=True)

    db.commit()
    db.refresh(new_order)

    # 3. Create category-specific details
    if order_data.order_category in ["Diagnostic", "Blood Work", "Pathology", "Blood Work / Pathology"]:
        pathology_detail = PathologyCaseDetailModel(
            lab_case_id=case_id,
            test_type=order_data.test_type,
            sample_type=order_data.sample_type,
            reason_for_test=order_data.reason_for_test,
            external_lab_name=order_data.external_lab_name or order_data.lab_name,
            sample_collected_confirm=order_data.sample_collected_confirm or False
        )
        db.add(pathology_detail)
    else:
        prosthetic_detail = ProstheticCaseDetailModel(
            lab_case_id=case_id,
            tooth_number=order_data.tooth_number or order_data.tooth_quadrant,
            fabrication_type=order_data.fabrication_type or order_data.prosthetic_type,
            scan_file=order_data.scan_file,
            material=order_data.material,
            shade=order_data.shade,
            opposing_bite_scan=order_data.opposing_bite_scan,
            implant_system=order_data.implant_system
        )
        db.add(prosthetic_detail)

    # Create clinical encounter
    encounter = ClinicalEncounterModel(
        patient_token=order_data.patient_token,
        doctor_name=dentist_name,
        notes=f"Clinical session: Lab case {case_id} generated for {patient_name}.",
        lab_case_id=case_id
    )
    db.add(encounter)
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
    if initial_status == "Pending Review":
        notif = LabNotificationModel(
            recipient_role="lab tech",
            type="Orders",
            title="New Lab Order Submitted for Review",
            desc=f"Case {case_id} has been submitted for review by Dr. {dentist_name} for patient {patient_name}.",
            read=False
        )
        db.add(notif)
        db.commit()

    return serialize_order(new_order)

@router.get("/orders", response_model=List[LabOrderResponse])
def get_lab_orders(
    db: Session = Depends(get_db),
    current_user: Optional[dict] = Depends(get_optional_current_user)
):
    orders = (
        db.query(LabOrderModel)
        .options(
            joinedload(LabOrderModel.prosthetic_detail),
            joinedload(LabOrderModel.pathology_detail)
        )
        .order_by(LabOrderModel.created_at.desc())
        .all()
    )
    return [serialize_order(o) for o in orders]

# -------------------------------------------------------------
# Receptionist: Lab Orders Ready for Pickup / Patient Notification
# -------------------------------------------------------------
@router.get("/orders/receptionist")
def get_receptionist_lab_orders(db: Session = Depends(get_db)):
    """
    Returns all lab orders enriched with patient phone numbers,
    so the receptionist can contact patients when their orders arrive.
    Includes all statuses so receptionist can track the full pipeline.
    """
    orders = (
        db.query(LabOrderModel)
        .options(
            joinedload(LabOrderModel.prosthetic_detail),
            joinedload(LabOrderModel.pathology_detail)
        )
        .order_by(LabOrderModel.created_at.desc())
        .all()
    )
    result = []
    for order in orders:
        # Fetch patient details to get phone number
        patient = db.query(PatientModel).filter(PatientModel.token == order.patient_token).first()
        patient_phone = patient.phone if patient else None
        patient_email = patient.email if patient else None

        # Determine order type description
        order_type = order.prosthetic_type or order.order_category or "Lab Order"
        if order.prosthetic_detail and order.prosthetic_detail.fabrication_type:
            order_type = order.prosthetic_detail.fabrication_type
        elif order.pathology_detail and order.pathology_detail.test_type:
            order_type = order.pathology_detail.test_type

        result.append({
            "id": order.id,
            "patient_token": order.patient_token,
            "patient_name": order.patient_name or "Unknown Patient",
            "patient_phone": patient_phone or "",
            "patient_email": patient_email or "",
            "order_category": order.order_category or "Lab Order",
            "order_type": order_type,
            "dentist_name": order.dentist_name or "",
            "status": order.status,
            "priority": order.priority or "Medium",
            "notes": order.notes or "",
            "tech_notes": order.tech_notes or "",
            "created_at": order.created_at.isoformat() if order.created_at else None,
            "expected_return_date": order.expected_return_date or "",
            # Patient notification tracking
            "patient_notified_at": getattr(order, "patient_notified_at", None),
            "patient_notified_note": getattr(order, "patient_notified_note", None),
        })
    return result

@router.put("/orders/{order_id}/notify")
def notify_patient_for_lab_order(
    order_id: str,
    payload: dict,
    db: Session = Depends(get_db)
):
    """
    Logs that the receptionist has contacted the patient about their lab order.
    Stores timestamp and a brief note about the contact.
    """
    order = db.query(LabOrderModel).filter(LabOrderModel.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Lab order not found")

    contact_note = payload.get("note", "Patient contacted by receptionist.")
    contacted_at = datetime.utcnow().isoformat()

    # Store notification info in tech_notes (reusing existing field)
    existing_tech_notes = order.tech_notes or ""
    notification_entry = f"\n[PATIENT NOTIFIED {contacted_at[:10]}]: {contact_note}"
    order.tech_notes = existing_tech_notes + notification_entry

    # Add audit trail
    audit = LabAuditTrailModel(
        order_id=order_id,
        user_name="Receptionist",
        action="Patient Notified",
        note=contact_note
    )
    db.add(audit)
    db.commit()

    return {
        "success": True,
        "order_id": order_id,
        "notified_at": contacted_at,
        "note": contact_note
    }


@router.get("/orders/{order_id}", response_model=LabOrderResponse)
def get_lab_order(
    order_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    order = db.query(LabOrderModel).filter(LabOrderModel.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Lab order not found")
    return serialize_order(order)

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
    new_status = status_data.status
    order.status = new_status  # type: ignore

    if status_data.result_document_url:
        order.result_document_url = status_data.result_document_url  # type: ignore

    if status_data.vendor_id is not None:
        order.vendor_id = status_data.vendor_id
    if status_data.lab_name is not None:
        order.lab_name = status_data.lab_name
    if status_data.tech_notes is not None:
        order.tech_notes = status_data.tech_notes

    if new_status in ["Rejected", "returned_for_rework", "Returned for Rework", "Flagged", "Revision Requested"]:
        order.rejection_reason = status_data.rejection_reason or status_data.tech_notes
    else:
        order.rejection_reason = None  # type: ignore
        
    if status_data.rejection_category:
        order.rejection_category = status_data.rejection_category  # type: ignore
    if status_data.attachments is not None:
        order.attachments = status_data.attachments  # type: ignore

    # Extract vendor email
    vendor_email = "labs@smilecare.com"
    if order.order_details and isinstance(order.order_details, dict):
        email = order.order_details.get("lab_email")
        if email:
            vendor_email = email
    
    if vendor_email == "labs@smilecare.com":
        if order.vendor_id:
            vendor = db.query(LabVendorModel).filter(LabVendorModel.id == order.vendor_id).first()
            if vendor and vendor.email:
                vendor_email = vendor.email
        elif order.lab_name:
            vendor = db.query(LabVendorModel).filter(LabVendorModel.name.ilike(f"%{order.lab_name}%")).first()
            if vendor and vendor.email:
                vendor_email = vendor.email

    # Gather attachment URLs
    attachment_urls = []
    if order.prosthetic_detail:
        if order.prosthetic_detail.scan_file:
            attachment_urls.append(order.prosthetic_detail.scan_file)
        if order.prosthetic_detail.opposing_bite_scan:
            attachment_urls.append(order.prosthetic_detail.opposing_bite_scan)

    if order.attachments:
        if isinstance(order.attachments, list):
            for att in order.attachments:
                if isinstance(att, dict) and att.get("url"):
                    attachment_urls.append(att.get("url"))
                elif isinstance(att, str):
                    attachment_urls.append(att)

    if new_status in ["returned_for_rework", "Returned for Rework"]:
        order.is_rework = True
        if not order.original_case_id:
            order.original_case_id = order_id
        
        # Simulate rework email sending
        from datetime import datetime
        order.email_sent_at = datetime.utcnow().isoformat()
        
        email_body = f"""
========================================================================
[SIMULATED EMAIL DISPATCH]
To: {vendor_email}
Subject: REWORK REQUEST: Case {order.id}
Timestamp: {order.email_sent_at}
------------------------------------------------------------------------
Dear Lab Partner,

Please perform correction/rework on Case {order.id} as per the specifications below.

Patient Name: {order.patient_name}
Ordering Dentist: {order.dentist_name}
Dentist Contact: {order.dentist_contact}

Rework Reason / Category: {order.rejection_category}
Correction details: {order.rejection_reason or 'No details provided'}

Attachments / Reference Files:
{chr(10).join('- ' + a for a in attachment_urls) if attachment_urls else 'No reference attachments uploaded.'}

Please process this correction as soon as possible.

Regards,
SmileCare Lab Management System
========================================================================
"""
        print(email_body, flush=True)
        # Collect physical attachment files
        attachment_files = []
        for url_or_name in attachment_urls:
            fname = os.path.basename(url_or_name)
            if fname:
                path = os.path.join("static", "uploads", fname)
                if os.path.exists(path):
                    attachment_files.append(path)

        send_smtp_email(vendor_email, f"REWORK REQUEST: Case {order.id}", email_body, attachment_files)

    # Handle workflow step 5: "On doctor approval (Sent to Lab), send email to the external lab"
    if new_status == "Sent to Lab":
        # 2. Gather measurements, doctor notes, attachments
        measurements = []
        if order.order_category == "Prosthetic":
            measurements.append(f"Quadrant/Tooth: {order.tooth_quadrant or order.prosthetic_type or 'N/A'}")
            measurements.append(f"Margin Design: {order.margin_design or 'N/A'}")
            measurements.append(f"Impression Type: {order.impression_type or 'N/A'}")
            measurements.append(f"Material: {order.material or 'N/A'}")
            measurements.append(f"Shade: {order.shade or 'N/A'}")
        else:
            measurements.append(f"Test Type: {order.test_type or 'N/A'}")
            measurements.append(f"Sample Type: {order.sample_type or 'N/A'}")
            measurements.append(f"Reason: {order.reason_for_test or 'N/A'}")

        # 3. Simulate email sending
        from datetime import datetime
        order.email_sent_at = datetime.utcnow().isoformat()
        
        email_body = f"""
========================================================================
[SIMULATED EMAIL DISPATCH]
To: {vendor_email}
Subject: New Lab Order Request: Case {order.id}
Timestamp: {order.email_sent_at}
------------------------------------------------------------------------
Dear Lab Partner,

Please fabricate the following dental case request.

Patient Name: {order.patient_name}
Ordering Dentist: {order.dentist_name}
Dentist Contact: {order.dentist_contact}

Case Details / Measurements:
- Category: {order.order_category}
{chr(10).join('- ' + m for m in measurements)}

Doctor's Notes:
"{order.notes or 'None'}"

Technician's Notes:
"{order.tech_notes or 'None'}"

Attachments:
{chr(10).join('- ' + a for a in attachment_urls) if attachment_urls else 'No attachments uploaded.'}

Please confirm receipt and expected completion date.

Regards,
SmileCare Lab Management System
========================================================================
"""
        # Collect physical attachment files
        attachment_files = []
        for url_or_name in attachment_urls:
            fname = os.path.basename(url_or_name)
            if fname:
                path = os.path.join("static", "uploads", fname)
                if os.path.exists(path):
                    attachment_files.append(path)

        send_smtp_email(vendor_email, f"New Lab Order Request: Case {order.id}", email_body, attachment_files)

    db.commit()
    db.refresh(order)

    user_name = current_user.get("name") or "System User"
    
    # Audit trail
    audit = LabAuditTrailModel(
        order_id=order_id,
        user_name=user_name,
        action=f"Status changed to: {new_status}",
        note=f"From {old_status}."
    )
    db.add(audit)

    # Generate notification (Doctor receives notifications ONLY for Flagged/Revision/Sent Back/Rejected)
    if new_status in ["Flagged", "flagged", "Sent Back"]:
        notif = LabNotificationModel(
            recipient_role="doctor",
            type="labs",
            title=f"Lab Case {order_id} Flagged by Lab Tech",
            desc=f"Lab Technician flagged Case {order_id} for patient {order.patient_name or 'Walk-in Patient'} (Token: {order.patient_token}). Reason/Missing: {status_data.rejection_reason or status_data.tech_notes or 'Missing required case parameters.'}",
            read=False
        )
        db.add(notif)
    elif new_status in ["Revision Requested", "Revision"]:
        notif = LabNotificationModel(
            recipient_role="doctor",
            type="labs",
            title="Revision Requested for Lab Case",
            desc=f"Tech has requested a revision on Case {order_id} for patient {order.patient_name or 'Walk-in Patient'} (Token: {order.patient_token}). Tech Notes: {status_data.tech_notes or order.rejection_reason or 'Revision requested.'}",
            read=False
        )
        db.add(notif)
    elif new_status in ["Rejected", "rejected"]:
        notif = LabNotificationModel(
            recipient_role="doctor",
            type="labs",
            title=f"Lab Case {order_id} Rejected by Lab Tech",
            desc=f"Lab Technician rejected Case {order_id} for patient {order.patient_name or 'Walk-in Patient'} (Token: {order.patient_token}). Reason: {status_data.rejection_reason or status_data.tech_notes or 'Order rejected.'}",
            read=False
        )
        db.add(notif)
    elif new_status in ["Confirmed", "Doctor Accepted"]:
        notif = LabNotificationModel(
            recipient_role="lab tech",
            type="Orders",
            title="Lab Order Confirmed by Doctor",
            desc=f"Case {order_id} has been reviewed and confirmed by {user_name}.",
            read=False
        )
        db.add(notif)
    elif new_status == "Pending Review":
        notif = LabNotificationModel(
            recipient_role="lab tech",
            type="Orders",
            title="Lab Order Submitted for Review",
            desc=f"Case {order_id} has been submitted for review by Dr. {user_name}.",
            read=False
        )
        db.add(notif)
    db.commit()

    return serialize_order(order)

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

    # Lock direct edits once Sent to Lab or later
    if order.status not in ["Draft", "draft", "Revision Requested", "revision_requested", "Submitted", "submitted", "Confirmed", "confirmed", "Doctor Accepted", "doctor_accepted", "Ordered", "ordered", "Flagged", "flagged", "Pending", "Pending Review", "Pending Doctor Review", "Pending Doctor Confirmation", "Confirmed by Tech", "Returned for Rework", "returned_for_rework"]:
        raise HTTPException(
            status_code=403,
            detail="Direct edits are locked once order is Sent to Lab or later. Please use Return for Correction."
        )

    changes = []

    if edit_data.order_category is not None:
        order.order_category = edit_data.order_category  # type: ignore
        changes.append("order_category")
    if edit_data.order_details is not None:
        order.order_details = edit_data.order_details  # type: ignore
        changes.append("order_details")
    if edit_data.prosthetic_type is not None:
        order.prosthetic_type = edit_data.prosthetic_type  # type: ignore
        changes.append("prosthetic_type")
    if edit_data.material is not None:
        order.material = edit_data.material  # type: ignore
        changes.append("material")
    if edit_data.shade is not None:
        order.shade = edit_data.shade  # type: ignore
        changes.append("shade")
    if edit_data.priority is not None:
        order.priority = edit_data.priority  # type: ignore
        changes.append("priority")
    if edit_data.notes is not None:
        order.notes = edit_data.notes  # type: ignore
        changes.append("notes")
    if edit_data.lab_name is not None:
        order.lab_name = edit_data.lab_name  # type: ignore
        changes.append("lab_name")
    if edit_data.status is not None:
        order.status = edit_data.status  # type: ignore
        changes.append("status")
    if edit_data.treatment_plan_step_id is not None:
        order.treatment_plan_step_id = edit_data.treatment_plan_step_id  # type: ignore
        changes.append("treatment_plan_step_id")
    if edit_data.tooth_quadrant is not None:
        order.tooth_quadrant = edit_data.tooth_quadrant  # type: ignore
        changes.append("tooth_quadrant")
    if edit_data.procedure_code is not None:
        order.procedure_code = edit_data.procedure_code  # type: ignore
        changes.append("procedure_code")
    if edit_data.margin_design is not None:
        order.margin_design = edit_data.margin_design  # type: ignore
        changes.append("margin_design")
    if edit_data.impression_type is not None:
        order.impression_type = edit_data.impression_type  # type: ignore
        changes.append("impression_type")
    if edit_data.attachments is not None:
        order.attachments = edit_data.attachments  # type: ignore
        changes.append("attachments")
    if edit_data.vendor_id is not None:
        order.vendor_id = edit_data.vendor_id  # type: ignore
        changes.append("vendor_id")
    if edit_data.courier_name is not None:
        order.courier_name = edit_data.courier_name  # type: ignore
        changes.append("courier_name")
    if edit_data.tracking_number is not None:
        order.tracking_number = edit_data.tracking_number  # type: ignore
        changes.append("tracking_number")
    if edit_data.dispatch_date is not None:
        order.dispatch_date = edit_data.dispatch_date  # type: ignore
        changes.append("dispatch_date")
    if edit_data.expected_return_date is not None:
        order.expected_return_date = edit_data.expected_return_date  # type: ignore
        changes.append("expected_return_date")
    if edit_data.external_cost is not None:
        order.external_cost = edit_data.external_cost  # type: ignore
        changes.append("external_cost")
    if edit_data.parent_order_id is not None:
        order.parent_order_id = edit_data.parent_order_id  # type: ignore
        changes.append("parent_order_id")
    if edit_data.is_rework is not None:
        order.is_rework = edit_data.is_rework  # type: ignore
        changes.append("is_rework")
    if edit_data.original_case_id is not None:
        order.original_case_id = edit_data.original_case_id  # type: ignore
        changes.append("original_case_id")
    if edit_data.rejection_category is not None:
        order.rejection_category = edit_data.rejection_category  # type: ignore
        changes.append("rejection_category")
    if edit_data.rejection_reason is not None:
        order.rejection_reason = edit_data.rejection_reason  # type: ignore
        changes.append("rejection_reason")
    if edit_data.stage is not None:
        order.stage = edit_data.stage  # type: ignore
        changes.append("stage")

    db.commit()

    # Update category-specific detail models
    if order.order_category in ["Diagnostic", "Blood Work", "Pathology", "Blood Work / Pathology"]:
        detail = order.pathology_detail
        if not detail:
            detail = PathologyCaseDetailModel(lab_case_id=order_id)
            db.add(detail)
        
        if edit_data.test_type is not None:
            detail.test_type = edit_data.test_type
        if edit_data.sample_type is not None:
            detail.sample_type = edit_data.sample_type
        if edit_data.reason_for_test is not None:
            detail.reason_for_test = edit_data.reason_for_test
        if edit_data.external_lab_name is not None:
            detail.external_lab_name = edit_data.external_lab_name
        elif edit_data.lab_name is not None:
            detail.external_lab_name = edit_data.lab_name
        if edit_data.sample_collected_confirm is not None:
            detail.sample_collected_confirm = edit_data.sample_collected_confirm
    else:
        detail = order.prosthetic_detail
        if not detail:
            detail = ProstheticCaseDetailModel(lab_case_id=order_id)
            db.add(detail)

        if edit_data.tooth_number is not None:
            detail.tooth_number = edit_data.tooth_number
        elif edit_data.tooth_quadrant is not None:
            detail.tooth_number = edit_data.tooth_quadrant
        
        if edit_data.fabrication_type is not None:
            detail.fabrication_type = edit_data.fabrication_type
        elif edit_data.prosthetic_type is not None:
            detail.fabrication_type = edit_data.prosthetic_type

        if edit_data.scan_file is not None:
            detail.scan_file = edit_data.scan_file
        if edit_data.material is not None:
            detail.material = edit_data.material
        if edit_data.shade is not None:
            detail.shade = edit_data.shade
        if edit_data.opposing_bite_scan is not None:
            detail.opposing_bite_scan = edit_data.opposing_bite_scan
        if edit_data.implant_system is not None:
            detail.implant_system = edit_data.implant_system

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

    if "status" in changes and order.status == "Pending Review":
        db.add(LabNotificationModel(
            recipient_role="lab tech",
            type="Orders",
            title="Lab Order Submitted for Review",
            desc=f"Case {order_id} has been submitted for review by Dr. {user_name}.",
            read=False
        ))
        db.commit()

    if "status" in changes and order.status == "Sent to Lab":
        # Extract vendor email
        vendor_email = "labs@smilecare.com"
        if order.order_details and isinstance(order.order_details, dict):
            email = order.order_details.get("lab_email")
            if email:
                vendor_email = email
        
        if vendor_email == "labs@smilecare.com":
            if order.vendor_id:
                vendor = db.query(LabVendorModel).filter(LabVendorModel.id == order.vendor_id).first()
                if vendor and vendor.email:
                    vendor_email = vendor.email
            elif order.lab_name:
                vendor = db.query(LabVendorModel).filter(LabVendorModel.name.ilike(f"%{order.lab_name}%")).first()
                if vendor and vendor.email:
                    vendor_email = vendor.email

        # Gather measurements
        measurements = []
        if order.order_category == "Prosthetic":
            measurements.append(f"Quadrant/Tooth: {order.tooth_quadrant or order.prosthetic_type or 'N/A'}")
            measurements.append(f"Margin Design: {order.margin_design or 'N/A'}")
            measurements.append(f"Impression Type: {order.impression_type or 'N/A'}")
            measurements.append(f"Material: {order.material or 'N/A'}")
            measurements.append(f"Shade: {order.shade or 'N/A'}")
        else:
            measurements.append(f"Test Type: {order.test_type or 'N/A'}")
            measurements.append(f"Sample Type: {order.sample_type or 'N/A'}")
            measurements.append(f"Reason: {order.reason_for_test or 'N/A'}")

        attachment_urls = []
        if order.prosthetic_detail:
            if order.prosthetic_detail.scan_file:
                attachment_urls.append(order.prosthetic_detail.scan_file)
            if order.prosthetic_detail.opposing_bite_scan:
                attachment_urls.append(order.prosthetic_detail.opposing_bite_scan)

        if order.attachments:
            if isinstance(order.attachments, list):
                for att in order.attachments:
                    if isinstance(att, dict) and att.get("url"):
                        attachment_urls.append(att.get("url"))
                    elif isinstance(att, str):
                        attachment_urls.append(att)

        from datetime import datetime
        order.email_sent_at = datetime.utcnow().isoformat()
        
        email_body = f"""
========================================================================
[SIMULATED EMAIL DISPATCH]
To: {vendor_email}
Subject: New Lab Order Request: Case {order.id}
Timestamp: {order.email_sent_at}
------------------------------------------------------------------------
Dear Lab Partner,

Please fabricate the following dental case request.

Patient Name: {order.patient_name}
Ordering Dentist: {order.dentist_name}
Dentist Contact: {order.dentist_contact}

Case Details / Measurements:
- Category: {order.order_category}
{chr(10).join('- ' + m for m in measurements)}

Doctor's Notes:
"{order.notes or 'None'}"

Technician's Notes:
"{order.tech_notes or 'None'}"

Attachments:
{chr(10).join('- ' + a for a in attachment_urls) if attachment_urls else 'No attachments uploaded.'}

Please confirm receipt and expected completion date.

Regards,
SmileCare Lab Management System
========================================================================
"""
        # Collect physical attachment files
        attachment_files = []
        for url_or_name in attachment_urls:
            fname = os.path.basename(url_or_name)
            if fname:
                path = os.path.join("static", "uploads", fname)
                if os.path.exists(path):
                    attachment_files.append(path)

        send_smtp_email(vendor_email, f"New Lab Order Request: Case {order.id}", email_body, attachment_files)
        


    return serialize_order(order)

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

    user_name = current_user.get("name") or current_user.get("sub") or "User"
    
    # Append rework event object to rework_history array
    history = list(original_order.rework_history or [])
    rework_entry = {
        "date": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "rework_count": len(history) + 1,
        "category": status_data.rejection_category or "Correction / Adjustment",
        "reason": status_data.rejection_reason or "Return for correction",
        "notes": status_data.tech_notes or status_data.rejection_reason or "Rework requested.",
        "submitted_by": user_name,
        "files": status_data.attachments or []
    }
    history.append(rework_entry)

    original_order.rework_history = history
    original_order.status = "Rework Requested"
    original_order.stage = "In Rework"
    original_order.rejection_reason = status_data.rejection_reason
    original_order.rejection_category = status_data.rejection_category
    original_order.is_rework = True
    if not original_order.original_case_id:
        original_order.original_case_id = order_id
        
    db.add(LabAuditTrailModel(
        order_id=order_id,
        user_name=user_name,
        action=f"Returned for Correction (Attempt #{len(history)})",
        note=f"Category: {status_data.rejection_category}. Reason: {status_data.rejection_reason}"
    ))
    
    # Notification for Lab Tech
    db.add(LabNotificationModel(
        recipient_role="lab tech",
        type="Orders",
        title=f"Case {order_id} Returned for Rework",
        desc=f"Case {order_id} returned for correction (Attempt #{len(history)}). Reason: {status_data.rejection_reason}",
        read=False
    ))
    
    db.commit()
    db.refresh(original_order)
    return serialize_order(original_order)

# -------------------------------------------------------------
# Soft Concurrency Claim Lock Endpoint
# -------------------------------------------------------------
@router.post("/orders/{order_id}/claim", response_model=LabOrderResponse)
def claim_lab_order(
    order_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Soft concurrency lock: allows a lab tech to claim a pending review case.
    Prevents two lab techs from simultaneously editing/dispatching the same case.
    """
    user_name = current_user.get("name") or current_user.get("sub") or "Lab Tech"
    order = db.query(LabOrderModel).filter(LabOrderModel.id == order_id).with_for_update().first()
    if not order:
        raise HTTPException(status_code=404, detail="Lab order not found")

    if order.claimed_by and order.claimed_by != user_name and order.claimed_at:
        diff_mins = (datetime.now() - order.claimed_at.replace(tzinfo=None)).total_seconds() / 60
        if diff_mins < 15:
            raise HTTPException(
                status_code=409, 
                detail=f"Case {order_id} is currently claimed by {order.claimed_by} for active review."
            )

    order.claimed_by = user_name
    order.claimed_at = datetime.now()
    db.commit()
    db.refresh(order)
    return serialize_order(order)

# -------------------------------------------------------------
# Vendor Inbound Email Parser / Webhook
# -------------------------------------------------------------
# -------------------------------------------------------------
# Vendor Inbound Email Parser / Proposal Webhook
# -------------------------------------------------------------
@router.post("/inbound-email")
def handle_inbound_vendor_email(payload: dict, db: Session = Depends(get_db)):
    """
    Parses incoming email replies from external lab vendors.
    Instead of silently mutating status, creates a human-in-the-loop pending update proposal
    surfaced to the lab tech for 1-click verification.
    """
    subject = payload.get("subject", "")
    body = payload.get("body", "")
    from_email = payload.get("from_email", "vendor@apexdental.com")

    # Extract Case ID
    case_match = re.search(r"CASE-2026-\d+", f"{subject} {body}", re.IGNORECASE)
    if not case_match:
        return {"success": False, "message": "No valid Case ID found in email body/subject"}

    case_id = case_match.group(0).upper()
    order = db.query(LabOrderModel).filter(LabOrderModel.id == case_id).first()
    if not order:
        return {"success": False, "message": f"Case {case_id} not found in database"}

    body_lower = body.lower()
    subject_lower = subject.lower()

    extracted_tracking = None
    tracking_match = re.search(r"(?:tracking|courier|trk|waybill|shipment)\s*(?:id|num|#)?[:\s\-]*([A-Z0-9]{6,16})", f"{subject} {body}", re.IGNORECASE)
    if tracking_match:
        extracted_tracking = tracking_match.group(1).upper()
    elif "track" in body_lower or "courier" in body_lower or "shipped" in body_lower:
        extracted_tracking = f"TRK-{random.randint(10000, 99999)}"

    proposed_status = None
    if any(k in body_lower or k in subject_lower for k in ["work completed", "dispatched", "shipped", "on route", "courier", "en route", "tracking"]):
        proposed_status = "Arriving"
    elif any(k in body_lower or k in subject_lower for k in ["confirmed", "order confirmed", "accepted"]):
        proposed_status = "Confirmed"

    if not proposed_status:
        return {"success": False, "message": "No actionable status detected in email body."}

    eta_date = (date.today() + timedelta(days=3)).strftime("%Y-%m-%d")

    proposal = {
        "case_id": case_id,
        "proposed_status": proposed_status,
        "proposed_stage": "Arriving / In Transit" if proposed_status == "Arriving" else "Production / Confirmed",
        "tracking_number": extracted_tracking or f"TRK-{random.randint(10000, 99999)}",
        "expected_return_date": eta_date,
        "vendor_email": from_email,
        "email_subject": subject,
        "detected_at": datetime.now().strftime("%Y-%m-%d %H:%M")
    }

    # Store proposed update on order without mutating actual order status silently!
    order.pending_email_proposal = proposal

    desc_msg = f"Detected: Apex/Vendor update for {case_id}: Proposed Status '{proposed_status}'"
    if proposal["tracking_number"]:
        desc_msg += f", Tracking #{proposal['tracking_number']}"
    desc_msg += f", ETA {eta_date} — Click Accept to apply."

    db.add(LabNotificationModel(
        recipient_role="lab tech",
        type="Orders",
        title=f"Detected Email Update: Case {case_id}",
        desc=desc_msg,
        read=False
    ))

    db.commit()
    db.refresh(order)
    return {
        "success": True,
        "proposed": True,
        "case_id": case_id,
        "proposal": proposal
    }

# -------------------------------------------------------------
# Accept & Dismiss Email Proposal Endpoints
# -------------------------------------------------------------
@router.post("/orders/{order_id}/accept-email-update", response_model=LabOrderResponse)
def accept_email_update(
    order_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    order = db.query(LabOrderModel).filter(LabOrderModel.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Lab order not found")

    if not order.pending_email_proposal:
        raise HTTPException(status_code=400, detail="No pending email proposal found for this case.")

    proposal = order.pending_email_proposal
    user_name = current_user.get("name") or current_user.get("sub") or "Lab Technician"

    # Apply proposed status changes
    order.status = proposal.get("proposed_status", "Confirmed")
    order.stage = proposal.get("proposed_stage", "Production / Confirmed")
    if proposal.get("tracking_number"):
        order.tracking_number = proposal["tracking_number"]
    if proposal.get("expected_return_date"):
        order.expected_return_date = proposal["expected_return_date"]

    # Clear pending proposal
    order.pending_email_proposal = None

    # Audit Trail
    db.add(LabAuditTrailModel(
        order_id=order_id,
        user_name=user_name,
        action="Accepted Email Proposal",
        note=f"Applied status '{order.status}', tracking #{order.tracking_number}, ETA {order.expected_return_date}"
    ))

    # Notify doctor if arriving
    if order.status == "Arriving":
        db.add(LabNotificationModel(
            recipient_role="doctor",
            type="labs",
            title=f"Lab Case {order_id} En Route (Arriving)",
            desc=f"Case {order_id} for patient {order.patient_name or 'Walk-in'} is arriving. Courier Tracking ID: {order.tracking_number}. Estimated Delivery: {order.expected_return_date}.",
            read=False
        ))

    db.commit()
    db.refresh(order)
    return serialize_order(order)

@router.post("/orders/{order_id}/dismiss-email-update", response_model=LabOrderResponse)
def dismiss_email_update(
    order_id: str,
    db: Session = Depends(get_db)
):
    order = db.query(LabOrderModel).filter(LabOrderModel.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Lab order not found")

    order.pending_email_proposal = None
    db.commit()
    db.refresh(order)
    return serialize_order(order)

@router.post("/orders/{order_id}/collect-payment", response_model=LabOrderResponse)
def collect_lab_order_payment(
    order_id: str,
    payload: dict,
    db: Session = Depends(get_db)
):
    order = db.query(LabOrderModel).filter(LabOrderModel.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Lab order not found")

    amount_paid = float(payload.get("amount_paid", 0.0))
    payment_method = payload.get("payment_method", "Cash")
    total_amount = float(payload.get("total_amount", order.patient_total_amount or 3500.0))

    order.patient_total_amount = total_amount
    order.patient_amount_paid = amount_paid
    order.patient_balance_due = max(0.0, total_amount - amount_paid)
    order.payment_method = payment_method
    order.date_received = datetime.now()

    if order.patient_balance_due <= 0:
        order.payment_status = "Paid in Full"
    else:
        order.payment_status = "50% Advance Paid"

    db.commit()
    db.refresh(order)
    return serialize_order(order)

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
    # Purge any existing non-flagged/non-rejected doctor notifications from database
    if recipient_role == "doctor":
        all_doc_notifs = db.query(LabNotificationModel).filter(LabNotificationModel.recipient_role == "doctor").all()
        for notif in all_doc_notifs:
            title_lower = (notif.title or "").lower()
            desc_lower = (notif.desc or "").lower()
            is_allowed = (
                "flagged" in title_lower or "flagged" in desc_lower or
                "revision" in title_lower or "revision" in desc_lower or
                "sent back" in title_lower or "sent back" in desc_lower or
                "reject" in title_lower or "reject" in desc_lower
            )
            if not is_allowed:
                db.delete(notif)
        db.commit()

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
    notif.read = True  # type: ignore
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
        unit_price=item_data.unit_price,
        supplier=item_data.supplier,
        expiry_date=item_data.expiry_date,
        batch_number=item_data.batch_number
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

    if item_data.name is not None: item.name = item_data.name  # type: ignore
    if item_data.category is not None: item.category = item_data.category  # type: ignore
    if item_data.current_stock is not None: item.current_stock = item_data.current_stock  # type: ignore
    if item_data.minimum_stock_alert is not None: item.minimum_stock_alert = item_data.minimum_stock_alert  # type: ignore
    if item_data.unit is not None: item.unit = item_data.unit  # type: ignore
    if item_data.unit_price is not None: item.unit_price = item_data.unit_price  # type: ignore
    if item_data.supplier is not None: item.supplier = item_data.supplier  # type: ignore
    if item_data.expiry_date is not None: item.expiry_date = item_data.expiry_date  # type: ignore
    if item_data.batch_number is not None: item.batch_number = item_data.batch_number  # type: ignore

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

    req.status = status_data.status  # type: ignore
    
    # If fulfilled, update inventory stock automatically
    if req.status == "Fulfilled":
        if req.item_id:
            item = db.query(InventoryItemModel).filter(InventoryItemModel.id == req.item_id).first()
            if item:
                item.current_stock += req.requested_quantity  # type: ignore
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
            req.item_id = new_item.id  # type: ignore
            
    db.commit()
    db.refresh(req)

    # Notify lab tech
    if req.status == "Ordered":
        notif_title = f"Restock Request Ordered"
        notif_desc = f"Your restock request for {req.item_name} has been approved and ordered from the supplier."
    elif req.status == "Fulfilled":
        notif_title = f"Restock Request Received"
        notif_desc = f"The requested {req.item_name} has arrived and is updated in the inventory."
    else:
        notif_title = f"Restock Request {req.status}"
        notif_desc = f"Your restock request for {req.item_name} is marked as {req.status}."

    notif = LabNotificationModel(
        recipient_role="lab tech",
        type="inventory",
        title=notif_title,
        desc=notif_desc,
        read=False
    )
    db.add(notif)
    db.commit()

    return req

# -------------------------------------------------------------
# Admin Lab Module Pricing Catalog Endpoints
# -------------------------------------------------------------

from modules.lab.models import LabItemPriceModel
from modules.lab.schemas import LabItemPriceCreate, LabItemPriceUpdate, LabItemPriceResponse

@router.get("/pricing-catalog", response_model=List[LabItemPriceResponse])
def get_lab_pricing_catalog(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    prices = db.query(LabItemPriceModel).order_by(LabItemPriceModel.category.asc(), LabItemPriceModel.item_name.asc()).all()
    return prices

@router.post("/pricing-catalog", response_model=LabItemPriceResponse)
def create_lab_pricing_item(
    item_data: LabItemPriceCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    # Calculate patient price if not provided or 0
    patient_price = item_data.patient_price
    if not patient_price or patient_price == 0:
        vendor_cost = item_data.vendor_cost or 0.0
        markup = item_data.clinic_markup_pct or 0.0
        patient_price = round(vendor_cost * (1 + markup / 100.0), 2)

    new_item = LabItemPriceModel(
        item_name=item_data.item_name,
        category=item_data.category,
        material_tier=item_data.material_tier,
        vendor_cost=item_data.vendor_cost,
        clinic_markup_pct=item_data.clinic_markup_pct,
        patient_price=patient_price,
        warranty_months=item_data.warranty_months,
        is_active=item_data.is_active
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item

@router.put("/pricing-catalog/{item_id}", response_model=LabItemPriceResponse)
def update_lab_pricing_item(
    item_id: int,
    item_data: LabItemPriceUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    item = db.query(LabItemPriceModel).filter(LabItemPriceModel.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Pricing catalog item not found")

    if item_data.item_name is not None: item.item_name = item_data.item_name  # type: ignore
    if item_data.category is not None: item.category = item_data.category  # type: ignore
    if item_data.material_tier is not None: item.material_tier = item_data.material_tier  # type: ignore
    if item_data.vendor_cost is not None: item.vendor_cost = item_data.vendor_cost  # type: ignore
    if item_data.clinic_markup_pct is not None: item.clinic_markup_pct = item_data.clinic_markup_pct  # type: ignore
    if item_data.warranty_months is not None: item.warranty_months = item_data.warranty_months  # type: ignore
    if item_data.is_active is not None: item.is_active = item_data.is_active  # type: ignore

    if item_data.patient_price is not None:
        item.patient_price = item_data.patient_price  # type: ignore
    elif item_data.vendor_cost is not None or item_data.clinic_markup_pct is not None:
        v_cost = item.vendor_cost or 0.0
        markup = item.clinic_markup_pct or 0.0
        item.patient_price = round(v_cost * (1 + markup / 100.0), 2)  # type: ignore

    db.commit()
    db.refresh(item)
    return item

@router.delete("/pricing-catalog/{item_id}")
def delete_lab_pricing_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    item = db.query(LabItemPriceModel).filter(LabItemPriceModel.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Pricing catalog item not found")
    db.delete(item)
    db.commit()
    return {"detail": "Pricing catalog item deleted successfully"}

