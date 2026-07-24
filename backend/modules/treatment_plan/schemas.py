from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime

class TreatmentPlanStepBase(BaseModel):
    title: str
    details: Optional[str] = None
    notes: Optional[str] = None
    cost: Optional[int] = 0
    requires_consent: Optional[bool] = False
    phase: Optional[str] = None
    sequence: Optional[int] = 1

class TreatmentPlanStepCreate(TreatmentPlanStepBase):
    pass

class TreatmentPlanStepUpdate(BaseModel):
    title: Optional[str] = None
    details: Optional[str] = None
    notes: Optional[str] = None
    cost: Optional[int] = None
    requires_consent: Optional[bool] = None
    phase: Optional[str] = None
    sequence: Optional[int] = None
    status: Optional[str] = None  # Planned, Scheduled, In Progress, Completed, Deferred, Cancelled
    consent_status: Optional[str] = None  # Not Required, Pending, Given, Denied
    consent_id: Optional[int] = None

class TreatmentPlanStepResponse(TreatmentPlanStepBase):
    id: int
    plan_id: int
    consent_id: Optional[int] = None
    consent_status: str
    consent_given_at: Optional[datetime] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class TreatmentPlanBase(BaseModel):
    patient_token: str
    current_conditions: str
    diagnoses: Optional[List[str]] = []
    treatment_objectives: Optional[List[str]] = []
    estimated_duration: Optional[str] = None
    expected_completion: Optional[str] = None
    attachments: Optional[List[Dict[str, str]]] = []  # e.g. [{"name": "OPG", "type": "OPG", "url": "/..."}]


class TreatmentPlanCreate(TreatmentPlanBase):
    steps: List[TreatmentPlanStepCreate] = []


class TreatmentPlanUpdate(BaseModel):
    current_conditions: Optional[str] = None
    diagnoses: Optional[List[str]] = None
    treatment_objectives: Optional[List[str]] = None
    estimated_duration: Optional[str] = None
    expected_completion: Optional[str] = None
    attachments: Optional[List[Dict[str, str]]] = None
    status: Optional[str] = None


class TreatmentPlanStatusUpdate(BaseModel):
    status: str  # Draft, Active, Archived


class StepConsentUpdate(BaseModel):
    consent_status: str  # Given, Denied


class TreatmentPlanResponse(TreatmentPlanBase):
    id: int
    doctor_name: str
    status: str
    created_at: datetime
    steps: List[TreatmentPlanStepResponse] = []

    class Config:
        from_attributes = True
