# router.py - all /admin/* endpoints
from fastapi import APIRouter

router = APIRouter(prefix="/admin", tags=["admin"])
