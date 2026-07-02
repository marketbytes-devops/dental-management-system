from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ComplaintCreate(BaseModel):
    subject: str
    body: str

class ComplaintResponse(BaseModel):
    id: int
    user_id: int
    subject: str
    body: str
    status: str
    created_at: datetime
    staff_name: Optional[str] = None
    staff_role: Optional[str] = None

    class Config:
        from_attributes = True

class ComplaintUpdateStatus(BaseModel):
    status: str
