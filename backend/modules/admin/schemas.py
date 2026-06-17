# schemas.py - Pydantic request/response models
from pydantic import BaseModel

class AdminUserBase(BaseModel):
    username: str
    role: str
