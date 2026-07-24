from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ProcedureBase(BaseModel):
    name: str
    code: Optional[str] = None
    description: Optional[str] = None
    rate: float
    base_cost: Optional[float] = 0.0
    lab_required: Optional[bool] = False
    default_lab_fee: Optional[float] = 0.0
    tax_category: Optional[str] = "Exempt"
    parent_id: Optional[int] = None
    specialty: Optional[str] = "General Dentistry"
    is_active: Optional[bool] = True

class ProcedureCreate(ProcedureBase):
    pass

class ProcedureUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    rate: Optional[float] = None
    base_cost: Optional[float] = None
    lab_required: Optional[bool] = None
    default_lab_fee: Optional[float] = None
    tax_category: Optional[str] = None
    parent_id: Optional[int] = None
    specialty: Optional[str] = None
    is_active: Optional[bool] = None

class ProcedureResponse(ProcedureBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
