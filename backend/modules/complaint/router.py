from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from dependencies import get_current_active_user, require_admin
from modules.auth.models import UserModel
from modules.complaint.models import ComplaintModel, ComplaintStatusLogModel
from modules.complaint.schemas import (
    ComplaintCreate, 
    ComplaintResponse, 
    ComplaintUpdateStatus, 
    ComplaintReopen, 
    ComplaintStatusLogResponse
)
from shared.utils.notifications import send_system_notification
from typing import List

router = APIRouter(prefix="/complaints", tags=["complaints"])

@router.post("", response_model=ComplaintResponse)
def create_complaint(
    payload: ComplaintCreate,
    current_user: dict = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    user_id = current_user.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication credentials missing.")
    
    # Verify user exists
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
        
    # Check related_complaint_id if provided
    if payload.related_complaint_id:
        related = db.query(ComplaintModel).filter(ComplaintModel.id == payload.related_complaint_id).first()
        if not related:
            raise HTTPException(status_code=404, detail="Related complaint not found.")
        if related.status.lower() != "closed":
            raise HTTPException(status_code=400, detail="Related complaint must be in Closed status to link a new complaint.")
    
    new_complaint = ComplaintModel(
        user_id=user.id,
        subject=payload.subject,
        body=payload.body,
        status="Pending",
        related_complaint_id=payload.related_complaint_id
    )
    db.add(new_complaint)
    db.commit()
    db.refresh(new_complaint)
    
    # Create initial audit log
    initial_log = ComplaintStatusLogModel(
        complaint_id=new_complaint.id,
        from_status=None,
        to_status="Pending",
        changed_by=user_id,
        note="Complaint created."
    )
    db.add(initial_log)
    db.commit()
    
    roles = user.roles or []
    role_label = roles[0] if roles else "Staff"
    
    return ComplaintResponse(
        id=new_complaint.id,
        user_id=new_complaint.user_id,
        subject=new_complaint.subject,
        body=new_complaint.body,
        status=new_complaint.status,
        created_at=new_complaint.created_at,
        resolved_at=new_complaint.resolved_at,
        closed_at=new_complaint.closed_at,
        related_complaint_id=new_complaint.related_complaint_id,
        staff_name=user.name,
        staff_role=role_label
    )

@router.get("/my", response_model=List[ComplaintResponse])
def get_my_complaints(
    current_user: dict = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    user_id = current_user.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication credentials missing.")
        
    complaints = db.query(ComplaintModel).filter(ComplaintModel.user_id == user_id).order_by(ComplaintModel.created_at.desc()).all()
    
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    staff_name = user.name if user else "Unknown"
    roles = user.roles or []
    role_label = roles[0] if roles else "Staff"
    
    result = []
    for c in complaints:
        result.append(ComplaintResponse(
            id=c.id,
            user_id=c.user_id,
            subject=c.subject,
            body=c.body,
            status=c.status,
            created_at=c.created_at,
            resolved_at=c.resolved_at,
            closed_at=c.closed_at,
            related_complaint_id=c.related_complaint_id,
            staff_name=staff_name,
            staff_role=role_label
        ))
    return result

@router.get("", response_model=List[ComplaintResponse])
def get_all_complaints(
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db)
):
    complaints = db.query(ComplaintModel, UserModel).join(UserModel, ComplaintModel.user_id == UserModel.id).order_by(ComplaintModel.created_at.desc()).all()
    
    result = []
    for c, u in complaints:
        roles = u.roles or []
        role_label = roles[0] if roles else "Staff"
        result.append(ComplaintResponse(
            id=c.id,
            user_id=c.user_id,
            subject=c.subject,
            body=c.body,
            status=c.status,
            created_at=c.created_at,
            resolved_at=c.resolved_at,
            closed_at=c.closed_at,
            related_complaint_id=c.related_complaint_id,
            staff_name=u.name,
            staff_role=role_label
        ))
    return result

@router.patch("/{complaint_id}/status", response_model=ComplaintResponse)
def update_complaint_status(
    complaint_id: int,
    payload: ComplaintUpdateStatus,
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db)
):
    complaint = db.query(ComplaintModel).filter(ComplaintModel.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found.")
        
    old_status = complaint.status
    new_status = payload.status
    
    valid_statuses = {"Pending", "Under Review", "Resolved", "Closed"}
    if new_status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status: '{new_status}'. Allowed values: {list(valid_statuses)}")
        
    if old_status == "Closed":
        raise HTTPException(status_code=400, detail="Closed complaints cannot be updated.")
        
    status_order = {
        "Pending": 1,
        "Under Review": 2,
        "Resolved": 3,
        "Closed": 4
    }
    
    old_val = status_order.get(old_status, 1)
    new_val = status_order.get(new_status, 1)
    
    if new_val < old_val:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot transition backward from '{old_status}' to '{new_status}'."
        )
        
    if old_status != new_status:
        complaint.status = new_status
        if new_status == "Resolved":
            complaint.resolved_at = func.now()
        elif new_status == "Closed":
            complaint.closed_at = func.now()
            
        log_entry = ComplaintStatusLogModel(
            complaint_id=complaint.id,
            from_status=old_status,
            to_status=new_status,
            changed_by=current_user.get("user_id"),
            note=payload.note or f"Status updated to {new_status}"
        )
        db.add(log_entry)
        db.commit()
        db.refresh(complaint)
        
        # Trigger notification
        try:
            send_system_notification(
                recipient_id=str(complaint.user_id),
                title=f"Complaint Status: {new_status}",
                message=f"Your complaint ID #{complaint.id} regarding '{complaint.subject}' has been marked as {new_status}."
            )
        except Exception as e:
            print(f"Failed to send notification: {e}")
            
    user = db.query(UserModel).filter(UserModel.id == complaint.user_id).first()
    staff_name = user.name if user else "Unknown"
    roles = user.roles or []
    role_label = roles[0] if roles else "Staff"
    
    return ComplaintResponse(
        id=complaint.id,
        user_id=complaint.user_id,
        subject=complaint.subject,
        body=complaint.body,
        status=complaint.status,
        created_at=complaint.created_at,
        resolved_at=complaint.resolved_at,
        closed_at=complaint.closed_at,
        related_complaint_id=complaint.related_complaint_id,
        staff_name=staff_name,
        staff_role=role_label
    )

