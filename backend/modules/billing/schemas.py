from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class BillingRequestCreate(BaseModel):
    patient_token: str
    doctor_name: str
    total_amount: float
    procedures: List[Dict[str, Any]]
    notes: Optional[str] = None

class BillingRequestUpdate(BaseModel):
    status: Optional[str] = None

class BillingRequestResponse(BillingRequestCreate):
    id: int
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
