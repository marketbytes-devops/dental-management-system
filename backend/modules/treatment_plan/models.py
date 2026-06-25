from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from database import Base

class TreatmentPlanModel(Base):
    __tablename__ = "treatment_plans"

    id = Column(Integer, primary_key=True, index=True)
    patient_token = Column(String, index=True, nullable=False)
    doctor_name = Column(String, nullable=False)
    current_conditions = Column(String, nullable=False)
    diagnoses = Column(JSON, nullable=True)  # List of strings e.g. ["Deep bite", ...]
    treatment_objectives = Column(JSON, nullable=True)  # List of strings e.g. ["Align upper teeth", ...]
    estimated_duration = Column(String, nullable=True)  # e.g. "18 months"
    expected_completion = Column(String, nullable=True)  # e.g. "March 2028"
    next_visit_date = Column(String, nullable=True)
    next_visit_procedure = Column(String, nullable=True)
    attachments = Column(JSON, nullable=True)  # List of objects e.g. [{"name": "OPG", "url": "/static/..."}]
    status = Column(String, default="Draft")  # Draft, Active, Archived
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class TreatmentPlanStepModel(Base):
    __tablename__ = "treatment_plan_steps"

    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(Integer, ForeignKey("treatment_plans.id", ondelete="CASCADE"), nullable=False)
    phase = Column(String, nullable=True)  # e.g. "Phase 1: Initial records"
    sequence = Column(Integer, default=1)
    title = Column(String, nullable=False)
    details = Column(String, nullable=True)
    notes = Column(String, nullable=True)  # Step-specific notes
    cost = Column(Integer, default=0)
    requires_consent = Column(Boolean, default=False)
    consent_id = Column(Integer, nullable=True)  # Links to patient_consents.id
    consent_status = Column(String, default="Not Required")  # Not Required, Pending, Given, Denied
    consent_given_at = Column(DateTime(timezone=True), nullable=True)
    status = Column(String, default="Planned")  # Planned, Scheduled, In Progress, Completed, Deferred, Cancelled
    created_at = Column(DateTime(timezone=True), server_default=func.now())
