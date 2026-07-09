from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ComplaintCreate(BaseModel):
    subject: str
    body: str
    related_complaint_id: Optional[int] = None

class ComplaintResponse(BaseModel):
    id: int
    user_id: int
    subject: str
    body: str
    status: str
    created_at: datetime
    resolved_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    related_complaint_id: Optional[int] = None
    staff_name: Optional[str] = None
    staff_role: Optional[str] = None

    class Config:
        from_attributes = True

class ComplaintUpdateStatus(BaseModel):
    status: str
    note: Optional[str] = None

class ComplaintReopen(BaseModel):
    reason: str

class ComplaintStatusLogResponse(BaseModel):
    id: int
    complaint_id: int
    from_status: Optional[str] = None
    to_status: str
    changed_by: Optional[int] = None
    changed_by_name: Optional[str] = None
    note: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

