from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from typing import List
from database import get_db
from dependencies import get_current_user
from modules.auth.models import UserModel
from modules.patient.models import PatientModel, PatientConsentModel, PatientNotificationModel
from .models import TreatmentPlanModel, TreatmentPlanStepModel
from .schemas import (
    TreatmentPlanCreate,
    TreatmentPlanUpdate,
    TreatmentPlanResponse,
    TreatmentPlanStepCreate,
    TreatmentPlanStepResponse,
    TreatmentPlanStepUpdate,
    TreatmentPlanStatusUpdate,
    StepConsentUpdate
)

router = APIRouter(prefix="/treatment-plan", tags=["treatment-plan"])

def make_consent_content(patient_name, doctor_name, step_title, step_details):
    details_str = f" ({step_details})" if step_details else ""
    title_lower = step_title.lower()
    
    # 1. Endodontics
    if any(kw in title_lower for kw in ["root canal", "rct", "pulpectomy", "pulp", "endodontic"]):
        consent_title = "Informed Consent for Endodontic (Root Canal) Therapy"
        risks = (
            "I understand that root canal treatment is a procedure to retain a tooth which may otherwise require extraction. "
            "The associated risks include post-operative pain or swelling, blockages or curves in canals preventing complete filling, "
            "separation (fracture) of clinical instruments inside the root canals, root perforation, or future treatment failure "
            "which could necessitate surgical intervention or extraction. I understand that a permanent restoration (such as a core buildup "
            "and crown) is highly recommended after treatment to prevent tooth fracture."
        )
    # 2. Orthodontics
    elif any(kw in title_lower for kw in ["ortho", "brackets", "wire", "braces", "aligners", "retainer", "crowding", "bite"]):
        consent_title = "Informed Consent for Orthodontic Treatment"
        risks = (
            "I understand that orthodontic treatment involves the placement of braces, wires, or aligners to reposition teeth. "
            "The associated risks include mild temporary discomfort or pain following adjustments, decalcification (tooth decay) or gum irritation "
            "if oral hygiene is not maintained, root resorption (shortening of tooth roots), jaw joint discomfort (TMJ issues), and the "
            "possibility of tooth movement/relapse after treatment if retainers are not worn strictly as prescribed."
        )
    # 3. Oral Surgery / Extractions
    elif any(kw in title_lower for kw in ["extraction", "surgery", "surgical", "wisdom", "implant", "graft"]):
        consent_title = "Informed Consent for Oral Surgery & Extraction"
        risks = (
            "I understand that oral surgical procedures carry inherent clinical risks. These include temporary or permanent "
            "numbness, tingling, or altered sensation (paresthesia) in the lip, chin, tongue, or teeth due to proximity of nerves; "
            "alveolar osteitis (dry socket) causing severe pain; root tips fracturing or displacement into the maxillary sinus; "
            "infection, bleeding, swelling, or limited jaw opening (trismus) for a temporary period."
        )
    # 4. Periodontics (Deep cleaning, scaling, flap)
    elif any(kw in title_lower for kw in ["scaling", "polishing", "gum", "perio", "flap", "planing", "calculus"]):
        consent_title = "Informed Consent for Periodontal Therapy"
        risks = (
            "I understand that periodontal scaling, root planing, and flap therapies are performed to gum health. "
            "The associated risks include temporary sensitivity of teeth to hot or cold temperatures, increased exposure of tooth root "
            "surfaces due to recession of inflamed gums, transient mobility of teeth, and post-operative discomfort. I understand "
            "that the success of this therapy relies heavily on my personal oral hygiene and attending scheduled maintenance visits."
        )
    # 5. Prosthodontics (Crowns, veneers, bridges, dentures)
    elif any(kw in title_lower for kw in ["crown", "bridge", "denture", "prostho", "veneer", "framework"]):
        consent_title = "Informed Consent for Prosthodontic Restorations"
        risks = (
            "I understand that crown, bridge, and denture fabrications require trimming of teeth and fitting of custom prostheses. "
            "The associated risks include post-treatment tooth sensitivity, transient gum inflammation around the margins, potential need "
            "for future endodontic (root canal) treatment if the pulp becomes inflamed, fracture of porcelain or acrylic material under load, "
            "and future color mismatches as adjacent natural teeth age."
        )
    # 6. Default/General
    else:
        consent_title = "Patient Disclosure & Informed Consent Agreement"
        risks = (
            "I understand that as with any clinical procedure, there are associated risks, including but not limited to post-operative "
            "sensitivity, swelling, local discomfort, or potential failure of the treatment. I acknowledge that no guarantee of outcome "
            "has been made."
        )

    return (
        f"{consent_title}\n\n"
        f"Procedure: {step_title}{details_str}\n"
        f"Attending Dentist: {doctor_name}\n\n"
        f"1. Nature of Procedure: I hereby authorize the dental team, under the supervision of {doctor_name}, to perform {step_title}. The procedure has been explained to me, and I understand its purpose.\n\n"
        f"2. Risks and Complications: {risks}\n\n"
        f"3. Acknowledgment: I have read this consent form, or had it read and explained to me. I have had opportunity to ask questions, and all questions have been answered to my satisfaction. I understand that I am signing this digitally as my legal consent."
    )


