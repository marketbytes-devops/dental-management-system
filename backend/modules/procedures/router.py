from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from .models import ProcedureModel
from .schemas import ProcedureCreate, ProcedureUpdate, ProcedureResponse

router = APIRouter(prefix="/procedures", tags=["Procedures"])

@router.get("", response_model=List[ProcedureResponse])
def get_procedures(db: Session = Depends(get_db)):
    return db.query(ProcedureModel).filter(ProcedureModel.is_active == True).all()

@router.post("", response_model=ProcedureResponse)
def create_procedure(procedure: ProcedureCreate, db: Session = Depends(get_db)):
    new_proc = ProcedureModel(**procedure.dict())
    db.add(new_proc)
    db.commit()
    db.refresh(new_proc)
    return new_proc

@router.put("/{procedure_id}", response_model=ProcedureResponse)
def update_procedure(procedure_id: int, procedure_update: ProcedureUpdate, db: Session = Depends(get_db)):
    proc = db.query(ProcedureModel).filter(ProcedureModel.id == procedure_id).first()
    if not proc:
        raise HTTPException(status_code=404, detail="Procedure not found")
    
    update_data = procedure_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(proc, key, value)
        
    db.commit()
    db.refresh(proc)
    return proc

@router.delete("/{procedure_id}")
def delete_procedure(procedure_id: int, db: Session = Depends(get_db)):
    proc = db.query(ProcedureModel).filter(ProcedureModel.id == procedure_id).first()
    if not proc:
        raise HTTPException(status_code=404, detail="Procedure not found")
    
    # Soft delete
    proc.is_active = False
    db.commit()
    return {"message": "Procedure deleted successfully"}
