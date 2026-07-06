from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, JSON, ForeignKey
from sqlalchemy.sql import func
from database import Base

class LabOrderModel(Base):
    __tablename__ = "lab_orders"

    id = Column(String, primary_key=True, index=True)
    patient_token = Column(String, index=True, nullable=False)
    patient_name = Column(String, nullable=True)
    dentist_name = Column(String, nullable=True)
    dentist_contact = Column(String, nullable=True)
    prosthetic_type = Column(String, nullable=False)
    material = Column(String, nullable=True)
    shade = Column(String, nullable=True)
    priority = Column(String, default="Medium")
    status = Column(String, default="Pending")
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
    vendor_id = Column(Integer, nullable=True)
    courier_name = Column(String, nullable=True)
    tracking_number = Column(String, nullable=True)
    dispatch_date = Column(String, nullable=True)
    expected_return_date = Column(String, nullable=True)
    external_cost = Column(Integer, default=0)
    stage = Column(String, default="New Cases")

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

