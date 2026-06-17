from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Annotated

from app.core.database import get_db
from app.core.security import verify_password, create_access_token, hash_password, get_current_user
from app.models.user import User
from app.schemas.user import Token, UserCreate, UserOut


class UserListItem(BaseModel):
    id: int
    full_name: str
    email: str
    role: str

    model_config = {"from_attributes": True}


router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/users", response_model=list[UserListItem])
async def list_users(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(select(User).where(User.is_active == True).order_by(User.full_name))
    return result.scalars().all()


@router.post("/token", response_model=Token)
async def login(
    form: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.email == form.username))
    user = result.scalar_one_or_none()
    if not user or not verify_password(form.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный email или пароль",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Пользователь деактивирован")

    user.last_login = datetime.now(timezone.utc)
    access_token = create_access_token({"sub": str(user.id), "role": user.role.value, "full_name": user.full_name})
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/register", response_model=UserOut, status_code=201)
async def register(data: Annotated[UserCreate, Query()], db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email уже зарегистрирован")
    user = User(
        email=data.email,
        full_name=data.full_name,
        role=data.role,
        hashed_password=hash_password(data.password),
    )
    db.add(user)
    await db.flush()
    return user
