from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class DentalChartModel(Base):
    __tablename__ = "dental_charts"

    id = Column(Integer, primary_key=True, index=True)
    patient_token = Column(String, unique=True, index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=True)

    teeth = relationship("ToothModel", back_populates="chart", cascade="all, delete-orphan")

class ToothModel(Base):
    __tablename__ = "teeth"

    id = Column(Integer, primary_key=True, index=True)
    chart_id = Column(Integer, ForeignKey("dental_charts.id"), nullable=False)
    tooth_number = Column(Integer, nullable=False)  # FDI notation (e.g. 11 to 48)
    tooth_type = Column(String, nullable=False)     # incisor, canine, premolar, molar
    status = Column(String, default="present")       # present, missing, impacted, unerupted
    root_count = Column(Integer, default=1)

    chart = relationship("DentalChartModel", back_populates="teeth")
    surfaces = relationship("ToothSurfaceModel", back_populates="tooth", cascade="all, delete-orphan")
    findings = relationship("ClinicalFindingModel", back_populates="tooth", cascade="all, delete-orphan")

class ToothSurfaceModel(Base):
    __tablename__ = "tooth_surfaces"

    id = Column(Integer, primary_key=True, index=True)
    tooth_id = Column(Integer, ForeignKey("teeth.id"), nullable=False)
    surface_code = Column(String, nullable=False)   # M, D, B, L, O
    condition = Column(String, default="sound")      # sound, caries, filled, crown, fractured
    material = Column(String, default="none")       # composite, amalgam, ceramic, none

    tooth = relationship("ToothModel", back_populates="surfaces")

class ClinicalFindingModel(Base):
    __tablename__ = "clinical_findings"

    id = Column(Integer, primary_key=True, index=True)
    tooth_id = Column(Integer, ForeignKey("teeth.id"), nullable=False)
    surface_id = Column(Integer, ForeignKey("tooth_surfaces.id"), nullable=True)
    finding_type = Column(String, nullable=False)   # perio_pocket, canal_treatment, ortho_bracket
    specialty = Column(String, nullable=False)      # general, perio, endo, prostho, ortho, oral_surgery
    payload = Column(JSON, nullable=True)           # JSONB on Postgres / JSON on SQLite
    recorded_by = Column(String, nullable=False)    # Doctor name
    recorded_at = Column(DateTime(timezone=True), server_default=func.now())

    tooth = relationship("ToothModel", back_populates="findings")
