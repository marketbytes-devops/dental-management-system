from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.sql import func, text
from database import Base


class ComplaintModel(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    # Staff who filed the ticket
    staff_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    staff_name = Column(String, nullable=True)
    staff_role = Column(String, nullable=True)
    # Ticket content
    subject = Column(String, nullable=False)
    body = Column(Text, nullable=False)
    status = Column(String, default="Pending")  # Pending | Under Review | Resolved | Closed
    # Optional link to a parent complaint (for "File Related" flow)
    related_complaint_id = Column(Integer, ForeignKey("complaints.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=text("now()"))


class ComplaintLogModel(Base):
    """Audit trail: every status transition creates one log entry."""
    __tablename__ = "complaint_logs"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False)
    from_status = Column(String, nullable=True)   # null on initial creation
    to_status = Column(String, nullable=False)
    note = Column(Text, nullable=True)
    changed_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    changed_by_name = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
