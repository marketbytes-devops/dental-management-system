from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from database import get_db
from .models import DentalChartModel, ToothModel, ToothSurfaceModel, ClinicalFindingModel
from .schemas import FindingCreateSchema, ChartResponseSchema, FindingResponseSchema
from typing import List

router = APIRouter(prefix="/charts", tags=["SmileCare Charting"])

def get_tooth_details(num: int):
    # FDI tooth classification
    incisors = {11, 12, 21, 22, 31, 32, 41, 42}
    canines = {13, 23, 33, 43}
    premolars = {14, 15, 24, 25, 34, 35, 44, 45}
    
    if num in incisors:
        return "incisor", 1
    elif num in canines:
        return "canine", 1
    elif num in premolars:
        # upper premolars can have 2 roots
        return "premolar", 2 if num in {14, 15, 24, 25} else 1
    else:
        # molars
        return "molar", 3 if num < 30 else 2

@router.get("/{patient_token}", response_model=ChartResponseSchema)
def get_patient_chart(patient_token: str, db: Session = Depends(get_db)):
    # Retrieve chart with teeth, surfaces and findings preloaded
    chart = db.query(DentalChartModel).options(
        joinedload(DentalChartModel.teeth)
        .joinedload(ToothModel.surfaces),
        joinedload(DentalChartModel.teeth)
        .joinedload(ToothModel.findings)
    ).filter(DentalChartModel.patient_token == patient_token).first()
    
    if not chart:
        # Auto-initialize blank chart
        chart = DentalChartModel(patient_token=patient_token)
        db.add(chart)
        db.commit()
        db.refresh(chart)
        
        # Standard 32 teeth in FDI notation
        fdi_numbers = [
            18, 17, 16, 15, 14, 13, 12, 11,
            21, 22, 23, 24, 25, 26, 27, 28,
            38, 37, 36, 35, 34, 33, 32, 31,
            41, 42, 43, 44, 45, 46, 47, 48
        ]
        
        for num in fdi_numbers:
            tooth_type, root_cnt = get_tooth_details(num)
            tooth = ToothModel(
                chart_id=chart.id,
                tooth_number=num,
                tooth_type=tooth_type,
                status="present",
                root_count=root_cnt
            )
            db.add(tooth)
            db.commit()
            db.refresh(tooth)
            
            # Populate standard 5 surfaces: Mesial, Distal, Buccal/Facial, Lingual/Palatal, Occlusal/Incisal
            surfaces = ["M", "D", "B", "L", "O"]
            for s_code in surfaces:
                surface = ToothSurfaceModel(
                    tooth_id=tooth.id,
                    surface_code=s_code,
                    condition="sound",
                    material="none"
                )
                db.add(surface)
            db.commit()
            
        # Re-fetch populated chart
        chart = db.query(DentalChartModel).options(
            joinedload(DentalChartModel.teeth)
            .joinedload(ToothModel.surfaces),
            joinedload(DentalChartModel.teeth)
            .joinedload(ToothModel.findings)
        ).filter(DentalChartModel.patient_token == patient_token).first()
        
    return chart

@router.post("/{patient_token}/teeth/{tooth_number}/findings")
def add_specialty_finding(
    patient_token: str, 
    tooth_number: int, 
    finding: FindingCreateSchema, 
    db: Session = Depends(get_db)
):
    chart = db.query(DentalChartModel).filter(DentalChartModel.patient_token == patient_token).first()
    if not chart:
        raise HTTPException(status_code=404, detail="Dental Chart not found")
        
    tooth = db.query(ToothModel).filter(
        ToothModel.chart_id == chart.id, 
        ToothModel.tooth_number == tooth_number
    ).first()
    if not tooth:
        raise HTTPException(status_code=404, detail="Tooth number not found in chart")
        
    new_finding = ClinicalFindingModel(
        tooth_id=tooth.id,
        surface_id=finding.surface_id,
        finding_type=finding.finding_type,
        specialty=finding.specialty,
        payload=finding.payload,
        recorded_by=finding.recorded_by
    )
    db.add(new_finding)
    
    # If the finding has a surface and updates its status
    if finding.surface_id and finding.payload:
        surf = db.query(ToothSurfaceModel).filter(ToothSurfaceModel.id == finding.surface_id).first()
        if surf:
            if "condition" in finding.payload:
                surf.condition = finding.payload["condition"]
            if "material" in finding.payload:
                surf.material = finding.payload["material"]
            db.add(surf)
            
    db.commit()
    db.refresh(new_finding)
    return {"status": "success", "id": new_finding.id}

@router.get("/{patient_token}/teeth/{tooth_number}/history", response_model=List[FindingResponseSchema])
def get_tooth_findings_history(
    patient_token: str, 
    tooth_number: int, 
    db: Session = Depends(get_db)
):
    chart = db.query(DentalChartModel).filter(DentalChartModel.patient_token == patient_token).first()
    if not chart:
        raise HTTPException(status_code=404, detail="Dental Chart not found")
        
    tooth = db.query(ToothModel).filter(
        ToothModel.chart_id == chart.id, 
        ToothModel.tooth_number == tooth_number
    ).first()
    if not tooth:
        raise HTTPException(status_code=404, detail="Tooth number not found in chart")
        
    findings = db.query(ClinicalFindingModel).filter(
        ClinicalFindingModel.tooth_id == tooth.id
    ).order_by(ClinicalFindingModel.recorded_at.desc()).all()
    
    return findings
