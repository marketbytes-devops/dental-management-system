from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from dependencies import get_current_active_user, require_admin
from modules.auth.models import UserModel
from modules.leave.models import LeaveRequestModel
from datetime import datetime, date

router = APIRouter(prefix="/leave", tags=["leave"])

def get_user_role_label(user: UserModel) -> str:
    roles = [r.lower() for r in (user.roles or [])]
    if "admin" in roles:
        return "admin"
    if "doctor" in roles:
        return "doctor"
    if "lab tech" in roles or "lab" in roles or "lab technician" in roles:
        return "labtechnician"
    if "receptionist" in roles:
        return "receptionist"
    if "accountant" in roles:
        return "accountant"
    return "staff"

def get_role_total_balances(role_label: str) -> dict:
    if role_label == "doctor":
        return {
            "Annual Leave": 20,
            "Sick Leave": 10,
            "Casual Leave": 8,
            "CME Leave": 7
        }
    else:
        return {
            "Annual Leave": 18,
            "Sick Leave": 10,
            "Casual Leave": 8
        }

@router.post("/apply")
def apply_leave(
    payload: dict,
    current_user: dict = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    user_id = current_user.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication credentials missing.")

    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    role_label = get_user_role_label(user)

    try:
        start_dt = datetime.strptime(payload["startDate"], "%Y-%m-%d").date()
        end_dt = datetime.strptime(payload["endDate"], "%Y-%m-%d").date()

        today = date.today()

        if start_dt < today:
            raise HTTPException(
                status_code=400,
                detail="Leave cannot start on a past date."
            )

        if end_dt < start_dt:
            raise HTTPException(
                status_code=400,
                detail="End date must be on or after start date."
            )

        days = (end_dt - start_dt).days + 1

    except HTTPException:
        raise

    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid date format. Use YYYY-MM-DD."
        )

    # Check for overlapping Pending or Approved leave requests
    existing_requests = db.query(LeaveRequestModel).filter(
        LeaveRequestModel.user_id == user.id,
        LeaveRequestModel.status.in_(["Pending", "Approved"])
    ).all()

    for leave in existing_requests:
        existing_start = leave.start_date
        existing_end = leave.end_date

        # Convert to date if stored as string
        if isinstance(existing_start, str):
            existing_start = datetime.strptime(existing_start, "%Y-%m-%d").date()
        if isinstance(existing_end, str):
            existing_end = datetime.strptime(existing_end, "%Y-%m-%d").date()

        # Overlap condition
        if start_dt <= existing_end and end_dt >= existing_start:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"You already have a {leave.status.lower()} leave "
                    f"from {existing_start} to {existing_end}."
                )
            )

    

    new_request = LeaveRequestModel(
    user_id=user.id,
    staff_name=user.name,
    role=role_label,
    type=payload["type"],
    start_date=start_dt,
    end_date=end_dt,
    days=days,
    reason=payload["reason"],
    status="Pending",
    on_call_doctor=payload.get("onCallDoctor", "")
)
    db.add(new_request)
    db.commit()
    db.refresh(new_request)
    return new_request

@router.get("/my")
def get_my_leaves(
    current_user: dict = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    user_id = current_user.get("user_id")
    requests = db.query(LeaveRequestModel).filter(
        LeaveRequestModel.user_id == user_id
    ).order_by(LeaveRequestModel.submitted_at.desc()).all()
    return requests

@router.get("/balances")
def get_my_balances(
    current_user: dict = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    user_id = current_user.get("user_id")
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    role_label = get_user_role_label(user)
    totals = get_role_total_balances(role_label)

    # Calculate used days for each approved leave
    approved_leaves = db.query(LeaveRequestModel).filter(
        LeaveRequestModel.user_id == user_id,
        LeaveRequestModel.status == "Approved"
    ).all()

    used_map = {}
    for leave in approved_leaves:
        used_map[leave.type] = used_map.get(leave.type, 0) + leave.days

    balances = {}
    for ltype, total_days in totals.items():
        balances[ltype] = {
            "used": used_map.get(ltype, 0),
            "total": total_days
        }
    return balances

@router.get("/requests")
def get_all_leave_requests(
    current_user: dict = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    requests = db.query(LeaveRequestModel).order_by(
        LeaveRequestModel.submitted_at.desc()
    ).all()
    return requests

@router.get("/balances/all")
def get_all_staff_balances(
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db)
):
    all_users = db.query(UserModel).all()
    # Exclude admins and patients from staff balances list
    staff_users = [u for u in all_users if not any(r.lower() in ["patient", "admin"] for r in u.roles)]

    all_balances = {}
    for s_user in staff_users:
        role_label = get_user_role_label(s_user)
        totals = get_role_total_balances(role_label)

        approved_leaves = db.query(LeaveRequestModel).filter(
            LeaveRequestModel.user_id == s_user.id,
            LeaveRequestModel.status == "Approved"
        ).all()

        used_map = {}
        for leave in approved_leaves:
            used_map[leave.type] = used_map.get(leave.type, 0) + leave.days

        user_key = f"USER-{s_user.id}"
        balances = {}
        for ltype, total_days in totals.items():
            balances[ltype] = {
                "used": used_map.get(ltype, 0),
                "total": total_days
            }
        all_balances[user_key] = balances

    return all_balances

@router.put("/requests/{request_id}/status")
def update_leave_status(
    request_id: int,
    payload: dict,
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db)
):
    req = db.query(LeaveRequestModel).filter(LeaveRequestModel.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Leave request not found.")

    status_val = payload.get("status")
    if status_val not in ["Approved", "Rejected", "Pending"]:
        raise HTTPException(status_code=400, detail="Invalid status value.")

    req.status = status_val
    db.commit()
    db.refresh(req)
    return req

@router.delete("/requests/{request_id}")
def cancel_leave_request(
    request_id: int,
    current_user: dict = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    user_id = current_user.get("user_id")
    roles = [r.lower() for r in current_user.get("roles", [])]
    is_admin = "admin" in roles

    req = db.query(LeaveRequestModel).filter(LeaveRequestModel.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Leave request not found.")

    if not is_admin and req.user_id != user_id:
        raise HTTPException(status_code=403, detail="Permission denied to cancel this request.")

    db.delete(req)
    db.commit()
    return {"message": "Leave request cancelled successfully."}

@router.delete("/reset")
def reset_all_leaves(
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db)
):
    db.query(LeaveRequestModel).delete()
    db.commit()
    return {"message": "Leave requests database reset successfully."}

@router.get("/doctor/leaves")
def get_doctor_leaves(doctor_name: str, db: Session = Depends(get_db)):
    clean_name = doctor_name.replace("Dr.", "").strip()
    user = db.query(UserModel).filter(
        UserModel.name.ilike(f"%{clean_name}%")
    ).first()
    if not user:
        return []
    
    leaves = db.query(LeaveRequestModel).filter(
        LeaveRequestModel.user_id == user.id,
        LeaveRequestModel.status == "Approved"
    ).all()
    
    return [{"start_date": l.start_date, "end_date": l.end_date} for l in leaves]
