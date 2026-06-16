# router.py - all /frontdesk/* endpoints
from fastapi import APIRouter

router = APIRouter(prefix="/frontdesk", tags=["frontdesk"])
