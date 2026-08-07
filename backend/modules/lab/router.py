
# ─────────────────────────────────────────────────────────────────────────────
# CONTRACT PRICING HELPER & VALIDATION ENGINE
# ─────────────────────────────────────────────────────────────────────────────

from sqlalchemy import func

def lookup_vendor_contract_pricing(db: Session, vendor_id: int, restoration_type: str, material: str = None):
    if not vendor_id or not restoration_type:
        return None

    norm_type = restoration_type.strip().lower()
    
    # 1. Look for exact vendor_id + restoration_type match
    query = db.query(LabVendorPricingModel).filter(
        LabVendorPricingModel.vendor_id == vendor_id,
        LabVendorPricingModel.is_active == True
    )
    
    all_rules = query.all()
    matched_rule = None
    
    for rule in all_rules:
        r_type = (rule.restoration_type or "").strip().lower()
        if r_type in norm_type or norm_type in r_type:
            if material and rule.material and rule.material.strip().lower() != "all":
                if rule.material.strip().lower() in material.strip().lower():
                    return rule
            else:
                matched_rule = rule

    return matched_rule

import re
import secrets
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime
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
    PathologyCaseDetailModel,
    UnmatchedLabEmailModel,
    LabVendorPricingModel
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
    RestockRequestResponse,
    LabItemReceivedCreate,
    LabAccountantBillFinalize,
    LabCommunicationLogCreate,
    ProcessCompletionEmailCreate,
    ConfirmCompletionEmailCreate,
    UnmatchedEmailResponse,
    DoctorApproveCreate,
    LabVendorPricingCreate,
    LabVendorPricingResponse,
    LabFinancialReportResponse,
    DoctorReworkRequestCreate,
    SendReworkToExternalLabCreate,
    ExternalReworkResponseCreate,
    ScheduleFittingCreate,
)
from modules.patient.models import PatientModel, PatientNotificationModel
from modules.doctor.models import DoctorModel
from modules.auth.models import UserModel
import secrets
import random
import os
import shutil
import re
from datetime import datetime
import smtplib
import socket
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders

def get_system_lan_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "localhost"

def get_app_base_url():
    configured_url = (
        os.getenv("APP_BASE_URL") or 
        os.getenv("FRONTEND_URL") or 
        os.getenv("PUBLIC_URL")
    )
    if configured_url:
        url = configured_url.rstrip("/")
        if not url.startswith("http://") and not url.startswith("https://"):
            url = f"http://{url}"
        
        # Convert local network IP addresses to localhost to prevent local Wi-Fi timeout issues
        if "192.168." in url or "127.0.0.1" in url:
            port = "3000"
            match_port = re.search(r':(\d+)$', url)
            if match_port:
                port = match_port.group(1)
            return f"http://localhost:{port}"

        return url
    
    return "http://localhost:3000"

def send_smtp_email(to_email: str, subject: str, body_text: str, attachment_files: list = None, is_html: bool = True) -> bool:
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    try:
        smtp_port = int(os.getenv("SMTP_PORT", "587"))
    except (ValueError, TypeError):
        smtp_port = 587

    lab_email = os.getenv("LAB_EMAIL")
    lab_password = os.getenv("LAB_EMAIL_APP_PASSWORD")
    smtp_from = lab_email
    
    if not all([smtp_host, smtp_port, lab_email, lab_password]):
        print(f"[SMTP WARNING] LAB_EMAIL or LAB_EMAIL_APP_PASSWORD is missing in .env. Real email skipped. To: {to_email}", flush=True)
        return False
        
    try:
        msg = MIMEMultipart('mixed')
        msg['From'] = smtp_from
        msg['To'] = to_email
        msg['Subject'] = subject
        
        # Create alternative subpart for text/plain fallback + text/html rendering
        alt_part = MIMEMultipart('alternative')
        
        # Plain text fallback
        plain_fallback = re.sub(r'<[^>]+>', ' ', body_text)
        alt_part.attach(MIMEText(plain_fallback, 'plain', 'utf-8'))
        
        # Check if content is HTML
        is_html_content = is_html or bool(re.search(r'<[a-z][\s\S]*>', body_text, re.IGNORECASE))
        if is_html_content:
            alt_part.attach(MIMEText(body_text, 'html', 'utf-8'))
        else:
            alt_part.attach(MIMEText(body_text, 'plain', 'utf-8'))

        msg.attach(alt_part)
        
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

        server = smtplib.SMTP(smtp_host, smtp_port)
        server.starttls()
        server.login(lab_email, lab_password)
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
    current_user: Optional[dict] = Depends(get_optional_current_user)
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
    
    user_id = current_user.get("user_id") if isinstance(current_user, dict) else None
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
        physical_mold_sent=(order_data.impression_type == "Physical" or bool(order_data.notes and "physical" in order_data.notes.lower()))
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
            "claimed_by": order.claimed_by,
            "claimed_at": order.claimed_at.isoformat() if order.claimed_at else None,
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
    if new_status in ["Flagged", "flagged", "Sent Back", "Flagged - Waiting for Doctor Review"]:
        order.status = "Flagged - Waiting for Doctor Review"
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

import traceback

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
    if order.status not in ["Draft", "draft", "Revision Requested", "revision_requested", "Submitted", "submitted", "Confirmed", "confirmed", "Doctor Accepted", "doctor_accepted", "Ordered", "ordered", "Flagged", "flagged", "Flagged - Waiting for Doctor Review", "Resubmitted by Doctor", "Pending", "Pending Review", "Pending Doctor Review", "Pending Doctor Confirmation", "Confirmed by Tech", "Returned for Rework", "returned_for_rework"]:
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
    user_name = (current_user.get("name") if isinstance(current_user, dict) else None) or "User"
    if changes:
        db.add(LabAuditTrailModel(
            order_id=order_id,
            user_name=user_name,
            action="Order Edited & Resubmitted",
            note=f"Modified fields: {', '.join(changes)}"
        ))
        db.commit()

    # If order was flagged and edited by Doctor, update status to Resubmitted by Doctor & notify Lab Tech
    was_flagged = order.status in ["Flagged", "flagged", "Flagged - Waiting for Doctor Review", "Revision Requested", "revision_requested"]
    if was_flagged or edit_data.status in ["Resubmitted by Doctor", "Resubmitted"]:
        order.status = "Resubmitted by Doctor"
        details_dict = dict(order.order_details or {}) if isinstance(order.order_details, dict) else {}
        details_dict["revised_fields"] = changes
        details_dict["resubmitted_at"] = datetime.utcnow().isoformat()
        order.order_details = details_dict

        db.add(LabNotificationModel(
            recipient_role="lab tech",
            type="Orders",
            title=f"Lab Order Resubmitted: Case {order_id}",
            desc=f"Dr. {user_name} updated and resubmitted Case {order_id} for patient {order.patient_name or 'Patient'}. Revised fields: {', '.join(changes) if changes else 'Updated parameters'}.",
            read=False
        ))
        db.commit()

    elif "status" in changes and order.status == "Pending Review":
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
    db.delete(item)
    db.commit()
    return {"detail": "Pricing catalog item deleted successfully"}


# =========================================================================
# External Dental Lab Email Acceptance Workflow Endpoints
# =========================================================================

def build_external_lab_email_html(order: LabOrderModel, token: str, accept_url: str, reject_url: str) -> str:
    attachment_urls = []
    if order.prosthetic_detail:
        if order.prosthetic_detail.scan_file:
            attachment_urls.append(order.prosthetic_detail.scan_file)
        if order.prosthetic_detail.opposing_bite_scan:
            attachment_urls.append(order.prosthetic_detail.opposing_bite_scan)

    if order.attachments and isinstance(order.attachments, list):
        for att in order.attachments:
            if isinstance(att, dict) and att.get("url"):
                attachment_urls.append(att.get("url"))
            elif isinstance(att, str):
                attachment_urls.append(att)

    if order.result_document_url:
        attachment_urls.append(order.result_document_url)

    # Unique attachment URLs
    attachment_urls = list(dict.fromkeys(attachment_urls))

    backend_base = "http://127.0.0.1:8000"
    attachments_html = []
    for a in attachment_urls:
        fname = os.path.basename(str(a))
        if str(a).startswith("http://") or str(a).startswith("https://"):
            full_url = str(a)
        elif str(a).startswith("/"):
            full_url = f"{backend_base}{a}"
        else:
            full_url = f"{backend_base}/static/uploads/{fname}"

        attachments_html.append(
            f'<li style="margin-bottom:6px;"><a href="{full_url}" target="_blank" download style="color:#0284c7;font-weight:700;text-decoration:underline;">📥 Download {fname}</a></li>'
        )

    attachments_list = "".join(attachments_html) if attachments_html else '<li style="color:#94a3b8;font-style:italic;">No reference scan/photo files attached</li>'

    # Extract exact doctor details without forced "PFM" defaults
    category = order.order_category or "Prosthetic"
    p_type = (order.prosthetic_detail.fabrication_type if order.prosthetic_detail else None) or order.prosthetic_type or None
    teeth = (order.prosthetic_detail.tooth_number if order.prosthetic_detail else None) or order.tooth_quadrant or getattr(order, "tooth_number", None) or None
    mat = (order.prosthetic_detail.material if order.prosthetic_detail else None) or order.material or None
    shd = (order.prosthetic_detail.shade if order.prosthetic_detail else None) or order.shade or None
    impression = order.impression_type or None
    margin = order.margin_design or None
    due_date = order.expected_return_date or "As per standard turnaround"

    # Build prescription details table without Ordering Doctor row
    details_rows = [
        f'<tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:10px 0; color:#64748b; font-weight:600; width:38%;">Patient Name:</td><td style="padding:10px 0; color:#0f172a; font-weight:700;">{order.patient_name or "N/A"}</td></tr>',
        f'<tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:10px 0; color:#64748b; font-weight:600;">Case Category:</td><td style="padding:10px 0; color:#0284c7; font-weight:800;">{category}</td></tr>',
    ]

    if p_type:
        details_rows.append(f'<tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:10px 0; color:#64748b; font-weight:600;">Restoration / Case Type:</td><td style="padding:10px 0; color:#0f172a; font-weight:800;">{p_type}</td></tr>')
    if teeth:
        details_rows.append(f'<tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:10px 0; color:#64748b; font-weight:600;">Tooth Number(s) / Quadrant:</td><td style="padding:10px 0; color:#0f172a; font-weight:700;">{teeth}</td></tr>')
    if mat:
        details_rows.append(f'<tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:10px 0; color:#64748b; font-weight:600;">Material:</td><td style="padding:10px 0; color:#0f172a; font-weight:700;">{mat}</td></tr>')
    if shd:
        details_rows.append(f'<tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:10px 0; color:#64748b; font-weight:600;">Shade:</td><td style="padding:10px 0; color:#0f172a; font-weight:700;">{shd}</td></tr>')
    if impression:
        details_rows.append(f'<tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:10px 0; color:#64748b; font-weight:600;">Impression Type:</td><td style="padding:10px 0; color:#0f172a; font-weight:700;">{impression}</td></tr>')
    if margin:
        details_rows.append(f'<tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:10px 0; color:#64748b; font-weight:600;">Margin Design:</td><td style="padding:10px 0; color:#0f172a; font-weight:700;">{margin}</td></tr>')

    details_rows.append(f'<tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:10px 0; color:#64748b; font-weight:600;">Expected Due Date:</td><td style="padding:10px 0; color:#e11d48; font-weight:800;">{due_date}</td></tr>')

    table_rows_html = "".join(details_rows)

    return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Dental Case Prescription - SmileCare</title>
