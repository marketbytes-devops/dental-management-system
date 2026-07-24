from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user

from .models import ComplaintModel, ComplaintLogModel
from .schemas import ComplaintCreate, ComplaintResponse, ComplaintLogResponse, ReopenRequest

router = APIRouter(prefix="/complaints", tags=["Support & Complaints"])


def _log_transition(
    db: Session,
    complaint_id: int,
    from_status: Optional[str],
    to_status: str,
    note: Optional[str],
    user_id: Optional[int],
    user_name: Optional[str],
):
    log = ComplaintLogModel(
        complaint_id=complaint_id,
        from_status=from_status,
        to_status=to_status,
        note=note,
        changed_by_id=user_id,
        changed_by_name=user_name,
    )
    db.add(log)


# ─── GET /complaints/mine ──────────────────────────────────────────────────────
@router.get("/mine", response_model=List[ComplaintResponse])
def get_my_complaints(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Return all complaints filed by the current authenticated staff member."""
    user_id = current_user.get("user_id")
    if not user_id:
        raise HTTPException(status_code=403, detail="Staff login required.")
    complaints = (
        db.query(ComplaintModel)
        .filter(ComplaintModel.staff_id == user_id)
        .order_by(ComplaintModel.created_at.desc())
        .all()
    )
    return complaints


# ─── POST /complaints ──────────────────────────────────────────────────────────
@router.post("/", response_model=ComplaintResponse, status_code=status.HTTP_201_CREATED)
def submit_complaint(
    body: ComplaintCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Create a new support ticket."""
    user_id = current_user.get("user_id")
    user_name = current_user.get("name") or "Staff Member"
    roles = current_user.get("roles", [])
    staff_role = roles[0] if roles else "Staff"

    complaint = ComplaintModel(
        staff_id=user_id,
        staff_name=user_name,
        staff_role=staff_role,
        subject=body.subject,
        body=body.body,
        related_complaint_id=body.related_complaint_id,
        status="Pending",
    )
    db.add(complaint)
    db.commit()
    db.refresh(complaint)

    # Log the initial creation
    _log_transition(
        db,
        complaint_id=complaint.id,
        from_status=None,
        to_status="Pending",
        note="Ticket created and submitted to the support queue.",
        user_id=user_id,
        user_name=user_name,
    )
    db.commit()

    return complaint


# ─── GET /complaints/{complaint_id}/logs ───────────────────────────────────────
@router.get("/{complaint_id}/logs", response_model=List[ComplaintLogResponse])
def get_complaint_logs(
    complaint_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Return all audit log entries for a given complaint ticket."""
    complaint = db.query(ComplaintModel).filter(ComplaintModel.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found.")

    logs = (
        db.query(ComplaintLogModel)
        .filter(ComplaintLogModel.complaint_id == complaint_id)
        .order_by(ComplaintLogModel.created_at.asc())
        .all()
    )
    return logs


# ─── POST /complaints/{complaint_id}/reopen ────────────────────────────────────
@router.post("/{complaint_id}/reopen", response_model=ComplaintResponse)
def reopen_complaint(
    complaint_id: int,
    body: ReopenRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Reopen a resolved ticket — transitions status back to Pending."""
    complaint = db.query(ComplaintModel).filter(ComplaintModel.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found.")
    if complaint.status.lower() not in ("resolved", "closed"):
        raise HTTPException(
            status_code=400,
            detail="Only Resolved or Closed tickets can be reopened.",
        )

    user_id = current_user.get("user_id")
    user_name = current_user.get("name") or "Staff Member"

    prev_status = complaint.status
    complaint.status = "Pending"  # type: ignore
    db.commit()

    _log_transition(
        db,
        complaint_id=complaint.id,
        from_status=prev_status,
        to_status="Pending",
        note=body.reason,
        user_id=user_id,
        user_name=user_name,
    )
    db.commit()
    db.refresh(complaint)
    return complaint


# ─── PUT /complaints/{complaint_id}/status (Admin/Dev use) ────────────────────
@router.put("/{complaint_id}/status", response_model=ComplaintResponse)
def update_complaint_status(
    complaint_id: int,
    new_status: str,
    note: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Admin/developer endpoint to update a complaint's status with an optional note."""
    allowed = {"pending", "under review", "resolved", "closed"}
    if new_status.lower() not in allowed:
        raise HTTPException(status_code=400, detail=f"Invalid status. Allowed: {allowed}")

    complaint = db.query(ComplaintModel).filter(ComplaintModel.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found.")

    user_id = current_user.get("user_id")
    user_name = current_user.get("name") or "Admin"

    prev_status = complaint.status
    complaint.status = new_status  # type: ignore
    db.commit()

    _log_transition(
        db,
        complaint_id=complaint.id,
        from_status=prev_status,
        to_status=new_status,
        note=note,
        user_id=user_id,
        user_name=user_name,
    )
    db.commit()
    db.refresh(complaint)
    return complaint