@router.post("", response_model=TreatmentPlanResponse)
def create_treatment_plan(
    plan_in: TreatmentPlanCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.get("type") != "staff":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only staff can create treatment plans."
        )

    # Fetch staff name
    staff = db.query(UserModel).filter(UserModel.id == current_user["user_id"]).first()
    doctor_name = staff.name if staff else "Doctor"
    if not doctor_name.startswith("Dr. "):
        doctor_name = f"Dr. {doctor_name}"

    # Verify patient exists
    patient = db.query(PatientModel).filter(PatientModel.token == plan_in.patient_token).first()
    if not patient:
         # Fallback search by ID or handle
         raise HTTPException(
             status_code=status.HTTP_404_NOT_FOUND,
             detail=f"Patient with token {plan_in.patient_token} not found."
         )

    # Create new plan (status defaults to "Draft")
    new_plan = TreatmentPlanModel(
        patient_token=plan_in.patient_token,
        doctor_name=doctor_name,
        current_conditions=plan_in.current_conditions,
        diagnoses=plan_in.diagnoses,
        treatment_objectives=plan_in.treatment_objectives,
        estimated_duration=plan_in.estimated_duration,
        expected_completion=plan_in.expected_completion,
        next_visit_date=plan_in.next_visit_date,
        next_visit_procedure=plan_in.next_visit_procedure,
        attachments=plan_in.attachments,
        status="Draft"
    )
    db.add(new_plan)
    db.commit()
    db.refresh(new_plan)

    # Add steps
    for s_in in plan_in.steps:
        # Determine consent status
        c_status = "Pending" if s_in.requires_consent else "Not Required"
        step = TreatmentPlanStepModel(
            plan_id=new_plan.id,
            phase=s_in.phase or "Phase 1: Initial records",
            sequence=s_in.sequence or 1,
            title=s_in.title,
            details=s_in.details,
            notes=s_in.notes,
            cost=s_in.cost,
            requires_consent=s_in.requires_consent,
            consent_status=c_status,
            status="Planned"
        )
        db.add(step)
        db.commit()
        db.refresh(step)

        if s_in.requires_consent:
            existing = db.query(PatientConsentModel).filter(PatientConsentModel.step_id == step.id).first()
            if not existing:
                content = make_consent_content(patient.name, doctor_name, step.title, step.details)
                consent = PatientConsentModel(
                    patient_id=patient.id,
                    patient_token=plan_in.patient_token,
                    doctor_name=doctor_name,
                    procedure_name=step.title,
                    treatment_plan_id=new_plan.id,
                    step_id=step.id,
                    title=f"Consent Form: {step.title}",
                    content=content,
                    status="PENDING"
                )
                db.add(consent)
                db.commit()
                db.refresh(consent)

                step.consent_id = consent.id
                db.commit()

    # Fetch steps and set on return object
    new_plan.steps = db.query(TreatmentPlanStepModel).filter(TreatmentPlanStepModel.plan_id == new_plan.id).all()
    return new_plan


