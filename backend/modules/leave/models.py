from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from database import Base

class LeaveRequestModel(Base):
    __tablename__ = "leave_requests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    staff_name = Column(String, nullable=False)
    role = Column(String, nullable=False)
    type = Column(String, nullable=False) # Annual Leave, Sick Leave, Casual Leave, CME Leave
    start_date = Column(String, nullable=False) # YYYY-MM-DD
    end_date = Column(String, nullable=False) # YYYY-MM-DD
    days = Column(Integer, nullable=False)
    reason = Column(String, nullable=False)
    status = Column(String, default="Pending") # Pending, Approved, Rejected
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())
    on_call_doctor = Column(String, nullable=True)
