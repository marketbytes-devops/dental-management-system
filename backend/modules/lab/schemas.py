from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime

class LabOrderCreate(BaseModel):
    patient_token: str
    patient_name: Optional[str] = None
    dentist_name: Optional[str] = None
    dentist_contact: Optional[str] = None
    order_category: Optional[str] = "Prosthetic"
    order_details: Optional[Any] = None
    
    # Legacy fields
    prosthetic_type: Optional[str] = None
    material: Optional[str] = None
    shade: Optional[str] = None
    
    priority: Optional[str] = "Medium"
    notes: Optional[str] = None
    due_date: Optional[str] = None
    lab_name: Optional[str] = None
    
    # New columns
    treatment_plan_step_id: Optional[int] = None
    tooth_quadrant: Optional[str] = None
    procedure_code: Optional[str] = None
    margin_design: Optional[str] = None
    impression_type: Optional[str] = "Physical"
    attachments: Optional[List[Any]] = None
    vendor_id: Optional[int] = None
    courier_name: Optional[str] = None
    tracking_number: Optional[str] = None
    dispatch_date: Optional[str] = None
    expected_return_date: Optional[str] = None
    external_cost: Optional[int] = 0
    parent_order_id: Optional[str] = None
    rejection_category: Optional[str] = None
    stage: Optional[str] = "New Cases"

class LabOrderStatusUpdate(BaseModel):
    status: str
    rejection_reason: Optional[str] = None
    result_document_url: Optional[str] = None

class LabOrderEdit(BaseModel):
    order_category: Optional[str] = None
    order_details: Optional[Any] = None
    prosthetic_type: Optional[str] = None
    material: Optional[str] = None
    shade: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[str] = None
    notes: Optional[str] = None
    lab_name: Optional[str] = None
    status: Optional[str] = None
    
    treatment_plan_step_id: Optional[int] = None
    tooth_quadrant: Optional[str] = None
    procedure_code: Optional[str] = None
    margin_design: Optional[str] = None
    impression_type: Optional[str] = None
    attachments: Optional[List[Any]] = None
    vendor_id: Optional[int] = None
    courier_name: Optional[str] = None
    tracking_number: Optional[str] = None
    dispatch_date: Optional[str] = None
    expected_return_date: Optional[str] = None
    external_cost: Optional[int] = None
    parent_order_id: Optional[str] = None
    rejection_category: Optional[str] = None
    stage: Optional[str] = None

class LabOrderResponse(BaseModel):
    id: str
    patient_token: str
    patient_name: Optional[str] = None
    dentist_name: Optional[str] = None
    dentist_contact: Optional[str] = None
    order_category: Optional[str] = "Prosthetic"
    order_details: Optional[Any] = None
    result_document_url: Optional[str] = None
    
    prosthetic_type: Optional[str] = None
    material: Optional[str] = None
    shade: Optional[str] = None
    priority: str
    status: str
    notes: Optional[str] = None
    due_date: Optional[str] = None
    lab_name: Optional[str] = None
    rejection_reason: Optional[str] = None
    created_at: Optional[datetime] = None
    
    # New columns
    treatment_plan_step_id: Optional[int] = None
    tooth_quadrant: Optional[str] = None
    procedure_code: Optional[str] = None
    margin_design: Optional[str] = None
    impression_type: Optional[str] = "Physical"
    attachments: Optional[List[Any]] = None
    vendor_id: Optional[int] = None
    courier_name: Optional[str] = None
    tracking_number: Optional[str] = None
    dispatch_date: Optional[str] = None
    expected_return_date: Optional[str] = None
    external_cost: Optional[int] = 0
    parent_order_id: Optional[str] = None
    rejection_category: Optional[str] = None
    stage: Optional[str] = "New Cases"

    class Config:
        from_attributes = True

class LabVendorCreate(BaseModel):
    name: str
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    average_tat_days: Optional[int] = 5
    pricing_list: Optional[Any] = None

class LabVendorResponse(BaseModel):
    id: int
    name: str
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    average_tat_days: int
    pricing_list: Optional[Any] = None
    rating: float

    class Config:
        from_attributes = True

class LabOrderCommentCreate(BaseModel):
    message: str

class LabOrderCommentResponse(BaseModel):
    id: int
    order_id: str
    user_name: str
    user_role: str
    message: str
    created_at: datetime

    class Config:
        from_attributes = True

class LabAuditTrailResponse(BaseModel):
    id: int
    order_id: str
    user_name: str
    action: str
    note: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class LabNotificationResponse(BaseModel):
    id: int
    recipient_role: str
    type: str
    title: str
    desc: str
    read: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class InventoryItemCreate(BaseModel):
    name: str
    category: Optional[str] = "Material"
    current_stock: Optional[int] = 0
    minimum_stock_alert: Optional[int] = 10
    unit: Optional[str] = "pcs"
    unit_price: Optional[float] = None
    supplier: Optional[str] = None
    expiry_date: Optional[str] = None
    batch_number: Optional[str] = None

class InventoryItemUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    current_stock: Optional[int] = None
    minimum_stock_alert: Optional[int] = None
    unit: Optional[str] = None
    unit_price: Optional[float] = None
    supplier: Optional[str] = None
    expiry_date: Optional[str] = None
    batch_number: Optional[str] = None

class InventoryItemResponse(BaseModel):
    id: int
    name: str
    category: str
    current_stock: int
    minimum_stock_alert: int
    unit: str
    unit_price: Optional[float] = None
    supplier: Optional[str] = None
    expiry_date: Optional[str] = None
    batch_number: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class RestockRequestCreate(BaseModel):
    item_id: Optional[int] = None
    item_name: str
    requested_quantity: int
    notes: Optional[str] = None

class RestockRequestStatusUpdate(BaseModel):
    status: str # Ordered, Fulfilled, Rejected

class RestockRequestResponse(BaseModel):
    id: int
    item_id: Optional[int] = None
    item_name: str
    requested_quantity: int
    status: str
    notes: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
