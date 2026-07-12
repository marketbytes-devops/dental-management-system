from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ProcedureBase(BaseModel):
    name: str
    description: Optional[str] = None
    rate: float
    parent_id: Optional[int] = None
    specialty: Optional[str] = "General Dentistry"
    is_active: Optional[bool] = True

class ProcedureCreate(ProcedureBase):
    pass

class ProcedureUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    rate: Optional[float] = None
    parent_id: Optional[int] = None
    specialty: Optional[str] = None
    is_active: Optional[bool] = None

class ProcedureResponse(ProcedureBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