@router.put("/{plan_id}", response_model=TreatmentPlanResponse)
def update_treatment_plan(
    plan_id: int,
    plan_update: TreatmentPlanUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.get("type") != "staff":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only staff can edit treatment plans."
        )

    plan = db.query(TreatmentPlanModel).filter(TreatmentPlanModel.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Treatment plan not found")

    update_data = plan_update.model_dump(exclude_unset=True)
    
    # If plan is transitioning to "Active", archive any existing active plans for this patient
    if update_data.get("status") == "Active" and plan.status != "Active":
        db.query(TreatmentPlanModel).filter(
            TreatmentPlanModel.patient_token == plan.patient_token,
            TreatmentPlanModel.status == "Active"
        ).update({"status": "Archived"})
        db.commit()

    # Update attending doctor name to the logged in doctor modifying the plan
    staff = db.query(UserModel).filter(UserModel.id == current_user["user_id"]).first()
    raw_name = str(staff.name) if (staff and staff.name) else "Doctor"
    doctor_name = raw_name if raw_name.startswith("Dr. ") else f"Dr. {raw_name}"
    plan.doctor_name = doctor_name

    for key, val in update_data.items():
        setattr(plan, key, val)
    db.commit()

    # If active/finalized, auto-create/update consent requests for steps requiring consent
    if plan.status == "Active":
        patient = db.query(PatientModel).filter(PatientModel.token == plan.patient_token).first()
        patient_name = patient.name if patient else "Patient"
        
        steps = db.query(TreatmentPlanStepModel).filter(TreatmentPlanStepModel.plan_id == plan.id).all()
        for step in steps:
            if step.requires_consent:
                need_new = False
                new_content = make_consent_content(patient_name, plan.doctor_name, step.title, step.details)
                
                if not step.consent_id:
                    need_new = True
                else:
                    existing = db.query(PatientConsentModel).filter(PatientConsentModel.id == step.consent_id).first()
                    if not existing:
                        need_new = True
                    elif existing.content != new_content:
                        need_new = True

                if need_new:
                    # Create a brand new consent request record
                    consent = PatientConsentModel(
                        patient_id=patient.id if patient else None,
                        patient_token=plan.patient_token,
                        treatment_plan_id=plan.id,
                        step_id=step.id,
                        title=f"Consent Form: {step.title}",
                        content=new_content,
                        status="PENDING"
                    )
                    db.add(consent)
                    db.commit()
                    db.refresh(consent)
                    
                    step.consent_id = consent.id
                    step.consent_status = "Pending"
                    db.commit()

        # Trigger patient notification
        notif = PatientNotificationModel(
            patient_token=plan.patient_token,
            sender_role="doctor",
            type="treatment_plan",
            title="Treatment Plan Updated",
            message=f"Your treatment plan has been updated by {plan.doctor_name}.",
            read=False
        )
        db.add(notif)
        db.commit()

    db.refresh(plan)
    plan.steps = db.query(TreatmentPlanStepModel).filter(
        TreatmentPlanStepModel.plan_id == plan.id
    ).order_by(TreatmentPlanStepModel.sequence.asc(), TreatmentPlanStepModel.created_at.asc()).all()
    
    return plan


@router.get("/patient/{patient_token}", response_model=List[TreatmentPlanResponse])
def get_treatment_plans(
    patient_token: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.get("type") == "patient":
        patient = db.query(PatientModel).filter(PatientModel.id == current_user.get("patient_id")).first()
        if not patient or patient.token != patient_token:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to these records."
            )

    plans = db.query(TreatmentPlanModel).filter(
        TreatmentPlanModel.patient_token == patient_token
    ).order_by(TreatmentPlanModel.created_at.desc()).all()

    for plan in plans:
        plan.steps = db.query(TreatmentPlanStepModel).filter(
            TreatmentPlanStepModel.plan_id == plan.id
        ).order_by(TreatmentPlanStepModel.sequence.asc(), TreatmentPlanStepModel.created_at.asc()).all()

    return plans


@router.post("/{plan_id}/step", response_model=TreatmentPlanStepResponse)
def add_step_to_plan(
    plan_id: int,
    step_in: TreatmentPlanStepCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.get("type") != "staff":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only staff can modify treatment plans."
        )

    plan = db.query(TreatmentPlanModel).filter(TreatmentPlanModel.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Treatment plan not found")

    c_status = "Pending" if step_in.requires_consent else "Not Required"
    step = TreatmentPlanStepModel(
        plan_id=plan_id,
        phase=step_in.phase or "Phase 1: Initial records",
        sequence=step_in.sequence or 1,
        title=step_in.title,
        details=step_in.details,
        notes=step_in.notes,
        cost=step_in.cost,
        requires_consent=step_in.requires_consent,
        consent_status=c_status,
        status="Planned"
    )
    db.add(step)
    db.commit()
    db.refresh(step)

    # Generate consent instantly if step requires consent and no consent exists yet
    if step.requires_consent and not step.consent_id:
        existing = db.query(PatientConsentModel).filter(PatientConsentModel.step_id == step.id).first()
        if not existing:
            patient = db.query(PatientModel).filter(PatientModel.token == plan.patient_token).first()
            patient_name = patient.name if patient else "Patient"
            
            consent = PatientConsentModel(
                patient_id=patient.id if patient else None,
                patient_token=plan.patient_token,
                doctor_name=plan.doctor_name,
                procedure_name=step.title,
                treatment_plan_id=plan.id,
                step_id=step.id,
                title=f"Consent Form: {step.title}",
                content=make_consent_content(patient_name, plan.doctor_name, step.title, step.details),
                status="PENDING"
            )
            db.add(consent)
            db.commit()
            db.refresh(consent)
            
            step.consent_id = consent.id
            db.commit()
            db.refresh(step)
        else:
            step.consent_id = existing.id
            db.commit()
            db.refresh(step)

    return step


@router.put("/step/{step_id}", response_model=TreatmentPlanStepResponse)
def update_step(
    step_id: int,
    step_update: TreatmentPlanStepUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.get("type") != "staff":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only staff can update step details."
        )

    step = db.query(TreatmentPlanStepModel).filter(TreatmentPlanStepModel.id == step_id).first()
    if not step:
        raise HTTPException(status_code=404, detail="Step not found")

    update_data = step_update.model_dump(exclude_unset=True)
    
    # Handle requires_consent toggling
    if "requires_consent" in update_data:
        requires_c = update_data["requires_consent"]
        if requires_c and not step.requires_consent:
            # Plan status checking
            plan = db.query(TreatmentPlanModel).filter(TreatmentPlanModel.id == step.plan_id).first()
            if plan and plan.status == "Active" and not step.consent_id:
                patient = db.query(PatientModel).filter(PatientModel.token == plan.patient_token).first()
                patient_name = patient.name if patient else "Patient"
                
                consent = PatientConsentModel(
                    patient_id=patient.id if patient else None,
                    patient_token=plan.patient_token,
                    treatment_plan_id=plan.id,
                    step_id=step.id,
                    title=f"Consent Form: {step.title}",
                    content=make_consent_content(patient_name, plan.doctor_name, step.title, step.details or ""),
                    status="PENDING"
                )
                db.add(consent)
                db.commit()
                db.refresh(consent)
                step.consent_id = consent.id
                step.consent_status = "Pending"
        elif not requires_c:
            step.consent_status = "Not Required"

    for key, val in update_data.items():
        setattr(step, key, val)

    db.commit()
    db.refresh(step)
    return step


@router.put("/{plan_id}/status", response_model=TreatmentPlanResponse)
def update_plan_status(
    plan_id: int,
    status_update: TreatmentPlanStatusUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.get("type") != "staff":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only staff can update plan status."
        )

    plan = db.query(TreatmentPlanModel).filter(TreatmentPlanModel.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Treatment plan not found")

    # If transitioning to "Active", archive other active plans for this patient
    if status_update.status == "Active" and plan.status != "Active":
        db.query(TreatmentPlanModel).filter(
            TreatmentPlanModel.patient_token == plan.patient_token,
            TreatmentPlanModel.status == "Active"
        ).update({"status": "Archived"})
    # Update attending doctor name to the logged in doctor activating the plan
    staff = db.query(UserModel).filter(UserModel.id == current_user["user_id"]).first()
    raw_name = str(staff.name) if (staff and staff.name) else "Doctor"
    doctor_name = raw_name if raw_name.startswith("Dr. ") else f"Dr. {raw_name}"
    plan.doctor_name = doctor_name

    plan.status = status_update.status
    db.commit()

    # If finalized, generate consents
    if plan.status == "Active":
        patient = db.query(PatientModel).filter(PatientModel.token == plan.patient_token).first()
        patient_name = patient.name if patient else "Patient"
        
        steps = db.query(TreatmentPlanStepModel).filter(TreatmentPlanStepModel.plan_id == plan.id).all()
        for step in steps:
            if step.requires_consent:
                need_new = False
                new_content = make_consent_content(patient_name, plan.doctor_name, step.title, step.details)
                
                if not step.consent_id:
                    need_new = True
                else:
                    existing = db.query(PatientConsentModel).filter(PatientConsentModel.id == step.consent_id).first()
                    if not existing:
                        need_new = True
                    elif existing.content != new_content:
                        need_new = True

                if need_new:
                    consent = PatientConsentModel(
                        patient_id=patient.id if patient else None,
                        patient_token=plan.patient_token,
                        treatment_plan_id=plan.id,
                        step_id=step.id,
                        title=f"Consent Form: {step.title}",
                        content=new_content,
                        status="PENDING"
                    )
                    db.add(consent)
                    db.commit()
                    db.refresh(consent)
                    
                    step.consent_id = consent.id
                    step.consent_status = "Pending"
                    db.commit()

        # Trigger patient notification
        notif = PatientNotificationModel(
            patient_token=plan.patient_token,
            sender_role="doctor",
            type="treatment_plan",
            title="Treatment Plan Activated",
            message=f"Your treatment plan has been activated by {plan.doctor_name}.",
            read=False
        )
        db.add(notif)
        db.commit()

    db.refresh(plan)
    plan.steps = db.query(TreatmentPlanStepModel).filter(TreatmentPlanStepModel.plan_id == plan.id).all()
    return plan