</head>
<body style="font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color:#f8fafc; margin:0; padding:24px; color:#1e293b;">
  <table role="presentation" style="width:100%; max-width:600px; margin:0 auto; background-color:#ffffff; border-radius:16px; overflow:hidden; border:1px solid #e2e8f0; box-shadow:0 10px 15px -3px rgba(0,0,0,0.05);">
    <!-- Header Banner -->
    <tr>
      <td style="background-color:#0f172a; padding:28px; text-align:center;">
        <h1 style="color:#38bdf8; font-size:24px; font-weight:800; margin:0; letter-spacing:-0.5px;">SmileCare Dental CRM</h1>
        <p style="color:#94a3b8; font-size:13px; font-weight:600; margin:6px 0 0 0; text-transform:uppercase; letter-spacing:1px;">External Laboratory Prescription</p>
      </td>
    </tr>

    <!-- Body Content -->
    <tr>
      <td style="padding:28px;">
        <div style="background-color:#f0f9ff; border:1px solid #bae6fd; border-radius:12px; padding:16px; margin-bottom:24px;">
          <h2 style="font-size:16px; color:#0369a1; margin:0 0 4px 0;">Dental Case Prescription: <span style="font-weight:900;">{order.id}</span></h2>
          <p style="font-size:13px; color:#0c4a6e; margin:0;">Please review the case details below and confirm whether your laboratory accepts or rejects this prescription.</p>
        </div>

        <table style="width:100%; font-size:14px; border-collapse:collapse; margin-bottom:24px;">
          {table_rows_html}
        </table>

        <!-- Notes Section -->
        <div style="margin-bottom:24px;">
          <h4 style="font-size:12px; text-transform:uppercase; color:#64748b; letter-spacing:1px; margin:0 0 6px 0;">Doctor's Notes & Instructions:</h4>
          <div style="background-color:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:12px; font-size:13px; color:#334155; font-style:italic;">
            "{order.notes or 'No special clinical notes provided.'}"
          </div>
        </div>

        <!-- Attachments Section -->
        <div style="margin-bottom:28px;">
          <h4 style="font-size:12px; text-transform:uppercase; color:#64748b; letter-spacing:1px; margin:0 0 8px 0;">Scans & Attachments:</h4>
          <ul style="padding-left:20px; margin:0; font-size:13px;">
            {attachments_list}
          </ul>
        </div>

        <!-- ACTION BUTTONS -->
        <div style="text-align:center; padding-top:20px; border-top:1px solid #e2e8f0; margin-top:20px;">
          <p style="font-size:14px; font-weight:700; color:#334155; margin:0 0 18px 0;">Please select an action to respond to this case prescription:</p>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:0 auto;">
            <tr>
              <td align="center" style="border-radius:10px; background-color:#16a34a;">
                <a href="{accept_url}" target="_blank" style="background-color:#16a34a; border:1px solid #15803d; border-radius:10px; color:#ffffff; font-family:sans-serif; font-size:15px; font-weight:800; text-decoration:none; padding:14px 28px; display:inline-block; letter-spacing:0.5px;">
                  &#10004; Accept Case
                </a>
              </td>
              <td style="width:16px;"></td>
              <td align="center" style="border-radius:10px; background-color:#dc2626;">
                <a href="{reject_url}" target="_blank" style="background-color:#dc2626; border:1px solid #b91c1c; border-radius:10px; color:#ffffff; font-family:sans-serif; font-size:15px; font-weight:800; text-decoration:none; padding:14px 28px; display:inline-block; letter-spacing:0.5px;">
                  &#10008; Reject Case
                </a>
              </td>
            </tr>
          </table>
        </div>

        <!-- CASE COMPLETION INSTRUCTIONS FOR EMAIL REPLIES -->
        <div style="margin-top:28px; padding:20px; background-color:#f8fafc; border:1px dashed #cbd5e1; border-radius:12px; font-size:13px; color:#1e293b; line-height:1.5;">
          <h4 style="font-size:14px; font-weight:800; color:#0f172a; margin:0 0 8px 0; text-transform:uppercase; letter-spacing:0.5px;">Case Completion Instructions</h4>
          <p style="margin:0 0 12px 0; color:#475569;">When the restoration is completed, please reply to this email using the following format.</p>
          <div style="background-color:#ffffff; border:1px solid #cbd5e1; border-radius:8px; padding:14px; font-family:Consolas, monospace; font-size:12px; color:#0f172a; margin-bottom:12px; white-space:pre-wrap;">
Case Number:
{order.id}

Status:
COMPLETED

Courier:
BlueDart

Tracking Number:
BD4587921

Expected Delivery:
09-Aug-2026

Remarks:
Handle carefully.</div>
          <p style="margin:12px 0 6px 0; font-weight:700; color:#64748b;">For rework completion:</p>
          <div style="background-color:#ffffff; border:1px solid #cbd5e1; border-radius:8px; padding:14px; font-family:Consolas, monospace; font-size:12px; color:#0f172a; white-space:pre-wrap;">
Case Number:
{order.id}

Status:
REWORK COMPLETED

Courier:
BlueDart

Tracking Number:
BD4587921

Expected Delivery:
12-Aug-2026

Remarks:
Margin adjusted.</div>
        </div>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background-color:#f1f5f9; padding:16px; text-align:center; font-size:11px; color:#64748b;">
        This email was sent by SmileCare Dental CRM.<br>
        Direct token link: <a href="{accept_url}" style="color:#0284c7;">{accept_url}</a>
      </td>
    </tr>
  </table>
