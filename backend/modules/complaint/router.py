from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from dependencies import get_current_active_user, require_admin
from modules.auth.models import UserModel
from modules.complaint.models import ComplaintModel
from modules.complaint.schemas import ComplaintCreate, ComplaintResponse, ComplaintUpdateStatus
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
    
    new_complaint = ComplaintModel(
        user_id=user.id,
        subject=payload.subject,
        body=payload.body,
        status="Pending"
    )
    db.add(new_complaint)
    db.commit()
    db.refresh(new_complaint)
    
    roles = user.roles or []
    role_label = roles[0] if roles else "Staff"
    
    return ComplaintResponse(
        id=new_complaint.id,
        user_id=new_complaint.user_id,
        subject=new_complaint.subject,
        body=new_complaint.body,
        status=new_complaint.status,
        created_at=new_complaint.created_at,
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
        
    complaint.status = payload.status
    db.commit()
    db.refresh(complaint)
    
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
        staff_name=staff_name,
        staff_role=role_label
    )
