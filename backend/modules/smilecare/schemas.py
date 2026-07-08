from pydantic import BaseModel
from typing import List, Optional, Any
from datetime import datetime

class FindingCreateSchema(BaseModel):
    finding_type: str
    specialty: str
    payload: Optional[Any] = None
    recorded_by: str
    surface_id: Optional[int] = None

class FindingResponseSchema(BaseModel):
    id: int
    tooth_id: int
    surface_id: Optional[int] = None
    finding_type: str
    specialty: str
    payload: Optional[Any] = None
    recorded_by: str
    recorded_at: datetime

    class Config:
        from_attributes = True

class SurfaceResponseSchema(BaseModel):
    id: int
    tooth_id: int
    surface_code: str
    condition: str
    material: str

    class Config:
        from_attributes = True

class ToothResponseSchema(BaseModel):
    id: int
    tooth_number: int
    tooth_type: str
    status: str
    root_count: int
    surfaces: List[SurfaceResponseSchema] = []
    findings: List[FindingResponseSchema] = []

    class Config:
        from_attributes = True

class ChartResponseSchema(BaseModel):
    id: int
    patient_token: str
    is_active: bool
    created_at: datetime
    teeth: List[ToothResponseSchema] = []

    class Config:
        from_attributes = True
