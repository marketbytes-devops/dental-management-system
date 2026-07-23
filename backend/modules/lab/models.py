# models.py - database table definitions
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, JSON, ForeignKey
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
    status = Column(String, default="submitted")
    notes = Column(String, nullable=True)
    due_date = Column(String, nullable=True)
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
    stage = Column(String, default="New Cases")
    tech_notes = Column(String, nullable=True)
    email_sent_at = Column(String, nullable=True)

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

