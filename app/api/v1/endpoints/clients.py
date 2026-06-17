from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.client import Client, ClientSegment
from app.models.user import User
from app.schemas.client import ClientCreate, ClientUpdate, ClientOut, ClientList

router = APIRouter(prefix="/clients", tags=["clients"])


@router.get("", response_model=ClientList)
async def list_clients(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    segment: ClientSegment | None = None,
    search: str | None = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = select(Client).where(Client.is_active == True)
    if segment:
        q = q.where(Client.segment == segment)
    if search:
        q = q.where(
            or_(
                Client.full_name.ilike(f"%{search}%"),
                Client.phone.ilike(f"%{search}%"),
                Client.company_name.ilike(f"%{search}%"),
            )
        )
    total_result = await db.execute(select(func.count()).select_from(q.subquery()))
    total = int(total_result.scalar())

    result = await db.execute(q.offset((page - 1) * size).limit(size).order_by(Client.full_name))
    items = result.scalars().all()
    return ClientList(items=items, total=total, page=page, size=size)


@router.post("", response_model=ClientOut, status_code=201)
async def create_client(
    data: ClientCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    client = Client(**data.model_dump())
    db.add(client)
    await db.flush()
    return client


@router.get("/{client_id}", response_model=ClientOut)
async def get_client(
    client_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(select(Client).where(Client.id == client_id))
    client = result.scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=404, detail="Клиент не найден")
    return client


@router.patch("/{client_id}", response_model=ClientOut)
async def update_client(
    client_id: int,
    data: ClientUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(select(Client).where(Client.id == client_id))
    client = result.scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=404, detail="Клиент не найден")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(client, field, value)
    return client


@router.delete("/{client_id}", status_code=204)
async def delete_client(
    client_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(select(Client).where(Client.id == client_id))
    client = result.scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=404, detail="Клиент не найден")
    client.is_active = False  # мягкое удаление
