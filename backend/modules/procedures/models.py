from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
from sqlalchemy.sql import func
from database import Base

class ProcedureModel(Base):
    __tablename__ = "procedures"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, nullable=True, index=True) # e.g. CDT D2740 / Custom Code
    name = Column(String, index=True, nullable=False)
    description = Column(String, nullable=True)
    rate = Column(Float, nullable=False, default=0.0) # Patient Fee
    base_cost = Column(Float, default=0.0) # Internal Clinic Overhead Cost
    lab_required = Column(Boolean, default=False) # Whether lab component is needed
    default_lab_fee = Column(Float, default=0.0) # Estimated Lab Fee component
    tax_category = Column(String, default="Exempt") # Exempt, Standard, Cosmetic
    parent_id = Column(Integer, nullable=True)
    specialty = Column(String, default="General Dentistry")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
