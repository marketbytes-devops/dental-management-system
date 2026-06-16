# router.py - all /lab/* endpoints
from fastapi import APIRouter

router = APIRouter(prefix="/lab", tags=["lab"])
