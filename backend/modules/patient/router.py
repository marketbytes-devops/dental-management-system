# router.py - all /patient/* endpoints
from fastapi import APIRouter

router = APIRouter(prefix="/patient", tags=["patient"])