@router.post("/{complaint_id}/reopen", response_model=ComplaintResponse)
def reopen_complaint(
    complaint_id: int,
    payload: ComplaintReopen,
    current_user: dict = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    complaint = db.query(ComplaintModel).filter(ComplaintModel.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found.")
        
    roles = [r.lower() for r in current_user.get("roles", [])]
    is_admin = "admin" in roles
    is_owner = complaint.user_id == current_user.get("user_id")
    if not (is_admin or is_owner):
        raise HTTPException(status_code=403, detail="Not authorized to reopen this complaint.")
        
    if complaint.status == "Closed":
        raise HTTPException(status_code=400, detail="Closed complaints cannot be reopened. Please file a new complaint instead.")
        
    if complaint.status != "Resolved":
        raise HTTPException(status_code=400, detail=f"Only Resolved complaints can be reopened. Current status: {complaint.status}")
        
    reason = payload.reason.strip()
    if not reason:
        raise HTTPException(status_code=400, detail="A mandatory reason is required to reopen a complaint.")
        
    old_status = complaint.status
    complaint.status = "Pending"
    complaint.resolved_at = None # Reset resolved timestamp!
    
    log_entry = ComplaintStatusLogModel(
        complaint_id=complaint.id,
        from_status=old_status,
        to_status="Pending",
        changed_by=current_user.get("user_id"),
        note=f"Reopened: {reason}"
    )
    db.add(log_entry)
    db.commit()
    db.refresh(complaint)
    
    # Trigger notification
    try:
        send_system_notification(
            recipient_id=str(complaint.user_id),
            title="Complaint Reopened",
            message=f"Your complaint ID #{complaint.id} regarding '{complaint.subject}' has been reopened."
        )
    except Exception as e:
        print(f"Failed to send notification: {e}")
        
    user = db.query(UserModel).filter(UserModel.id == complaint.user_id).first()
    staff_name = user.name if user else "Unknown"
    roles = user.roles or []
    role_label = roles[0] if roles else "Staff"
    
    return ComplaintResponse(
        id=complaint.id,
        user_id=complaint.user_id,
        subject=complaint.subject,
        body=complaint.body,
        status=complaint.status,
        created_at=complaint.created_at,
        resolved_at=complaint.resolved_at,
        closed_at=complaint.closed_at,
        related_complaint_id=complaint.related_complaint_id,
        staff_name=staff_name,
        staff_role=role_label
    )

@router.get("/{complaint_id}/logs", response_model=List[ComplaintStatusLogResponse])
def get_complaint_logs(
    complaint_id: int,
    current_user: dict = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    complaint = db.query(ComplaintModel).filter(ComplaintModel.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found.")
        
    roles = [r.lower() for r in current_user.get("roles", [])]
    is_admin = "admin" in roles
    is_owner = complaint.user_id == current_user.get("user_id")
    if not (is_admin or is_owner):
        raise HTTPException(status_code=403, detail="Not authorized to view logs for this complaint.")
        
    logs = db.query(ComplaintStatusLogModel, UserModel).outerjoin(
        UserModel, ComplaintStatusLogModel.changed_by == UserModel.id
    ).filter(ComplaintStatusLogModel.complaint_id == complaint_id).order_by(
        ComplaintStatusLogModel.created_at.asc()
    ).all()
    
    result = []
    for log, user in logs:
        result.append(ComplaintStatusLogResponse(
            id=log.id,
            complaint_id=log.complaint_id,
            from_status=log.from_status,
            to_status=log.to_status,
            changed_by=log.changed_by,
            changed_by_name=user.name if user else "System",
            note=log.note,
            created_at=log.created_at
        ))
    return result

