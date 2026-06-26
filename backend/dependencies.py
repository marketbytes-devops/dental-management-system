# dependencies.py - Shared authentication & session dependencies
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from shared.utils.auth import verify_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


def get_current_user(token: str = Depends(oauth2_scheme)):

    payload = verify_token(token)

    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )

    return payload


def get_current_active_user(current_user: dict = Depends(get_current_user)):
    if current_user.get("type") != "staff":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden. Staff credentials required."
        )
    return current_user


def require_admin(current_user: dict = Depends(get_current_active_user)):
    roles = [r.lower() for r in current_user.get("roles", [])]
    if "admin" not in roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden. Administrator role required."
        )
    return current_user