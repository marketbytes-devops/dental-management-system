# models.py - database table definitions
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, JSON, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class LabOrderModel(Base):
    __tablename__ = "lab_orders"

    id = Column(String, primary_key=True, index=True)
    patient_token = Column(String, index=True, nullable=False)
    patient_name = Column(String, nullable=True)
    dentist_name = Column(String, nullable=True)
    dentist_contact = Column(String, nullable=True)
    
    # Updated flexible fields
    order_category = Column(String, default="Prosthetic") # Prosthetic, Blood Work, Diagnostic
    order_details = Column(JSON, nullable=True) # {material, shade, test_type, results_notes, etc.}
    result_document_url = Column(String, nullable=True)
    
    # Legacy fields (nullable for backwards compatibility)
    prosthetic_type = Column(String, nullable=True)
    material = Column(String, nullable=True)
    shade = Column(String, nullable=True)
    
    priority = Column(String, default="Medium")
    status = Column(String, default="Awaiting Lab Review")
    notes = Column(String, nullable=True)
    lab_name = Column(String, nullable=True)
    rejection_reason = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # New fields for Case Intake, Rework, Vendor & Tracking
    treatment_plan_step_id = Column(Integer, nullable=True)
    tooth_quadrant = Column(String, nullable=True)
    procedure_code = Column(String, nullable=True)
    margin_design = Column(String, nullable=True)
    impression_type = Column(String, default="Physical")
    attachments = Column(JSON, nullable=True)  # List of objects: [{"name": "", "url": "", "type": ""}]
    parent_order_id = Column(String, nullable=True)
    rejection_category = Column(String, nullable=True)
    is_rework = Column(Boolean, default=False)
    original_case_id = Column(String, nullable=True)
    vendor_id = Column(Integer, nullable=True)
    courier_name = Column(String, nullable=True)
    tracking_number = Column(String, nullable=True)
    dispatch_date = Column(String, nullable=True)
    expected_return_date = Column(String, nullable=True)
    external_cost = Column(Integer, default=0)
    supplier_cost = Column(Float, nullable=True)
    patient_charge = Column(Float, nullable=True)
    gross_profit = Column(Float, nullable=True)
    pricing_configured = Column(Boolean, default=False)
    stage = Column(String, default="New Cases")
    tech_notes = Column(String, nullable=True)
    email_sent_at = Column(String, nullable=True)
    external_token = Column(String, unique=True, index=True, nullable=True)
    external_token_created_at = Column(DateTime(timezone=True), nullable=True)
    external_token_active = Column(Boolean, default=True)
    
    # Extended Rework History, Soft Lock & Physical Molds
    rework_count = Column(Integer, default=0)
    rework_reason = Column(String, nullable=True)
    rework_notes = Column(Text, nullable=True)
    rework_attachments = Column(JSON, default=list)
    rework_status = Column(String, nullable=True)
    actual_invoice_amount = Column(Float, default=0.0)
    rework_history = Column(JSON, default=list)  # List of objects: [{"date": "", "category": "", "reason": "", "notes": "", "files": []}]
    claimed_by = Column(String, nullable=True)   # Tech user who claimed review
    claimed_at = Column(DateTime(timezone=True), nullable=True)
    physical_mold_sent = Column(Boolean, default=False)
    pending_email_proposal = Column(JSON, nullable=True)  # Stores parsed email proposed update for human 1-click verification
    
    # Patient Payment & Receipt Fields for Receptionist Checkout
    patient_total_amount = Column(Float, default=3500.0)
    patient_amount_paid = Column(Float, default=0.0)
    patient_balance_due = Column(Float, default=3500.0)
    payment_status = Column(String, default="Pending Payment") # Pending Payment, 50% Advance Paid, Paid in Full
    payment_method = Column(String, nullable=True) # Cash, Card, UPI
    date_received = Column(DateTime(timezone=True), nullable=True)
    
    # Item Received at Clinic Verification Fields
    item_condition = Column(String, default="Good") # Good, Damaged
    item_remarks = Column(String, nullable=True)
    received_by = Column(String, nullable=True)
    clinic_received_at = Column(DateTime(timezone=True), nullable=True)
    receptionist_notified = Column(Boolean, default=False)
    appointment_scheduled = Column(Boolean, default=False)
    
    # Tri-Module Integration (Lab, Accountant & Receptionist)
    accountant_notified = Column(Boolean, default=False)
    accountant_bill_status = Column(String, default="Pending Accountant Review") # "Pending Accountant Review", "Bill Ready"
    final_patient_bill_amount = Column(Float, default=3500.0)
    vendor_invoice_verified = Column(Boolean, default=False)
    vendor_name = Column(String, nullable=True)
    vendor_invoice_number = Column(String, nullable=True)
    vendor_invoice_amount = Column(Float, default=0.0)
    vendor_invoice_file_url = Column(String, nullable=True)
    communication_logs = Column(JSON, default=list)

    prosthetic_detail = relationship("ProstheticCaseDetailModel", back_populates="lab_case", uselist=False, cascade="all, delete-orphan")
    pathology_detail = relationship("PathologyCaseDetailModel", back_populates="lab_case", uselist=False, cascade="all, delete-orphan")
    encounter = relationship("ClinicalEncounterModel", back_populates="lab_case", uselist=False)

