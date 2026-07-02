# models.py - database table definitions
from sqlalchemy import Column, Integer, String, Boolean, DateTime, JSON, Float
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
    status = Column(String, default="Pending")
    notes = Column(String, nullable=True)
    due_date = Column(String, nullable=True)
    lab_name = Column(String, nullable=True)
    rejection_reason = Column(String, nullable=True)
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
