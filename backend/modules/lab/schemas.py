from pydantic import BaseModel
from typing import Optional, Any, List
from datetime import datetime

class ProstheticCaseDetailResponse(BaseModel):
    id: int
    lab_case_id: str
    tooth_number: Optional[str] = None
    fabrication_type: Optional[str] = None
    scan_file: Optional[str] = None
    material: Optional[str] = None
    shade: Optional[str] = None
    opposing_bite_scan: Optional[str] = None
    implant_system: Optional[str] = None

    class Config:
        from_attributes = True

class PathologyCaseDetailResponse(BaseModel):
    id: int
    lab_case_id: str
    test_type: Optional[str] = None
    sample_type: Optional[str] = None
    reason_for_test: Optional[str] = None
    external_lab_name: Optional[str] = None
    sample_collected_confirm: Optional[bool] = False

    class Config:
        from_attributes = True

class ClinicalEncounterResponse(BaseModel):
    id: int
    patient_token: str
    doctor_name: str
    notes: Optional[str] = None
    lab_case_id: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class LabOrderCreate(BaseModel):
    patient_token: str
    patient_name: Optional[str] = None
    dentist_name: Optional[str] = None
    dentist_contact: Optional[str] = None
    order_category: Optional[str] = "Prosthetic"
    order_details: Optional[Any] = None
    
    # Restorative/Prosthetic details
    tooth_number: Optional[str] = None
    fabrication_type: Optional[str] = None
    prosthetic_type: Optional[str] = None
    scan_file: Optional[str] = None
    material: Optional[str] = None
    shade: Optional[str] = None
    opposing_bite_scan: Optional[str] = None
    implant_system: Optional[str] = None

    # Pathology details
    test_type: Optional[str] = None
    sample_type: Optional[str] = None
    reason_for_test: Optional[str] = None
    external_lab_name: Optional[str] = None
    sample_collected_confirm: Optional[bool] = False

    priority: Optional[str] = "Medium"
    notes: Optional[str] = None
    lab_name: Optional[str] = None
    
    # Metadata fields
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
    is_rework: Optional[bool] = False
    original_case_id: Optional[str] = None
    stage: Optional[str] = "New Cases"
    status: Optional[str] = "Pending Review"
    tech_notes: Optional[str] = None
    email_sent_at: Optional[str] = None

class LabOrderStatusUpdate(BaseModel):
    status: str
    rejection_reason: Optional[str] = None
    result_document_url: Optional[str] = None
    rejection_category: Optional[str] = None
    vendor_id: Optional[int] = None
    lab_name: Optional[str] = None
    tech_notes: Optional[str] = None
    attachments: Optional[Any] = None

class LabOrderEdit(BaseModel):
    order_category: Optional[str] = None
    order_details: Optional[Any] = None
    priority: Optional[str] = None
    notes: Optional[str] = None
    lab_name: Optional[str] = None
    status: Optional[str] = None
    
    # Restorative/Prosthetic details
    tooth_number: Optional[str] = None
    fabrication_type: Optional[str] = None
    prosthetic_type: Optional[str] = None
    scan_file: Optional[str] = None
    material: Optional[str] = None
    shade: Optional[str] = None
    opposing_bite_scan: Optional[str] = None
    implant_system: Optional[str] = None

    # Pathology details
    test_type: Optional[str] = None
    sample_type: Optional[str] = None
    reason_for_test: Optional[str] = None
    external_lab_name: Optional[str] = None
    sample_collected_confirm: Optional[bool] = None

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
    rejection_reason: Optional[str] = None
    is_rework: Optional[bool] = None
    original_case_id: Optional[str] = None
    stage: Optional[str] = None
    tech_notes: Optional[str] = None
    email_sent_at: Optional[str] = None

