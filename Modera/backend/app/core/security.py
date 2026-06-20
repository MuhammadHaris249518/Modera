from datetime import datetime, timedelta
from typing import Callable

import bcrypt
from bson import ObjectId
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt

from app.core.database import get_db
from .config import settings
from app.models.user import CurrentUser, RoleEnum, TokenData

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a bcrypt hash."""
    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        hashed_password.encode("utf-8") if not isinstance(hashed_password, bytes) else hashed_password,
    )


def get_password_hash(password: str) -> str:
    """Hash a password using bcrypt with a generated salt."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def create_access_token(data: dict, expires_delta: timedelta | None = None):
    if not settings.SECRET_KEY:
        raise RuntimeError("SECRET_KEY is not configured")

    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


async def get_current_user(token: str = Depends(oauth2_scheme), db=Depends(get_db)) -> CurrentUser:
    if not settings.SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication is not configured.",
        )

    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        token_data = TokenData(
            sub=payload.get("sub"),
            role=RoleEnum(payload.get("role")),
        )
    except (JWTError, TypeError, ValueError):
        raise credentials_error

    try:
        user_id = ObjectId(token_data.sub)
    except Exception:
        raise credentials_error

    user = await db.users.find_one({"_id": user_id})
    if not user or not user.get("is_active", False):
        raise credentials_error

    return CurrentUser(
        id=str(user["_id"]),
        email=user["email"],
        role=RoleEnum(user.get("role", token_data.role)),
        is_active=bool(user.get("is_active", False)),
    )


def require_role(*allowed_roles: RoleEnum) -> Callable:
    async def _role_dependency(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action.",
            )
        return current_user

    return _role_dependency