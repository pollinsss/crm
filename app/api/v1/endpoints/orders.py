from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.order import OrderStatus
from app.models.user import User
from app.schemas.order import OrderCreate, OrderUpdate, OrderOut, OrderList, OrderStatusChange, PipelineStage
from app.services import order_service

router = APIRouter(prefix="/orders", tags=["orders"])


@router.get("", response_model=OrderList)
async def list_orders(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    status: OrderStatus | None = None,
    client_id: int | None = None,
    manager_id: int | None = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    items, total = await order_service.get_orders_list(
        db, skip=(page - 1) * size, limit=size,
        status=status, client_id=client_id, manager_id=manager_id,
    )
    return OrderList(items=items, total=total, page=page, size=size)


@router.post("", response_model=OrderOut, status_code=201)
async def create_order(
    data: OrderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await order_service.create_order(db, data, current_user.id)


@router.get("/pipeline", response_model=list[PipelineStage])
async def get_pipeline(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    pipeline = await order_service.get_pipeline(db)
    return list(pipeline.values())


@router.get("/{order_id}", response_model=OrderOut)
async def get_order(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return await order_service.get_order(db, order_id)


@router.patch("/{order_id}", response_model=OrderOut)
async def update_order(
    order_id: int,
    data: OrderUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return await order_service.update_order(db, order_id, data)


@router.post("/{order_id}/status", response_model=OrderOut)
async def change_status(
    order_id: int,
    data: OrderStatusChange,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await order_service.change_status(db, order_id, data, current_user.id)