class LabVendorModel(Base):
    __tablename__ = "lab_vendors"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, unique=True, index=True, nullable=False)
    contact_person = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    average_tat_days = Column(Integer, default=5)
    pricing_list = Column(JSON, nullable=True)  # Key-value: {"Zirconia Crown": 3500}
    rating = Column(Float, default=5.0)

class LabOrderCommentModel(Base):
    __tablename__ = "lab_order_comments"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    order_id = Column(String, ForeignKey("lab_orders.id", ondelete="CASCADE"), nullable=False)
    user_name = Column(String, nullable=False)
    user_role = Column(String, nullable=False)  # doctor / lab tech
    message = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class LabAuditTrailModel(Base):
    __tablename__ = "lab_audit_trails"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    order_id = Column(String, ForeignKey("lab_orders.id", ondelete="CASCADE"), nullable=False)
    user_name = Column(String, nullable=False)
    action = Column(String, nullable=False)
    note = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class LabNotificationModel(Base):
    __tablename__ = "lab_notifications"

    id = Column(Integer, primary_key=True, index=True)
    recipient_role = Column(String, default="lab tech")
    type = Column(String, default="Orders")  # Orders, QC, Dispatch, Billing
    title = Column(String, nullable=False)
    desc = Column(String, nullable=False)
    read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class InventoryItemModel(Base):
    __tablename__ = "lab_inventory_items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    category = Column(String, default="Material") # Medicine, Material, Consumable, PPE, Instrument
    current_stock = Column(Integer, default=0)
    minimum_stock_alert = Column(Integer, default=10)
    unit = Column(String, default="pcs")
    unit_price = Column(Float, nullable=True) # For future billing phase
    supplier = Column(String, nullable=True)
    expiry_date = Column(String, nullable=True)
    batch_number = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class RestockRequestModel(Base):
    __tablename__ = "lab_restock_requests"

    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, nullable=True) # Nullable for requesting new items
    item_name = Column(String, nullable=False)
    requested_quantity = Column(Integer, nullable=False)
    status = Column(String, default="Pending") # Pending, Approved, Fulfilled, Rejected
    notes = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class ProstheticCaseDetailModel(Base):
    __tablename__ = "prosthetic_case_details"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    lab_case_id = Column(String, ForeignKey("lab_orders.id", ondelete="CASCADE"), nullable=False, unique=True)
    tooth_number = Column(String, nullable=True)
    fabrication_type = Column(String, nullable=True)
    scan_file = Column(String, nullable=True)
    material = Column(String, nullable=True)
    shade = Column(String, nullable=True)
    opposing_bite_scan = Column(String, nullable=True)
    implant_system = Column(String, nullable=True)

    lab_case = relationship("LabOrderModel", back_populates="prosthetic_detail")