</body>
</html>
"""

@router.post("/orders/{order_id}/send-to-vendor", response_model=LabOrderResponse)
def send_order_to_external_vendor(
    order_id: str,
    payload: dict = {},
    db: Session = Depends(get_db),
    current_user: Optional[dict] = Depends(get_optional_current_user)
):
    order = db.query(LabOrderModel).filter(LabOrderModel.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Lab order not found")

    vendor_id = payload.get("vendor_id")
    vendor_name = payload.get("vendor_name")
    vendor_email = payload.get("vendor_email")
    tech_notes = payload.get("tech_notes")

    if vendor_id:
        order.vendor_id = vendor_id
        vendor = db.query(LabVendorModel).filter(LabVendorModel.id == vendor_id).first()
        if vendor:
            if not vendor_name:
                vendor_name = vendor.name
            if not vendor_email:
                vendor_email = vendor.email

    if vendor_name:
        order.lab_name = vendor_name
    if tech_notes:
        order.tech_notes = tech_notes

    if not vendor_email:
        vendor_email = "external-lab@dentalvendor.com"

    # ── CONTRACT PRICING CHECK & VALIDATION ENFORCEMENT ──
    restoration_type = order.prosthetic_type or order.fabrication_type or order.order_category or "Crown"
    if order.prosthetic_detail and order.prosthetic_detail.fabrication_type:
        restoration_type = order.prosthetic_detail.fabrication_type

    pricing = None
    if order.vendor_id:
        pricing = lookup_vendor_contract_pricing(db, order.vendor_id, restoration_type, order.material)

    if not pricing:
        v_name = vendor_name or (order.vendor_id and f"Vendor #{order.vendor_id}") or "Selected External Lab"
        raise HTTPException(
            status_code=400,
            detail=f"Pricing configuration missing: Admin must configure contract pricing for vendor '{v_name}' and restoration '{restoration_type}' before proceeding."
        )

    # Snapshot contract financial details onto lab order
    order.supplier_cost = float(pricing.supplier_cost)
    order.patient_charge = float(pricing.patient_charge)
    order.gross_profit = float(pricing.patient_charge - pricing.supplier_cost)
    order.pricing_configured = True

    token = secrets.token_urlsafe(32)
    order.external_token = token
    order.external_token_created_at = datetime.utcnow()
    order.external_token_active = True
    was_resubmitted = order.status in ["Resubmitted by Doctor", "Resubmitted", "Returned for Rework"]
    order.status = "Order Sent to Lab"
    order.email_sent_at = datetime.utcnow().isoformat()
    order.rejection_reason = None

    base_frontend_url = get_app_base_url()
    accept_url = f"{base_frontend_url}/external-lab/respond/{token}?action=accept"
    reject_url = f"{base_frontend_url}/external-lab/respond/{token}?action=reject"

    html_content = build_external_lab_email_html(order, token, accept_url, reject_url)

    attachment_files = []
    attachment_urls = []
    if order.prosthetic_detail and order.prosthetic_detail.scan_file:
        attachment_urls.append(order.prosthetic_detail.scan_file)
    if order.attachments and isinstance(order.attachments, list):
        for att in order.attachments:
            if isinstance(att, dict) and att.get("url"):
                attachment_urls.append(att.get("url"))

    for url_or_name in attachment_urls:
        fname = os.path.basename(str(url_or_name))
        if fname:
            path = os.path.join("static", "uploads", fname)
            if os.path.exists(path):
                attachment_files.append(path)

    print(f"\n========================================================================", flush=True)
    print(f"[EXTERNAL LAB EMAIL DISPATCHED]", flush=True)
    print(f"To: {vendor_email}", flush=True)
    print(f"Subject: New Lab Order Request: Case {order.id}", flush=True)
    print(f"Accept Link: {accept_url}", flush=True)
    print(f"Reject Link: {reject_url}", flush=True)
    print(f"========================================================================\n", flush=True)

    send_smtp_email(vendor_email, f"New Lab Order Request: Case {order.id}", html_content, attachment_files)

    user_name = (current_user.get("name") if (current_user and isinstance(current_user, dict)) else None) or "Lab Technician"
    audit = LabAuditTrailModel(
        order_id=order_id,
        user_name=user_name,
        action="Sent Updated Case to External Lab" if was_resubmitted else "Sent to External Lab",
        note=f"Dispatched secure email token to {vendor_name or vendor_email}."
    )
    db.add(audit)
    db.commit()
    db.refresh(order)

    return serialize_order(order)


@router.post("/orders/{order_id}/reminder", response_model=LabOrderResponse)
def send_external_lab_reminder(
    order_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[dict] = Depends(get_optional_current_user)
):
    order = db.query(LabOrderModel).filter(LabOrderModel.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Lab order not found")

    if getattr(order, "external_token_active", True) is False:
        raise HTTPException(status_code=400, detail="Active request is cancelled or replaced.")

    token = order.external_token
    if not token:
        token = secrets.token_urlsafe(32)
        order.external_token = token
        order.external_token_active = True
        db.commit()

    base_frontend_url = get_app_base_url()
    accept_url = f"{base_frontend_url}/external-lab/respond/{token}?action=accept"
    reject_url = f"{base_frontend_url}/external-lab/respond/{token}?action=reject"
    html_content = build_external_lab_email_html(order, token, accept_url, reject_url)

    attachment_files = []
    attachment_urls = []
    if order.prosthetic_detail and order.prosthetic_detail.scan_file:
        attachment_urls.append(order.prosthetic_detail.scan_file)
    if order.attachments and isinstance(order.attachments, list):
        for att in order.attachments:
            if isinstance(att, dict) and att.get("url"):
                attachment_urls.append(att.get("url"))

    for url_or_name in attachment_urls:
        fname = os.path.basename(str(url_or_name))
        if fname:
            path = os.path.join("static", "uploads", fname)
            if os.path.exists(path):
                attachment_files.append(path)

    vendor_email = "external-lab@dentalvendor.com"
    if order.vendor_id:
        vendor = db.query(LabVendorModel).filter(LabVendorModel.id == order.vendor_id).first()
        if vendor and vendor.email:
            vendor_email = vendor.email

    send_smtp_email(vendor_email, f"REMINDER: Lab Order Request Case {order.id}", html_content, attachment_files)

    user_name = (current_user.get("name") if (current_user and isinstance(current_user, dict)) else None) or "Lab Technician"
    audit = LabAuditTrailModel(
        order_id=order_id,
        user_name=user_name,
        action="Sent Reminder to External Lab",
        note=f"Resent reminder email for Case {order_id} using existing active token."
    )
    db.add(audit)
    db.commit()
    db.refresh(order)
    return serialize_order(order)


@router.post("/orders/{order_id}/cancel-external", response_model=LabOrderResponse)
def cancel_external_lab_request(
    order_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[dict] = Depends(get_optional_current_user)
):
    order = db.query(LabOrderModel).filter(LabOrderModel.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Lab order not found")

    order.external_token_active = False
    order.status = "Submitted"

    user_name = (current_user.get("name") if (current_user and isinstance(current_user, dict)) else None) or "Lab Technician"
    audit = LabAuditTrailModel(
        order_id=order_id,
        user_name=user_name,
        action="Cancelled External Lab Request",
        note="Invalidated active token and reverted status to Pending Review."
    )
    db.add(audit)
    db.commit()
    db.refresh(order)
    return serialize_order(order)


@router.get("/external-respond/{token}", response_model=LabOrderResponse)
def get_external_lab_order_by_token(token: str, db: Session = Depends(get_db)):
    order = db.query(LabOrderModel).options(
        joinedload(LabOrderModel.prosthetic_detail),
        joinedload(LabOrderModel.pathology_detail)
    ).filter(LabOrderModel.external_token == token).first()

    if not order or getattr(order, "external_token_active", True) is False:
        raise HTTPException(status_code=404, detail="This external lab request link has been replaced by an updated prescription or cancelled by the clinic.")
    
    return serialize_order(order)


@router.post("/external-respond/{token}/accept", response_model=LabOrderResponse)
def external_lab_accept_case(token: str, db: Session = Depends(get_db)):
    order = db.query(LabOrderModel).filter(LabOrderModel.external_token == token).first()
    if not order or getattr(order, "external_token_active", True) is False:
        raise HTTPException(status_code=404, detail="This external lab request link has been replaced by an updated prescription or cancelled by the clinic.")

    old_status = order.status
    order.status = "Accepted by Lab"
    
    audit = LabAuditTrailModel(
        order_id=order.id,
        user_name="External Laboratory",
        action="Accepted by External Lab",
        note=f"External lab accepted case via secure email link (previous status: {old_status})."
    )
    db.add(audit)

    notif1 = LabNotificationModel(
        recipient_role="lab tech",
        type="Orders",
        title=f"Case {order.id} Accepted by External Lab",
        desc=f"External lab ({order.lab_name or 'Vendor'}) has accepted Case {order.id} for patient {order.patient_name or 'Walk-in Patient'}.",
        read=False
    )
    notif2 = LabNotificationModel(
        recipient_role="doctor",
        type="labs",
        title=f"Lab Case {order.id} Accepted by External Lab",
        desc=f"External lab ({order.lab_name or 'Vendor'}) accepted Case {order.id} for patient {order.patient_name or 'Walk-in Patient'}.",
        read=False
    )
    db.add_all([notif1, notif2])
    db.commit()
    db.refresh(order)
    return serialize_order(order)


@router.post("/external-respond/{token}/reject", response_model=LabOrderResponse)
def external_lab_reject_case(token: str, payload: dict = {}, db: Session = Depends(get_db)):
    order = db.query(LabOrderModel).filter(LabOrderModel.external_token == token).first()
    if not order or getattr(order, "external_token_active", True) is False:
        raise HTTPException(status_code=404, detail="This external lab request link has been replaced by an updated prescription or cancelled by the clinic.")

    reason = payload.get("rejection_reason") or payload.get("reason") or "No specific reason provided."
    order.status = "Rejected by Lab"
    order.rejection_reason = reason

    audit = LabAuditTrailModel(
        order_id=order.id,
        user_name="External Laboratory",
        action="Rejected by External Lab",
        note=f"Rejection Reason: {reason}"
    )
    db.add(audit)

    notif = LabNotificationModel(
        recipient_role="lab tech",
        type="Orders",
        title=f"⚠️ Case {order.id} Rejected by External Lab",
        desc=f"External lab ({order.lab_name or 'Vendor'}) rejected Case {order.id} for patient {order.patient_name or 'Walk-in Patient'}. Reason: {reason}",
        read=False
    )
    db.add(notif)
    db.commit()
    db.refresh(order)
    return serialize_order(order)


@router.post("/external-respond/{token}/upload-result", response_model=LabOrderResponse)
def external_lab_upload_result(
    token: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    order = db.query(LabOrderModel).filter(LabOrderModel.external_token == token).first()
    if not order:
        raise HTTPException(status_code=404, detail="Invalid or expired external lab token.")

    upload_dir = os.path.join("static", "uploads")
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_url = f"/static/uploads/{file.filename}"
    order.result_document_url = file_url
    order.status = "Case Completed"

    audit = LabAuditTrailModel(
        order_id=order.id,
        user_name="External Laboratory",
        action="Completed Case Uploaded",
        note=f"External lab uploaded completed case file: {file.filename}"
    )
    db.add(audit)

    notif1 = LabNotificationModel(
        recipient_role="lab tech",
        type="Orders",
        title=f"🎉 Case {order.id} Completed by External Lab",
        desc=f"Finished case result file ({file.filename}) uploaded by external lab for patient {order.patient_name or 'Walk-in Patient'}.",
        read=False
    )
    notif2 = LabNotificationModel(
        recipient_role="doctor",
        type="labs",
        title=f"🎉 Lab Case {order.id} Completed & Ready",
        desc=f"External lab uploaded finished restoration file for patient {order.patient_name or 'Walk-in Patient'}.",
        read=False
    )
    db.add_all([notif1, notif2])
    db.commit()
    db.refresh(order)
    return serialize_order(order)


@router.post("/orders/{order_id}/mark-item-received", response_model=LabOrderResponse)
def mark_item_received_at_clinic(
    order_id: str,
    payload: LabItemReceivedCreate,
    db: Session = Depends(get_db),
    current_user: Optional[dict] = Depends(get_optional_current_user)
):
    order = db.query(LabOrderModel).filter(LabOrderModel.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Lab order not found")

    tech_name = payload.received_by or (current_user.get("name") if isinstance(current_user, dict) else None) or "Lab Technician"
    
    received_time = datetime.utcnow()
    if payload.received_date:
        try:
            received_time = datetime.fromisoformat(payload.received_date.replace("Z", "+00:00"))
        except Exception:
            pass

    order.status = "Item Received at Clinic"
    order.item_condition = payload.item_condition or "Good"
    order.item_remarks = payload.item_remarks
    order.received_by = tech_name
    order.clinic_received_at = received_time
    
    # Save External Lab Invoice details recorded by Lab Tech
    if payload.vendor_name:
        order.vendor_name = payload.vendor_name
    elif not order.vendor_name:
        order.vendor_name = "Apex Dental Lab"
        
    if payload.vendor_invoice_number:
        order.vendor_invoice_number = payload.vendor_invoice_number
    if payload.vendor_invoice_amount is not None:
        order.vendor_invoice_amount = payload.vendor_invoice_amount
    if payload.vendor_invoice_file_url:
        order.vendor_invoice_file_url = payload.vendor_invoice_file_url

    order.receptionist_notified = True
    order.accountant_notified = True
    order.accountant_bill_status = "Pending Bill Generation"

    audit = LabAuditTrailModel(
        order_id=order.id,
        user_name=tech_name,
        action="Item Received at Clinic",
        note=f"Physical item confirmed received by {tech_name}. Recorded External Lab Invoice #{order.vendor_invoice_number or 'N/A'} (Amount: ₹{order.vendor_invoice_amount or 0}) from {order.vendor_name or 'External Lab'}."
    )
    db.add(audit)

    # Automatic Receptionist Notification
    fmt_date = received_time.strftime("%d-%b-%Y")
    proc_name = order.prosthetic_type or order.order_category or "Lab Case Restoration"
    notif_rec = LabNotificationModel(
        recipient_role="receptionist",
        type="Lab Ready",
        title="🔔 Lab Case Ready for Scheduling",
        desc=f"Patient: {order.patient_name or 'Walk-in'} | Doctor: {order.dentist_name or 'Doctor'} | Procedure: {proc_name} | Received: {fmt_date}",
        read=False
    )
    
    # Automatic Accountant Notification
    notif_acct = LabNotificationModel(
        recipient_role="accountant",
        type="Lab Billing",
        title="💳 New Lab Case: Pending Bill Generation",
        desc=f"Patient: {order.patient_name or 'Walk-in'} | Case: {proc_name} | External Lab: {order.vendor_name or 'External Lab'} | Invoice No: {order.vendor_invoice_number or 'N/A'} | Lab Invoice: ₹{order.vendor_invoice_amount or 0}",
        read=False
    )
    db.add_all([notif_rec, notif_acct])

    db.commit()
    db.refresh(order)
    return serialize_order(order)


@router.post("/orders/{order_id}/upload-vendor-invoice")
async def upload_vendor_invoice_file(
    order_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    order = db.query(LabOrderModel).filter(LabOrderModel.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Lab order not found")

    upload_dir = os.path.join(os.getcwd(), "static", "uploads", "lab_invoices")
    os.makedirs(upload_dir, exist_ok=True)

    file_ext = os.path.splitext(file.filename)[1]
    safe_filename = f"lab_inv_{order_id}_{uuid.uuid4().hex[:8]}{file_ext}"
    file_path = os.path.join(upload_dir, safe_filename)

    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)

    invoice_url = f"/static/uploads/lab_invoices/{safe_filename}"
    order.vendor_invoice_file_url = invoice_url
    db.commit()

    return {"invoice_url": invoice_url}


@router.get("/accountant/pending-tasks", response_model=List[LabOrderResponse])
def get_accountant_pending_lab_tasks(
    db: Session = Depends(get_db)
):
    orders = db.query(LabOrderModel).filter(
        (LabOrderModel.accountant_notified == True) | (LabOrderModel.status == "Item Received at Clinic")
    ).order_by(LabOrderModel.clinic_received_at.desc()).all()
    return [serialize_order(o) for o in orders]


@router.post("/accountant/finalize-bill/{order_id}", response_model=LabOrderResponse)
def finalize_accountant_lab_bill(
    order_id: str,
    payload: LabAccountantBillFinalize,
    db: Session = Depends(get_db),
    current_user: Optional[dict] = Depends(get_optional_current_user)
):
    order = db.query(LabOrderModel).filter(LabOrderModel.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Lab order not found")

    acct_name = (current_user.get("name") if isinstance(current_user, dict) else None) or "Accountant"

    order.vendor_invoice_verified = True
    if payload.vendor_invoice_number:
        order.vendor_invoice_number = payload.vendor_invoice_number
    if payload.vendor_invoice_amount:
        order.vendor_invoice_amount = payload.vendor_invoice_amount
        
    order.final_patient_bill_amount = payload.final_patient_bill_amount
    order.patient_total_amount = payload.final_patient_bill_amount
    order.patient_balance_due = max(0.0, payload.final_patient_bill_amount - (order.patient_amount_paid or 0.0))
    order.accountant_bill_status = "Bill Ready"

    audit = LabAuditTrailModel(
        order_id=order.id,
        user_name=acct_name,
        action="Bill Finalized (Bill Ready)",
        note=f"Accountant verified lab invoice (#{payload.vendor_invoice_number or 'N/A'}) and set final patient bill to ₹{payload.final_patient_bill_amount} (Bill Ready)."
    )
    db.add(audit)

    notif_rec = LabNotificationModel(
        recipient_role="receptionist",
        type="Lab Ready",
        title="✅ Patient Bill Ready for Lab Case",
        desc=f"Finalized Bill (₹{payload.final_patient_bill_amount}) ready for patient {order.patient_name} (Case #{order.id}).",
        read=False
    )
    db.add(notif_rec)

    db.commit()
    db.refresh(order)
    return serialize_order(order)


@router.get("/receptionist/pickups", response_model=List[LabOrderResponse])
def get_receptionist_lab_pickups(
    db: Session = Depends(get_db)
):
    orders = db.query(LabOrderModel).filter(
        (LabOrderModel.status == "Item Received at Clinic") | (LabOrderModel.receptionist_notified == True)
    ).order_by(LabOrderModel.clinic_received_at.desc()).all()
    return [serialize_order(o) for o in orders]


@router.post("/receptionist/communication-log/{order_id}", response_model=LabOrderResponse)
def log_receptionist_communication(
    order_id: str,
    payload: LabCommunicationLogCreate,
    db: Session = Depends(get_db),
    current_user: Optional[dict] = Depends(get_optional_current_user)
):
    order = db.query(LabOrderModel).filter(LabOrderModel.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Lab order not found")

    rec_name = (current_user.get("name") if isinstance(current_user, dict) else None) or "Receptionist"
    
    current_logs = list(order.communication_logs or [])
    new_entry = {
        "type": payload.comm_type,
        "notes": payload.notes,
        "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M"),
        "by": rec_name
    }
    current_logs.append(new_entry)
    order.communication_logs = current_logs

    audit = LabAuditTrailModel(
        order_id=order.id,
        user_name=rec_name,
        action=f"Patient Contacted ({payload.comm_type})",
        note=f"Recorded {payload.comm_type} log: '{payload.notes}'"
    )
    db.add(audit)

    db.commit()
    db.refresh(order)
    return serialize_order(order)


@router.get("/receptionist/ready-cases", response_model=List[LabOrderResponse])
def get_receptionist_ready_cases(
    db: Session = Depends(get_db)
):
    orders = db.query(LabOrderModel).filter(
        (LabOrderModel.status == "Item Received at Clinic") | (LabOrderModel.receptionist_notified == True)
    ).order_by(LabOrderModel.clinic_received_at.desc()).all()
    return [serialize_order(o) for o in orders]


@router.post("/receptionist/ready-cases/{order_id}/schedule-complete", response_model=LabOrderResponse)
def complete_receptionist_lab_ready_case(
    order_id: str,
    db: Session = Depends(get_db)
):
    order = db.query(LabOrderModel).filter(LabOrderModel.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Lab order not found")
    
    order.appointment_scheduled = True
    db.commit()
    db.refresh(order)
    return serialize_order(order)


@router.delete("/orders/clear-all-data")
def clear_all_lab_orders_data(
    db: Session = Depends(get_db)
):
    try:
        comments_deleted = db.query(LabOrderCommentModel).delete()
        audits_deleted = db.query(LabAuditTrailModel).delete()
        notifs_deleted = db.query(LabNotificationModel).delete()
        
        try:
            db.query(ProstheticCaseDetailModel).delete()
        except Exception:
            pass
        try:
            db.query(PathologyCaseDetailModel).delete()
        except Exception:
            pass

        try:
            db.execute(text("UPDATE clinical_encounters SET lab_case_id = NULL WHERE lab_case_id IS NOT NULL;"))
        except Exception:
            pass

        try:
            db.execute(text("UPDATE treatment_plan_steps SET lab_case_id = NULL WHERE lab_case_id IS NOT NULL;"))
        except Exception:
            pass

        orders_deleted = db.query(LabOrderModel).delete()
        db.commit()

        return {
            "status": "success",
            "message": f"Successfully deleted all lab data. Orders deleted: {orders_deleted}, Comments: {comments_deleted}, Audit trails: {audits_deleted}, Notifications: {notifs_deleted}."
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to clear lab data: {str(e)}")

# ─────────────────────────────────────────────────────────────────────────────
# WORKFLOW: Email-Based Completion Parsing & Proposals
# ─────────────────────────────────────────────────────────────────────────────

def parse_completion_email_text(raw_text: str):
    """
    Fault-tolerant parser for external lab completion email replies.
    Handles multi-line, single-line, HTML, and collapsed email bodies.
    Extracts: case_id, status, courier_name, tracking_number, expected_delivery_date, remarks.
    """
    extracted = {
        "case_id": None,
        "status": None,
        "courier_name": None,
        "tracking_number": None,
        "expected_delivery_date": None,
        "remarks": None,
        "is_rework": False
    }

    if not raw_text:
        return extracted

    # Clean text: replace <br> with newlines, strip HTML tags if present
    clean_text = re.sub(r'<br\s*/?>', '\n', raw_text, flags=re.IGNORECASE)
    clean_text = re.sub(r'</?(?:div|p|span)[^>]*>', '\n', clean_text, flags=re.IGNORECASE)

    # 1. Match Case ID / Case Number (e.g., CASE-2026-649)
    case_match = re.search(r'(?:Case\s*Number|Case\s*ID|Case\s*#|Case)[\s:]*([A-Z0-9-]+)', clean_text, re.IGNORECASE)
    if not case_match:
        case_match = re.search(r'(CASE-\d{4}-\d+)', clean_text, re.IGNORECASE)
    if case_match:
        extracted["case_id"] = case_match.group(1).strip().upper()

    # 2. Match Status
    status_match = re.search(r'(?:Status)[\s:]*([\s\S]*?)(?=\s*(?:Courier|Tracking|Expected|Delivery|Remarks|Notes|\n\n|\r\n\r\n|$))', clean_text, re.IGNORECASE)
    if status_match:
        st_val = status_match.group(1).strip().upper()
        if "REWORK" in st_val:
            extracted["status"] = "Rework Completed"
            extracted["is_rework"] = True
        else:
            extracted["status"] = "Completed by External Lab"
    else:
        if "REWORK" in clean_text.upper():
            extracted["status"] = "Rework Completed"
            extracted["is_rework"] = True
        elif "COMPLETED" in clean_text.upper():
            extracted["status"] = "Completed by External Lab"

    # 3. Match Courier
    courier_match = re.search(r'(?:Courier|Courier\s*Name|Carrier)[\s:]*([\s\S]*?)(?=\s*(?:Tracking|Expected|Delivery|Remarks|Notes|Status|\n\n|\r\n\r\n|$))', clean_text, re.IGNORECASE)
    if courier_match:
        val = courier_match.group(1).strip()
        val = re.split(r'\r|\n|On\s+\w+,|From:', val)[0].strip()
        extracted["courier_name"] = val

    # 4. Match Tracking Number
    tracking_match = re.search(r'(?:Tracking\s*Number|Tracking\s*#|Tracking|AWB)[\s:]*([\s\S]*?)(?=\s*(?:Expected|Delivery|Remarks|Notes|Status|Courier|\n\n|\r\n\r\n|$))', clean_text, re.IGNORECASE)
    if tracking_match:
        val = tracking_match.group(1).strip()
        val = re.split(r'\r|\n|On\s+\w+,|From:', val)[0].strip()
        extracted["tracking_number"] = val

    # 5. Match Expected Delivery Date
    delivery_match = re.search(r'(?:Expected\s*Delivery|Delivery\s*Date|ETA|Due\s*Date)[\s:]*([\s\S]*?)(?=\s*(?:Remarks|Notes|Comments|Status|Courier|Tracking|\n\n|\r\n\r\n|$))', clean_text, re.IGNORECASE)
    if delivery_match:
        val = delivery_match.group(1).strip()
        val = re.split(r'\r|\n|On\s+\w+,|From:', val)[0].strip()
        extracted["expected_delivery_date"] = val

    # 6. Match Remarks / Notes
    remarks_match = re.search(r'(?:Remarks|Notes|Comments)[\s:]*([\s\S]*?)(?=\s*(?:On\s+\w+,|From:|Sent:|<a\s+|\n\n|\r\n\r\n|$))', clean_text, re.IGNORECASE)
    if remarks_match:
        val = remarks_match.group(1).strip()
        val = re.split(r'\r|\n|On\s+\w+,|From:', val)[0].strip()
        extracted["remarks"] = val

    return extracted


def process_completion_email_text(raw_text: str, sender_email: str = None, subject: str = None, db: Session = None):
    """
    Core business logic for parsing and registering completion emails.
    Called both by IMAP background listener and process-completion-email HTTP endpoint.
    """
    extracted = parse_completion_email_text(raw_text)

    case_id = extracted.get("case_id")
    order = None
    if case_id and db:
        order = db.query(LabOrderModel).filter(LabOrderModel.id == case_id).first()

    if order and db:
        proposed_st = extracted.get("status") or ("Rework Completed" if order.status in ["Rework Sent to Lab", "Rework In Progress"] else "Completed by External Lab")
        
        proposal = {
            "case_id": order.id,
            "proposed_status": proposed_st,
            "courier_name": extracted.get("courier_name"),
            "tracking_number": extracted.get("tracking_number"),
            "expected_delivery_date": extracted.get("expected_delivery_date"),
            "remarks": extracted.get("remarks"),
            "raw_text": raw_text,
            "sender_email": sender_email or "external-lab@dentalvendor.com",
            "received_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M")
        }
        order.pending_email_proposal = proposal

        notif = LabNotificationModel(
            recipient_role="lab tech",
            type="Orders",
            title=f"📩 New Completion Email Received – Case {order.id}",
            desc=f"Patient: {order.patient_name or 'Walk-in'} | Courier: {extracted.get('courier_name') or 'N/A'} | Tracking: {extracted.get('tracking_number') or 'N/A'} | Expected: {extracted.get('expected_delivery_date') or 'N/A'}",
            read=False
        )
        db.add(notif)
        db.commit()
        db.refresh(order)
        return {
            "status": "matched",
            "message": f"Completion email matched to Case #{order.id} and sent for Lab Tech confirmation.",
            "order": serialize_order(order)
        }
    else:
        if db:
            unmatched = UnmatchedLabEmailModel(
                sender_email=sender_email or "external-lab@dentalvendor.com",
                subject=subject or "Lab Case Completion Reply",
                raw_body=raw_text,
                extracted_data=extracted,
                status="Unmatched"
            )
            db.add(unmatched)

            notif = LabNotificationModel(
                recipient_role="lab tech",
                type="Orders",
                title="⚠️ Unmatched External Lab Email Received",
                desc=f"An external lab completion email could not be automatically matched to a case ID. Sender: {sender_email or 'Vendor'}",
                read=False
            )
            db.add(notif)
            db.commit()
            db.refresh(unmatched)
            return {
                "status": "unmatched",
                "message": "Case ID could not be matched. Email added to Unmatched External Lab Emails queue.",
                "unmatched_id": unmatched.id,
                "extracted": extracted
            }
        return {
            "status": "unmatched",
            "extracted": extracted
        }


@router.post("/orders/process-completion-email")
def process_completion_email(
    payload: ProcessCompletionEmailCreate,
    db: Session = Depends(get_db)
):
    """
    Monitors / processes completion email reply from external lab via HTTP.
    """
    return process_completion_email_text(
        raw_text=payload.raw_email_text,
        sender_email=payload.sender_email,
        subject=payload.subject,
        db=db
    )


@router.post("/orders/{order_id}/confirm-completion-email", response_model=LabOrderResponse)
def confirm_completion_email_proposal(
    order_id: str,
    payload: ConfirmCompletionEmailCreate = ConfirmCompletionEmailCreate(),
    db: Session = Depends(get_db),
    current_user: Optional[dict] = Depends(get_optional_current_user)
):
    """
    Lab technician reviews and confirms extracted email details.
    Updates order status to Completed by External Lab (or Rework Completed).
    """
    order = db.query(LabOrderModel).filter(LabOrderModel.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Lab order not found")

    tech_name = (current_user.get("name") if isinstance(current_user, dict) else None) or "Lab Technician"
    proposal = order.pending_email_proposal or {}
    
    proposed_st = proposal.get("proposed_status") or "Completed by External Lab"
    is_rework = proposed_st == "Rework Completed" or order.status in ["Rework Sent to Lab", "Rework In Progress"]
    final_status = "Rework Completed" if is_rework else "Completed by External Lab"

    order.status = final_status

    if payload.courier_name:
        order.courier_name = payload.courier_name
    elif proposal.get("courier_name"):
        order.courier_name = proposal.get("courier_name")

    if payload.tracking_number:
        order.tracking_number = payload.tracking_number
    elif proposal.get("tracking_number"):
        order.tracking_number = proposal.get("tracking_number")

    if payload.expected_delivery_date:
        order.expected_return_date = payload.expected_delivery_date
    elif proposal.get("expected_delivery_date"):
        order.expected_return_date = proposal.get("expected_delivery_date")

    remarks_val = payload.remarks or proposal.get("remarks")
    if remarks_val:
        order.tech_notes = (order.tech_notes or "") + f"\n[Lab Email Remarks]: {remarks_val}"

    # Clear pending proposal
    order.pending_email_proposal = None

    audit = LabAuditTrailModel(
        order_id=order.id,
        user_name=tech_name,
        action=f"Completion Confirmed ({final_status})",
        note=f"Courier: {order.courier_name} | Tracking: {order.tracking_number} | Expected: {order.expected_return_date}"
    )
    db.add(audit)
    db.commit()
    db.refresh(order)
    return serialize_order(order)


@router.post("/orders/{order_id}/dismiss-completion-email", response_model=LabOrderResponse)
def dismiss_completion_email_proposal(order_id: str, db: Session = Depends(get_db)):
    order = db.query(LabOrderModel).filter(LabOrderModel.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Lab order not found")
    order.pending_email_proposal = None
    db.commit()
    db.refresh(order)
    return serialize_order(order)


@router.get("/unmatched-emails", response_model=List[UnmatchedEmailResponse])
def get_unmatched_lab_emails(db: Session = Depends(get_db)):
    """Retrieves unmatched external lab emails for technician manual review."""
    return db.query(UnmatchedLabEmailModel).filter(UnmatchedLabEmailModel.status == "Unmatched").order_by(UnmatchedLabEmailModel.created_at.desc()).all()


@router.post("/unmatched-emails/{email_id}/assign/{order_id}")
def assign_unmatched_email(email_id: int, order_id: str, db: Session = Depends(get_db)):
    """Assigns an unmatched completion email to a specific case ID."""
    unmatched = db.query(UnmatchedLabEmailModel).filter(UnmatchedLabEmailModel.id == email_id).first()
    if not unmatched:
        raise HTTPException(status_code=404, detail="Unmatched email record not found")
    order = db.query(LabOrderModel).filter(LabOrderModel.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Lab order not found")

    extracted = unmatched.extracted_data or parse_completion_email_text(unmatched.raw_body)
    proposal = {
        "case_id": order.id,
        "proposed_status": "Rework Completed" if order.status in ["Rework Sent to Lab", "Rework In Progress"] else "Completed by External Lab",
        "courier_name": extracted.get("courier_name"),
        "tracking_number": extracted.get("tracking_number"),
        "expected_delivery_date": extracted.get("expected_delivery_date"),
        "remarks": extracted.get("remarks"),
        "raw_text": unmatched.raw_body,
        "sender_email": unmatched.sender_email,
        "received_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M")
    }
    order.pending_email_proposal = proposal
    unmatched.status = "Assigned"
    db.commit()
    return {"message": f"Email #{email_id} assigned to Case #{order_id}."}


@router.delete("/unmatched-emails/{email_id}")
def dismiss_unmatched_email(email_id: int, db: Session = Depends(get_db)):
    unmatched = db.query(UnmatchedLabEmailModel).filter(UnmatchedLabEmailModel.id == email_id).first()
    if not unmatched:
        raise HTTPException(status_code=404, detail="Unmatched email record not found")
    unmatched.status = "Dismissed"
    db.commit()
    return {"message": f"Unmatched email #{email_id} dismissed."}


# ─────────────────────────────────────────────────────────────────────────────
# WORKFLOW: External lab accepts/rejects a Rework Request
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/external-respond/{token}/accept-rework", response_model=LabOrderResponse)
def external_lab_accept_rework(token: str, db: Session = Depends(get_db)):
    order = db.query(LabOrderModel).filter(LabOrderModel.external_token == token).first()
    if not order or getattr(order, "external_token_active", True) is False:
        raise HTTPException(status_code=404, detail="This rework link is no longer active.")

    order.status = "Rework In Progress"
    order.rework_status = "Accepted"

    audit = LabAuditTrailModel(
        order_id=order.id,
        user_name="External Laboratory",
        action="Rework Accepted by External Lab",
        note="External lab accepted the rework request and is now fabricating."
    )
    db.add(audit)

    notif = LabNotificationModel(
        recipient_role="lab tech",
        type="Orders",
        title=f"Rework Accepted – Case {order.id}",
        desc=f"External lab accepted the rework for patient {order.patient_name or 'Walk-in'}. Status: Rework In Progress.",
        read=False
    )
    db.add(notif)
    db.commit()
    db.refresh(order)
    return serialize_order(order)


@router.post("/external-respond/{token}/reject-rework", response_model=LabOrderResponse)
def external_lab_reject_rework(
    token: str,
    payload: ExternalReworkResponseCreate = ExternalReworkResponseCreate(),
    db: Session = Depends(get_db)
):
    order = db.query(LabOrderModel).filter(LabOrderModel.external_token == token).first()
    if not order or getattr(order, "external_token_active", True) is False:
        raise HTTPException(status_code=404, detail="This rework link is no longer active.")

    reason = payload.rejection_reason or "No reason provided by external lab."
    order.status = "Rework Rejected"
    order.rework_status = "Rejected"
    order.rejection_reason = reason

    audit = LabAuditTrailModel(
        order_id=order.id,
        user_name="External Laboratory",
        action="Rework Rejected by External Lab",
        note=f"Rejection Reason: {reason}"
    )
    db.add(audit)

    notif = LabNotificationModel(
        recipient_role="lab tech",
        type="Orders",
        title=f"Rework Rejected – Case {order.id}",
        desc=f"External lab rejected the rework for patient {order.patient_name or 'Walk-in'}. Reason: {reason}",
        read=False
    )
    db.add(notif)
    db.commit()
    db.refresh(order)
    return serialize_order(order)


# ─────────────────────────────────────────────────────────────────────────────
# WORKFLOW: Doctor Approve or Request Rework
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/orders/{order_id}/doctor-approve", response_model=LabOrderResponse)
def doctor_approve_restoration(
    order_id: str,
    payload: DoctorApproveCreate = DoctorApproveCreate(),
    db: Session = Depends(get_db),
    current_user: Optional[dict] = Depends(get_optional_current_user)
):
    """Doctor approves restoration. Status → Completed."""
    order = db.query(LabOrderModel).filter(LabOrderModel.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Lab order not found.")

    doc_name = (current_user.get("name") if isinstance(current_user, dict) else None) or "Doctor"
    order.status = "Completed"

    audit = LabAuditTrailModel(
        order_id=order.id,
        user_name=doc_name,
        action="Restoration Approved – Case Completed",
        note=payload.notes or "Doctor reviewed and approved the restoration. Case is now closed."
    )
    db.add(audit)

    notif_tech = LabNotificationModel(
        recipient_role="lab tech",
        type="Orders",
        title=f"Case {order.id} Completed",
        desc=f"Dr. {doc_name} approved the restoration for patient {order.patient_name or 'Walk-in'}. Case closed.",
        read=False
    )
    db.add(notif_tech)
    db.commit()
    db.refresh(order)
    return serialize_order(order)


@router.post("/orders/{order_id}/doctor-request-rework", response_model=LabOrderResponse)
def doctor_request_rework(
    order_id: str,
    payload: DoctorReworkRequestCreate,
    db: Session = Depends(get_db),
    current_user: Optional[dict] = Depends(get_optional_current_user)
):
    """Doctor requests rework. Status → Doctor Requested Rework."""
    order = db.query(LabOrderModel).filter(LabOrderModel.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Lab order not found.")

    doc_name = (current_user.get("name") if isinstance(current_user, dict) else None) or "Doctor"
    order.status = "Doctor Requested Rework"
    order.rework_reason = payload.reason
    order.rework_notes = payload.notes
    order.rework_status = "Pending Dispatch"
    order.rework_count = (order.rework_count or 0) + 1

    # Append to rework history
    history = list(order.rework_history or [])
    history.append({
        "date": datetime.utcnow().isoformat(),
        "requested_by": doc_name,
        "reason": payload.reason,
        "notes": payload.notes,
        "attachments": payload.attachments or []
    })
    order.rework_history = history
    order.rework_attachments = payload.attachments or []

    audit = LabAuditTrailModel(
        order_id=order.id,
        user_name=doc_name,
        action=f"Rework Requested (Round {order.rework_count})",
        note=f"Reason: {payload.reason}"
    )
    db.add(audit)

    notif_tech = LabNotificationModel(
        recipient_role="lab tech",
        type="Orders",
        title=f"New Rework Request – Case {order.id}",
        desc=f"Dr. {doc_name} requested rework for patient {order.patient_name or 'Walk-in'}. Reason: {payload.reason}",
        read=False
    )
    db.add(notif_tech)
    db.commit()
    db.refresh(order)
    return serialize_order(order)


# ─────────────────────────────────────────────────────────────────────────────
# WORKFLOW: Lab Technician sends Rework to same External Vendor
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/orders/{order_id}/send-rework-external", response_model=LabOrderResponse)
def send_rework_to_external_lab(
    order_id: str,
    payload: SendReworkToExternalLabCreate = SendReworkToExternalLabCreate(),
    db: Session = Depends(get_db),
    current_user: Optional[dict] = Depends(get_optional_current_user)
):
    """Lab technician sends rework request to the same external vendor."""
    order = db.query(LabOrderModel).options(
        joinedload(LabOrderModel.prosthetic_detail),
        joinedload(LabOrderModel.pathology_detail)
    ).filter(LabOrderModel.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Lab order not found.")

    # Invalidate any old token and generate a new one for rework
    token = secrets.token_urlsafe(32)
    order.external_token = token
    order.external_token_active = True
    order.external_token_created_at = datetime.utcnow()
    order.status = "Rework Sent to Lab"
    order.rework_status = "Awaiting Response"

    # Determine vendor email
    vendor_email = payload.vendor_email
    vendor_name = None
    if not vendor_email and order.vendor_id:
        vendor = db.query(LabVendorModel).filter(LabVendorModel.id == order.vendor_id).first()
        if vendor:
            vendor_email = vendor.email
            vendor_name = vendor.name
    if not vendor_email:
        vendor_email = "external-lab@dentalvendor.com"

    base_url = get_app_base_url()
    accept_url = f"{base_url}/external-lab/respond/{token}?action=accept-rework"
    reject_url = f"{base_url}/external-lab/respond/{token}?action=reject-rework"

    rework_reason = order.rework_reason or "Doctor requested rework."
    rework_notes = order.rework_notes or ""
    additional = payload.additional_notes or ""

    html_content = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Rework Request – SmileCare</title></head>
<body style="font-family:'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:24px;color:#1e293b;">
  <table style="width:100%;max-width:600px;margin:0 auto;background:#fff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;">
    <tr><td style="background:#7c3aed;padding:28px;text-align:center;">
      <h1 style="color:#fff;font-size:22px;margin:0;">SmileCare – Rework Request</h1>
      <p style="color:#ddd6fe;font-size:13px;margin:6px 0 0;">Round {order.rework_count} | Case {order.id}</p>
    </td></tr>
    <tr><td style="padding:28px;">
      <p style="color:#334155;font-size:14px;">Dear {vendor_name or 'External Laboratory'},</p>
      <p style="color:#334155;font-size:14px;">The doctor has reviewed the restoration for <strong>{order.patient_name or 'the patient'}</strong> and requires rework before it can be fitted.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:8px 0;color:#64748b;font-weight:600;width:38%;">Case Number:</td><td style="padding:8px 0;font-weight:700;">{order.id}</td></tr>
        <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:8px 0;color:#64748b;font-weight:600;">Patient:</td><td style="padding:8px 0;">{order.patient_name or 'Walk-in Patient'}</td></tr>
        <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:8px 0;color:#64748b;font-weight:600;">Procedure:</td><td style="padding:8px 0;">{order.prosthetic_type or order.order_category or 'N/A'}</td></tr>
        <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:8px 0;color:#ef4444;font-weight:600;">Reason for Rework:</td><td style="padding:8px 0;color:#ef4444;font-weight:700;">{rework_reason}</td></tr>
        {'<tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:8px 0;color:#64748b;font-weight:600;">Clinical Notes:</td><td style="padding:8px 0;">' + rework_notes + '</td></tr>' if rework_notes else ''}
        {'<tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:8px 0;color:#64748b;font-weight:600;">Additional Notes:</td><td style="padding:8px 0;">' + additional + '</td></tr>' if additional else ''}
      </table>
      <p style="color:#334155;font-size:14px;margin:20px 0 8px;">Please confirm if you can accept this rework:</p>
      <table style="width:100%;"><tr>
        <td style="width:50%;padding-right:8px;">
          <a href="{accept_url}" style="display:block;text-align:center;background:#16a34a;color:#fff;padding:14px 20px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">Accept Rework</a>
        </td>
        <td style="width:50%;padding-left:8px;">
          <a href="{reject_url}" style="display:block;text-align:center;background:#dc2626;color:#fff;padding:14px 20px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">Reject Rework</a>
        </td>
      </tr></table>
      <!-- CASE COMPLETION INSTRUCTIONS FOR REWORK EMAIL REPLIES -->
      <div style="margin-top:24px; padding:20px; background-color:#f8fafc; border:1px dashed #cbd5e1; border-radius:12px; font-size:13px; color:#1e293b; line-height:1.5;">
        <h4 style="font-size:14px; font-weight:800; color:#0f172a; margin:0 0 8px 0; text-transform:uppercase; letter-spacing:0.5px;">Case Completion Instructions</h4>
        <p style="margin:0 0 12px 0; color:#475569;">When the rework restoration is completed, please reply to this email using the following format:</p>
        <div style="background-color:#ffffff; border:1px solid #cbd5e1; border-radius:8px; padding:14px; font-family:Consolas, monospace; font-size:12px; color:#0f172a; white-space:pre-wrap;">
Case Number:
{order.id}

Status:
REWORK COMPLETED

Courier:
BlueDart

Tracking Number:
BD4587921

Expected Delivery:
12-Aug-2026

Remarks:
Margin adjusted.</div>
      </div>
    </td></tr>
    <tr><td style="background:#f1f5f9;padding:16px;text-align:center;color:#64748b;font-size:11px;">SmileCare Dental CRM – Automated Lab Communication</td></tr>
  </table>
</body>
</html>"""

    print(f"\n[REWORK EMAIL] To: {vendor_email} | Case: {order.id} | Round: {order.rework_count}", flush=True)
    send_smtp_email(vendor_email, f"Rework Request – Case {order.id} (Round {order.rework_count})", html_content)

    tech_name = (current_user.get("name") if isinstance(current_user, dict) else None) or "Lab Technician"
    audit = LabAuditTrailModel(
        order_id=order.id,
        user_name=tech_name,
        action=f"Rework Dispatched to External Lab (Round {order.rework_count})",
        note=f"Sent rework email to {vendor_email}. New token issued."
    )
    db.add(audit)
    db.commit()
    db.refresh(order)
    return serialize_order(order)


