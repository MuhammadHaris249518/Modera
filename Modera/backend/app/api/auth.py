from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from datetime import datetime, timedelta
from app.models.user import UserCreate, UserResponse, Token, RoleEnum
from app.core.security import get_password_hash, verify_password, create_access_token
from app.core.database import get_db
from app.core.config import settings

router = APIRouter()

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user: UserCreate, db=Depends(get_db)):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    hashed_password = get_password_hash(user.password)
    new_user = {
        "email": user.email,
        "password_hash": hashed_password,
        "role": RoleEnum.USER.value,
        "is_active": True,
        "created_at": datetime.utcnow()
    }
    
    result = await db.users.insert_one(new_user)
    
    return {
        "id": str(result.inserted_id),
        "email": user.email,
        "role": RoleEnum.USER,
        "is_active": True,
        "created_at": new_user["created_at"]
    }

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db=Depends(get_db)):
    user = await db.users.find_one({"email": form_data.username})
    if not user or not verify_password(form_data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    role_value = user["role"].value if hasattr(user["role"], "value") else str(user["role"])
    access_token = create_access_token(
        data={"sub": str(user["_id"]), "role": role_value}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}
