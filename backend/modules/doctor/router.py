# router.py - all /doctor/* endpoints
from fastapi import APIRouter

router = APIRouter(prefix="/doctor", tags=["doctor"])