# ─────────────────────────────────────────────────────────────────────────────
# WORKFLOW: Receptionist schedules fitting appointment
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/orders/{order_id}/schedule-fitting", response_model=LabOrderResponse)
def schedule_fitting_appointment(
    order_id: str,
    payload: ScheduleFittingCreate,
    db: Session = Depends(get_db),
    current_user: Optional[dict] = Depends(get_optional_current_user)
):
    """Receptionist schedules a fitting appointment. Status → Awaiting Doctor Review."""
    order = db.query(LabOrderModel).filter(LabOrderModel.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Lab order not found.")

    rec_name = (current_user.get("name") if isinstance(current_user, dict) else None) or "Receptionist"
    order.status = "Awaiting Doctor Review"
    order.appointment_scheduled = True

    appt_detail = f"{payload.appointment_date}" + (f" at {payload.appointment_time}" if payload.appointment_time else "")

    # Store as latest communication log entry
    logs = list(order.communication_logs or [])
    logs.append({
        "type": "Appointment Scheduled",
        "notes": f"Fitting appointment scheduled: {appt_detail}. {payload.notes or ''}".strip(),
        "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M"),
        "by": rec_name
    })
    order.communication_logs = logs

    audit = LabAuditTrailModel(
        order_id=order.id,
        user_name=rec_name,
        action="Fitting Appointment Scheduled",
        note=f"Appointment: {appt_detail}"
    )
    db.add(audit)

    notif_doc = LabNotificationModel(
        recipient_role="doctor",
        type="labs",
        title=f"Fitting Appointment Scheduled – Case {order.id}",
        desc=f"Patient {order.patient_name or 'Walk-in'} is scheduled on {appt_detail}. Please review the restoration.",
        read=False
    )
    db.add(notif_doc)
    db.commit()
    db.refresh(order)
    return serialize_order(order)


