from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ComplaintCreate(BaseModel):
    subject: str
    body: str
    related_complaint_id: Optional[int] = None


class ComplaintResponse(BaseModel):
    id: int
    staff_id: Optional[int] = None
    staff_name: Optional[str] = None
    staff_role: Optional[str] = None
    subject: str
    body: str
    status: str
    related_complaint_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ComplaintLogResponse(BaseModel):
    id: int
    complaint_id: int
    from_status: Optional[str] = None
    to_status: str
    note: Optional[str] = None
    changed_by_id: Optional[int] = None
    changed_by_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ReopenRequest(BaseModel):
    reason: str
