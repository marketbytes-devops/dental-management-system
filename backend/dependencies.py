# dependencies.py - Shared authentication & session dependencies
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from shared.utils.auth import verify_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="patient/login")


def get_current_user(token: str = Depends(oauth2_scheme)):

    payload = verify_token(token)

    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )

    return payload