class LabOrderResponse(BaseModel):
    id: str
    patient_token: str
    patient_name: Optional[str] = None
    dentist_name: Optional[str] = None
    dentist_contact: Optional[str] = None
    order_category: Optional[str] = "Prosthetic"
    order_details: Optional[Any] = None
    result_document_url: Optional[str] = None
    priority: str
    status: str
    notes: Optional[str] = None
    lab_name: Optional[str] = None
    rejection_reason: Optional[str] = None
    created_at: Optional[datetime] = None

    # Relations
    prosthetic_detail: Optional[ProstheticCaseDetailResponse] = None
    pathology_detail: Optional[PathologyCaseDetailResponse] = None
    encounter: Optional[ClinicalEncounterResponse] = None

    # Flat convenience aliases for frontend compatibility
    tooth_number: Optional[str] = None
    fabrication_type: Optional[str] = None
    scan_file: Optional[str] = None
    material: Optional[str] = None
    shade: Optional[str] = None
    opposing_bite_scan: Optional[str] = None
    implant_system: Optional[str] = None

    test_type: Optional[str] = None
    sample_type: Optional[str] = None
    reason_for_test: Optional[str] = None
    external_lab_name: Optional[str] = None
    sample_collected_confirm: Optional[bool] = None
    
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
    is_rework: Optional[bool] = False
    original_case_id: Optional[str] = None
    stage: Optional[str] = "New Cases"
    tech_notes: Optional[str] = None
    email_sent_at: Optional[str] = None
    external_token: Optional[str] = None
    external_token_created_at: Optional[datetime] = None
    rework_history: Optional[List[Any]] = []
    claimed_by: Optional[str] = None
    claimed_at: Optional[datetime] = None
    physical_mold_sent: Optional[bool] = False
    physical_opposing_mold_sent: Optional[bool] = False
    pending_email_proposal: Optional[Any] = None
    patient_total_amount: Optional[float] = 3500.0
    patient_amount_paid: Optional[float] = 0.0
    patient_balance_due: Optional[float] = 3500.0
    payment_status: Optional[str] = "Pending Payment"
    payment_method: Optional[str] = None
    date_received: Optional[datetime] = None
    item_condition: Optional[str] = "Good"
    item_remarks: Optional[str] = None
    received_by: Optional[str] = None
    clinic_received_at: Optional[datetime] = None
    receptionist_notified: Optional[bool] = False
    appointment_scheduled: Optional[bool] = False
    accountant_notified: Optional[bool] = False
    accountant_bill_status: Optional[str] = "Pending Accountant Review"
    final_patient_bill_amount: Optional[float] = 3500.0
    vendor_invoice_verified: Optional[bool] = False
    vendor_name: Optional[str] = None
    vendor_invoice_number: Optional[str] = None
    vendor_invoice_amount: Optional[float] = 0.0
    vendor_invoice_file_url: Optional[str] = None
    communication_logs: Optional[List[Any]] = []

    # Rework Fields
    rework_count: Optional[int] = 0
    rework_reason: Optional[str] = None
    rework_notes: Optional[str] = None
    rework_attachments: Optional[List[Any]] = []
    rework_status: Optional[str] = None
    rework_history: Optional[List[Any]] = []

    # Financial Contract Pricing Fields
    supplier_cost: Optional[float] = None
    patient_charge: Optional[float] = None
    gross_profit: Optional[float] = None
    pricing_configured: Optional[bool] = False

    class Config:
        from_attributes = True

class LabItemReceivedCreate(BaseModel):
    received_date: Optional[str] = None
    received_by: Optional[str] = None
    item_condition: Optional[str] = "Good"
    item_remarks: Optional[str] = None
    vendor_name: Optional[str] = None
    vendor_invoice_number: Optional[str] = None
    vendor_invoice_amount: Optional[float] = 0.0
    vendor_invoice_file_url: Optional[str] = None

class LabAccountantBillFinalize(BaseModel):
    vendor_invoice_number: Optional[str] = None
    vendor_invoice_amount: Optional[float] = 0.0
    final_patient_bill_amount: float
    notes: Optional[str] = None

class LabCommunicationLogCreate(BaseModel):
    comm_type: str # Phone Call, WhatsApp, SMS, Email
    notes: str

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

class LabItemPriceBase(BaseModel):
    item_name: str
    category: Optional[str] = "Prosthetic"
    material_tier: Optional[str] = "Standard"
    vendor_cost: Optional[float] = 0.0
    clinic_markup_pct: Optional[float] = 50.0
    patient_price: Optional[float] = 0.0
    warranty_months: Optional[int] = 12
    is_active: Optional[bool] = True

class LabItemPriceCreate(LabItemPriceBase):
    pass

class LabItemPriceUpdate(BaseModel):
    item_name: Optional[str] = None
    category: Optional[str] = None
    material_tier: Optional[str] = None
    vendor_cost: Optional[float] = None
    clinic_markup_pct: Optional[float] = None
    patient_price: Optional[float] = None
    warranty_months: Optional[int] = None
    is_active: Optional[bool] = None