class PathologyCaseDetailModel(Base):
    __tablename__ = "pathology_case_details"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    lab_case_id = Column(String, ForeignKey("lab_orders.id", ondelete="CASCADE"), nullable=False, unique=True)
    test_type = Column(String, nullable=True)
    sample_type = Column(String, nullable=True)
    reason_for_test = Column(String, nullable=True)
    external_lab_name = Column(String, nullable=True)
    sample_collected_confirm = Column(Boolean, default=False)

    lab_case = relationship("LabOrderModel", back_populates="pathology_detail")

class ClinicalEncounterModel(Base):
    __tablename__ = "clinical_encounters"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    patient_token = Column(String, index=True, nullable=False)
    doctor_name = Column(String, nullable=False)
    notes = Column(String, nullable=True)
    lab_case_id = Column(String, ForeignKey("lab_orders.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    lab_case = relationship("LabOrderModel", back_populates="encounter")

class LabItemPriceModel(Base):
    __tablename__ = "lab_pricing_catalog"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    item_name = Column(String, nullable=False, index=True) # e.g. Zirconia Crown, E-max Veneer
    category = Column(String, default="Prosthetic") # Prosthetic, Orthodontic, Surgical, Pathology
    material_tier = Column(String, default="Standard") # Standard, Premium, Elite
    vendor_cost = Column(Float, default=0.0) # Base cost paid to vendor/lab
    clinic_markup_pct = Column(Float, default=50.0) # Clinic markup percentage e.g. 50%
    patient_price = Column(Float, default=0.0) # Final calculated or preset price to patient
    warranty_months = Column(Integer, default=12) # Warranty duration in months
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class UnmatchedLabEmailModel(Base):
    __tablename__ = "unmatched_lab_emails"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    sender_email = Column(String, nullable=True)
    subject = Column(String, nullable=True)
    raw_body = Column(Text, nullable=False)
    extracted_data = Column(JSON, nullable=True)
    status = Column(String, default="Unmatched") # Unmatched, Assigned, Dismissed
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class LabVendorPricingModel(Base):
    __tablename__ = "lab_vendor_pricings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    vendor_id = Column(Integer, ForeignKey("lab_vendors.id", ondelete="CASCADE"), nullable=False, index=True)
    restoration_type = Column(String, nullable=False, index=True) # e.g. Crown, Bridge, Veneer, PFM, Zirconia Crown
    material = Column(String, nullable=True) # e.g. Zirconia, E-max, PFM, All
    supplier_cost = Column(Float, nullable=False, default=0.0) # Clinic pays to vendor
    patient_charge = Column(Float, nullable=False, default=0.0) # Clinic bills patient
    gross_profit = Column(Float, nullable=False, default=0.0) # patient_charge - supplier_cost
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    vendor = relationship("LabVendorModel", foreign_keys=[vendor_id])


class SupplierPayableModel(Base):
    __tablename__ = "supplier_payables"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    supplier_name = Column(String, nullable=False, index=True)
    supplier_type = Column(String, default="External Lab") # External Lab, Medicine, Other Vendor
    invoice_number = Column(String, nullable=True)
    supplier_cost = Column(Float, nullable=False, default=0.0)
    due_date = Column(String, nullable=True)
    status = Column(String, default="Pending") # Pending, Paid
    payment_date = Column(String, nullable=True)
    payment_reference = Column(String, nullable=True)
    lab_case_id = Column(String, nullable=True, index=True)
    invoice_file_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class FittingAppointmentModel(Base):
    __tablename__ = "fitting_appointments"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    lab_case_id = Column(String, ForeignKey("lab_orders.id", ondelete="CASCADE"), nullable=False, index=True)
    patient_token = Column(String, nullable=False, index=True)
    patient_name = Column(String, nullable=True)
    doctor_name = Column(String, nullable=False)
    appointment_date = Column(String, nullable=False) # YYYY-MM-DD
    appointment_time = Column(String, nullable=True) # e.g. 10:30 AM
    chair_number = Column(String, nullable=True) # e.g. Chair 2
    notes = Column(String, nullable=True)
    status = Column(String, default="Scheduled") # Scheduled, Completed, Cancelled
    created_at = Column(DateTime(timezone=True), server_default=func.now())