# ─────────────────────────────────────────────────────────────────────────────
# WORKFLOW: Get Vendor Pricing Catalog for auto-population
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/vendors/{vendor_id}/catalog")
def get_vendor_pricing_catalog(vendor_id: int, db: Session = Depends(get_db)):
    """Returns the pricing catalog for a given vendor."""
    vendor = db.query(LabVendorModel).filter(LabVendorModel.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found.")
    return {
        "vendor_id": vendor.id,
        "vendor_name": vendor.name,
        "pricing_list": vendor.pricing_list or []
    }


# ─────────────────────────────────────────────────────────────────────────────
# ADMIN CONTRACT PRICING CATALOG & FINANCIAL REPORTING ENDPOINTS
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/admin/pricing", response_model=List[LabVendorPricingResponse])
def get_admin_lab_pricing_catalog(
    vendor_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Fetch contract pricing catalog rules for external lab vendors."""
    query = db.query(LabVendorPricingModel).filter(LabVendorPricingModel.is_active == True)
    if vendor_id:
        query = query.filter(LabVendorPricingModel.vendor_id == vendor_id)
    
    rules = query.order_by(LabVendorPricingModel.id.desc()).all()
    results = []
    for r in rules:
        v_name = r.vendor.name if r.vendor else f"Vendor #{r.vendor_id}"
        margin_pct = ((r.patient_charge - r.supplier_cost) / r.patient_charge * 100.0) if r.patient_charge > 0 else 0.0
        results.append({
            "id": r.id,
            "vendor_id": r.vendor_id,
            "vendor_name": v_name,
            "restoration_type": r.restoration_type,
            "material": r.material or "All Materials",
            "supplier_cost": r.supplier_cost,
            "patient_charge": r.patient_charge,
            "gross_profit": r.patient_charge - r.supplier_cost,
            "margin_percentage": round(margin_pct, 1),
            "is_active": r.is_active,
            "created_at": r.created_at
        })
    return results


@router.post("/admin/pricing", response_model=LabVendorPricingResponse)
def save_admin_lab_pricing_rule(
    payload: LabVendorPricingCreate,
    db: Session = Depends(get_db)
):
    """Admin configures or updates contract pricing rule for external lab."""
    vendor = db.query(LabVendorModel).filter(LabVendorModel.id == payload.vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="External lab vendor not found.")

    gross_profit = float(payload.patient_charge - payload.supplier_cost)

    # Check for existing rule for same vendor & restoration_type
    existing = db.query(LabVendorPricingModel).filter(
        LabVendorPricingModel.vendor_id == payload.vendor_id,
        func.lower(LabVendorPricingModel.restoration_type) == payload.restoration_type.strip().lower(),
        LabVendorPricingModel.is_active == True
    ).first()

    if existing:
        existing.material = payload.material
        existing.supplier_cost = float(payload.supplier_cost)
        existing.patient_charge = float(payload.patient_charge)
        existing.gross_profit = gross_profit
        rule = existing
    else:
        rule = LabVendorPricingModel(
            vendor_id=payload.vendor_id,
            restoration_type=payload.restoration_type.strip(),
            material=payload.material,
            supplier_cost=float(payload.supplier_cost),
            patient_charge=float(payload.patient_charge),
            gross_profit=gross_profit,
            is_active=True
        )
        db.add(rule)

    db.commit()
    db.refresh(rule)

    margin_pct = ((rule.patient_charge - rule.supplier_cost) / rule.patient_charge * 100.0) if rule.patient_charge > 0 else 0.0
    return {
        "id": rule.id,
        "vendor_id": rule.vendor_id,
        "vendor_name": vendor.name,
        "restoration_type": rule.restoration_type,
        "material": rule.material or "All Materials",
        "supplier_cost": rule.supplier_cost,
        "patient_charge": rule.patient_charge,
        "gross_profit": rule.gross_profit,
        "margin_percentage": round(margin_pct, 1),
        "is_active": rule.is_active,
        "created_at": rule.created_at
    }


@router.delete("/admin/pricing/{pricing_id}")
def delete_admin_lab_pricing_rule(pricing_id: int, db: Session = Depends(get_db)):
    """Deletes or deactivates a contract pricing rule."""
    rule = db.query(LabVendorPricingModel).filter(LabVendorPricingModel.id == pricing_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Pricing rule not found.")
    
    rule.is_active = False
    db.commit()
    return {"status": "success", "message": f"Pricing rule #{pricing_id} deactivated."}


@router.get("/vendors/{vendor_id}/pricing-check")
def check_vendor_pricing_configured(
    vendor_id: int,
    restoration_type: str,
    material: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Pre-check if contract pricing is configured before sending case."""
    rule = lookup_vendor_contract_pricing(db, vendor_id, restoration_type, material)
    if not rule:
        vendor = db.query(LabVendorModel).filter(LabVendorModel.id == vendor_id).first()
        v_name = vendor.name if vendor else f"Vendor #{vendor_id}"
        return {
            "configured": False,
            "message": f"Pricing configuration missing: Admin must configure contract pricing for vendor '{v_name}' and restoration '{restoration_type}' before proceeding."
        }
    
    margin_pct = ((rule.patient_charge - rule.supplier_cost) / rule.patient_charge * 100.0) if rule.patient_charge > 0 else 0.0
    return {
        "configured": True,
        "supplier_cost": rule.supplier_cost,
        "patient_charge": rule.patient_charge,
        "gross_profit": rule.gross_profit,
        "margin_percentage": round(margin_pct, 1)
    }


@router.get("/admin/financial-reports")
def get_admin_lab_financial_report(db: Session = Depends(get_db)):
    """Comprehensive Admin Financial Report for External Lab Orders."""
    orders = db.query(LabOrderModel).filter(
        LabOrderModel.vendor_id.isnot(None),
        LabOrderModel.supplier_cost.isnot(None)
    ).all()

    total_orders = len(orders)
    total_supplier_cost = sum(o.supplier_cost or 0.0 for o in orders)
    total_patient_billing = sum(o.patient_charge or 0.0 for o in orders)
    total_gross_profit = total_patient_billing - total_supplier_cost
    margin_pct = (total_gross_profit / total_patient_billing * 100.0) if total_patient_billing > 0 else 0.0

    # Group by Vendor
    vendors = db.query(LabVendorModel).all()
    vendor_map = {v.id: v.name for v in vendors}
    
    vendor_stats = {}
    for o in orders:
        v_id = o.vendor_id or 0
        v_name = vendor_map.get(v_id) or o.lab_name or f"Vendor #{v_id}"
        if v_name not in vendor_stats:
            vendor_stats[v_name] = {"vendor_name": v_name, "count": 0, "supplier_cost": 0.0, "patient_billing": 0.0, "gross_profit": 0.0}
        
        vendor_stats[v_name]["count"] += 1
        vendor_stats[v_name]["supplier_cost"] += (o.supplier_cost or 0.0)
        vendor_stats[v_name]["patient_billing"] += (o.patient_charge or 0.0)
        vendor_stats[v_name]["gross_profit"] += (o.gross_profit or (o.patient_charge or 0.0) - (o.supplier_cost or 0.0))

    breakdown_by_vendor = []
    for v_name, st in vendor_stats.items():
        v_margin = (st["gross_profit"] / st["patient_billing"] * 100.0) if st["patient_billing"] > 0 else 0.0
        st["profit_margin"] = round(v_margin, 1)
        breakdown_by_vendor.append(st)

    # Group by Restoration Type
    restoration_stats = {}
    for o in orders:
        rtype = o.prosthetic_type or o.fabrication_type or o.order_category or "Restoration"
        if rtype not in restoration_stats:
            restoration_stats[rtype] = {"restoration_type": rtype, "count": 0, "supplier_cost": 0.0, "patient_billing": 0.0, "gross_profit": 0.0}
        
        restoration_stats[rtype]["count"] += 1
        restoration_stats[rtype]["supplier_cost"] += (o.supplier_cost or 0.0)
        restoration_stats[rtype]["patient_billing"] += (o.patient_charge or 0.0)
        restoration_stats[rtype]["gross_profit"] += (o.gross_profit or (o.patient_charge or 0.0) - (o.supplier_cost or 0.0))

    breakdown_by_restoration = []
    for rtype, st in restoration_stats.items():
        r_margin = (st["gross_profit"] / st["patient_billing"] * 100.0) if st["patient_billing"] > 0 else 0.0
        st["profit_margin"] = round(r_margin, 1)
        breakdown_by_restoration.append(st)

    return {
        "total_orders": total_orders,
        "total_supplier_cost": round(total_supplier_cost, 2),
        "total_patient_billing": round(total_patient_billing, 2),
        "total_gross_profit": round(total_gross_profit, 2),
        "profit_margin_percentage": round(margin_pct, 1),
        "breakdown_by_vendor": breakdown_by_vendor,
        "breakdown_by_restoration": breakdown_by_restoration
    }


# ─────────────────────────────────────────────────────────────────────────────
# AUTHORITATIVE WORKFLOW API ENDPOINTS
# ─────────────────────────────────────────────────────────────────────────────

from modules.lab.models import SupplierPayableModel, FittingAppointmentModel
from modules.lab.schemas import (
    DoctorFlagCreate,
    DoctorResubmitCreate,
    FittingAppointmentCreate,
    DoctorFittingOutcomeCreate,
    SupplierPayableCreate,
    SupplierPayablePayCreate,
    SupplierPayableResponse
)

@router.post("/orders/{order_id}/flag-doctor", response_model=LabOrderResponse)
def flag_doctor_for_order(
    order_id: str,
    payload: DoctorFlagCreate,
    db: Session = Depends(get_db)
):
    """Lab Technician flags doctor for missing information or issues."""
    order = db.query(LabOrderModel).filter(LabOrderModel.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Lab order not found")

    order.status = "Flagged by Lab"
    order.rejection_reason = payload.reason
    if payload.notes:
        order.notes = f"{order.notes or ''}\n[FLAG NOTES]: {payload.notes}".strip()

    # Create notification for Doctor
    notif = LabNotificationModel(
        title=f"🚩 Case #{order.id} Flagged by Lab",
        desc=f"Reason: {payload.reason}",
        order_id=order.id
    )
    db.add(notif)

    # Audit Trail
    audit = LabAuditTrailModel(
        order_id=order.id,
        action="Flagged by Lab",
        user_name="Lab Technician",
        notes=f"Flagged Doctor. Reason: {payload.reason}"
    )
    db.add(audit)

    db.commit()
    db.refresh(order)
    return serialize_order(order)


@router.post("/orders/{order_id}/doctor-resubmit", response_model=LabOrderResponse)
def doctor_resubmit_order(
    order_id: str,
    payload: DoctorResubmitCreate,
    db: Session = Depends(get_db)
):
    """Doctor corrects flagged issues and resubmits the lab order."""
    order = db.query(LabOrderModel).filter(LabOrderModel.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Lab order not found")

    order.status = "Resubmitted by Doctor"
    if payload.notes:
        order.notes = f"{order.notes or ''}\n[RESUBMIT NOTES]: {payload.notes}".strip()
    if payload.attachments:
        order.attachments = payload.attachments

    # Audit Trail
    audit = LabAuditTrailModel(
        order_id=order.id,
        action="Resubmitted by Doctor",
        user_name="Doctor",
        notes="Corrected flagged issues and resubmitted."
    )
    db.add(audit)

    db.commit()
    db.refresh(order)
    return serialize_order(order)


@router.post("/orders/{order_id}/schedule-fitting", response_model=LabOrderResponse)
def schedule_restoration_fitting_appointment(
    order_id: str,
    payload: FittingAppointmentCreate,
    db: Session = Depends(get_db)
):
    """Receptionist schedules Restoration Fitting appointment."""
    order = db.query(LabOrderModel).filter(LabOrderModel.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Lab order not found")

    order.status = "Fitting Scheduled"

    fitting = FittingAppointmentModel(
        lab_case_id=order.id,
        patient_token=order.patient_token,
        patient_name=order.patient_name,
        doctor_name=payload.doctor_name or order.dentist_name or "Doctor",
        appointment_date=payload.appointment_date,
        appointment_time=payload.appointment_time,
        chair_number=payload.chair_number,
        notes=payload.notes,
        status="Scheduled"
    )
    db.add(fitting)

    audit = LabAuditTrailModel(
        order_id=order.id,
        action="Fitting Scheduled",
        user_name="Receptionist",
        notes=f"Scheduled fitting on {payload.appointment_date} at {payload.appointment_time or 'TBD'} ({payload.chair_number or 'Chair 1'})."
    )
    db.add(audit)

    db.commit()
    db.refresh(order)
    return serialize_order(order)


@router.post("/orders/{order_id}/fitting-outcome", response_model=LabOrderResponse)
def doctor_fitting_outcome(
    order_id: str,
    payload: DoctorFittingOutcomeCreate,
    db: Session = Depends(get_db)
):
    """
    Doctor performs fitting:
    - 'Fit Successful': Status -> 'Completed', releases billing draft to Accountant.
    - 'Requires Lab Adjustment': Status -> 'Rework Requested' (mandatory reason).
    """
    order = db.query(LabOrderModel).filter(LabOrderModel.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Lab order not found")

    if payload.outcome == "Fit Successful":
        order.status = "Completed"
        audit_action = "Fit Successful -> Completed"
        
        # Release patient billing draft for Accountant
        order.accountant_notified = True
        order.accountant_bill_status = "Pending Accountant Review"

        notif = LabNotificationModel(
            title=f"✅ Case #{order.id} Fit Successful",
            desc=f"Fitting completed successfully for {order.patient_name}. Patient billing released to Accountant.",
            order_id=order.id
        )
        db.add(notif)

    elif payload.outcome == "Requires Lab Adjustment":
        if not payload.rework_reason:
            raise HTTPException(status_code=400, detail="Mandatory reason required for lab adjustment/rework.")
        
        order.status = "Rework Requested"
        order.rework_reason = payload.rework_reason
        order.rework_notes = payload.notes
        order.rework_count = (order.rework_count or 0) + 1
        if payload.attachments:
            order.rework_attachments = payload.attachments
        
        audit_action = f"Rework Requested (Reason: {payload.rework_reason})"

        notif = LabNotificationModel(
            title=f"🔄 Rework Requested: Case #{order.id}",
            desc=f"Doctor requested adjustment: {payload.rework_reason}",
            order_id=order.id
        )
        db.add(notif)
    else:
        raise HTTPException(status_code=400, detail="Invalid outcome value. Use 'Fit Successful' or 'Requires Lab Adjustment'.")

    audit = LabAuditTrailModel(
        order_id=order.id,
        action=audit_action,
        user_name="Doctor",
        notes=payload.notes or payload.rework_reason or "Fitting outcome recorded."
    )
    db.add(audit)

    db.commit()
    db.refresh(order)
    return serialize_order(order)


# ─────────────────────────────────────────────────────────────────────────────
# SUPPLIER PAYABLES API ENDPOINTS (ACCOUNTANT & ADMIN)
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/supplier-payables", response_model=List[SupplierPayableResponse])
def get_supplier_payables(
    supplier_type: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Fetch Supplier Payables for External Labs, Medicine Suppliers, and Other Vendors."""
    query = db.query(SupplierPayableModel)
    if supplier_type:
        query = query.filter(SupplierPayableModel.supplier_type == supplier_type)
    if status:
        query = query.filter(SupplierPayableModel.status == status)
    
    return query.order_by(SupplierPayableModel.id.desc()).all()


@router.post("/supplier-payables", response_model=SupplierPayableResponse)
def create_supplier_payable(
    payload: SupplierPayableCreate,
    db: Session = Depends(get_db)
):
    """Create a new Supplier Payable entry."""
    payable = SupplierPayableModel(
        supplier_name=payload.supplier_name,
        supplier_type=payload.supplier_type or "External Lab",
        invoice_number=payload.invoice_number,
        supplier_cost=float(payload.supplier_cost),
        due_date=payload.due_date,
        status="Pending",
        lab_case_id=payload.lab_case_id,
        invoice_file_url=payload.invoice_file_url
    )
    db.add(payable)
    db.commit()
    db.refresh(payable)
    return payable


@router.post("/supplier-payables/{payable_id}/pay", response_model=SupplierPayableResponse)
def mark_supplier_payable_paid(
    payable_id: int,
    payload: SupplierPayablePayCreate,
    db: Session = Depends(get_db)
):
    """Accountant/Admin records payment for a Supplier Payable."""
    payable = db.query(SupplierPayableModel).filter(SupplierPayableModel.id == payable_id).first()
    if not payable:
        raise HTTPException(status_code=404, detail="Supplier payable not found.")

    payable.status = "Paid"
    payable.payment_reference = payload.payment_reference
    payable.payment_date = payload.payment_date or datetime.utcnow().strftime("%Y-%m-%d")
    
    db.commit()
    db.refresh(payable)
    return payable