class LabItemPriceResponse(LabItemPriceBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ── NEW: Workflow Enhancement Schemas ────────────────────────────────────────

class ProcessCompletionEmailCreate(BaseModel):
    """Payload for processing a completion email reply."""
    raw_email_text: str
    sender_email: Optional[str] = None
    subject: Optional[str] = None

class ConfirmCompletionEmailCreate(BaseModel):
    """Lab tech confirms or edits extracted email completion proposal."""
    courier_name: Optional[str] = None
    tracking_number: Optional[str] = None
    expected_delivery_date: Optional[str] = None
    remarks: Optional[str] = None

class UnmatchedEmailResponse(BaseModel):
    id: int
    sender_email: Optional[str] = None
    subject: Optional[str] = None
    raw_body: str
    extracted_data: Optional[Any] = None
    status: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class DoctorApproveCreate(BaseModel):
    """Doctor approves restoration – marks case Completed."""
    notes: Optional[str] = None

class DoctorReworkRequestCreate(BaseModel):
    """Doctor requests rework – sends back to lab tech."""
    reason: str
    notes: Optional[str] = None
    attachments: Optional[List[Any]] = None   # [{url, name, type}]

class SendReworkToExternalLabCreate(BaseModel):
    """Lab tech dispatches rework request to the same external vendor."""
    vendor_email: Optional[str] = None        # Override only if different vendor
    additional_notes: Optional[str] = None

class ExternalReworkResponseCreate(BaseModel):
    """External lab accepts or rejects a rework request."""
    rejection_reason: Optional[str] = None    # only needed on reject

class ScheduleFittingCreate(BaseModel):
    """Receptionist schedules a fitting appointment."""
    appointment_date: str
    appointment_time: Optional[str] = None
    notes: Optional[str] = None


# ── CONTRACT PRICING & FINANCIAL REPORT SCHEMAS ─────────────────────────────

class LabVendorPricingCreate(BaseModel):
    vendor_id: int
    restoration_type: str
    material: Optional[str] = None
    supplier_cost: float  # Clinic pays
    patient_charge: float # Patient bills

class LabVendorPricingResponse(BaseModel):
    id: int
    vendor_id: int
    vendor_name: Optional[str] = None
    restoration_type: str
    material: Optional[str] = None
    supplier_cost: float
    patient_charge: float
    gross_profit: float
    margin_percentage: float
    is_active: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class LabFinancialReportResponse(BaseModel):
    total_orders: int
    total_supplier_cost: float
    total_patient_billing: float
    total_gross_profit: float
    profit_margin_percentage: float
    breakdown_by_vendor: List[Any]
    breakdown_by_restoration: List[Any]


# ── AUTHORITATIVE WORKFLOW SCHEMAS ──────────────────────────────────────────

class DoctorFlagCreate(BaseModel):
    reason: str
    notes: Optional[str] = None

class DoctorResubmitCreate(BaseModel):
    order_details: Optional[dict] = None
    notes: Optional[str] = None
    attachments: Optional[List[Any]] = None

class FittingAppointmentCreate(BaseModel):
    appointment_date: str
    appointment_time: Optional[str] = None
    doctor_name: Optional[str] = None
    chair_number: Optional[str] = None
    notes: Optional[str] = None

class DoctorFittingOutcomeCreate(BaseModel):
    outcome: str # "Fit Successful" or "Requires Lab Adjustment"
    rework_reason: Optional[str] = None
    notes: Optional[str] = None
    attachments: Optional[List[Any]] = None

class SupplierPayableCreate(BaseModel):
    supplier_name: str
    supplier_type: Optional[str] = "External Lab" # External Lab, Medicine, Other Vendor
    invoice_number: Optional[str] = None
    supplier_cost: float
    due_date: Optional[str] = None
    lab_case_id: Optional[str] = None
    invoice_file_url: Optional[str] = None

class SupplierPayablePayCreate(BaseModel):
    payment_reference: str
    payment_date: Optional[str] = None

class SupplierPayableResponse(BaseModel):
    id: int
    supplier_name: str
    supplier_type: str
    invoice_number: Optional[str] = None
    supplier_cost: float
    due_date: Optional[str] = None
    status: str
    payment_date: Optional[str] = None
    payment_reference: Optional[str] = None
    lab_case_id: Optional[str] = None
    invoice_file_url: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True



