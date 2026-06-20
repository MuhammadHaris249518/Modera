from pydantic import BaseModel, EmailStr, Field
from enum import Enum
from datetime import datetime

class RoleEnum(str, Enum):
    USER = "USER"
    ADMIN = "ADMIN"

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    role: RoleEnum
    is_active: bool
    created_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    sub: str
    role: RoleEnum


class CurrentUser(BaseModel):
    id: str
    email: EmailStr
    role: RoleEnum
    is_active: bool
