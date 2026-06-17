from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status

from app.models.order import Order, OrderStatus, OrderStatusHistory, VALID_TRANSITIONS, STATUS_LABELS
from app.models.client import Client
from app.schemas.order import OrderCreate, OrderUpdate, OrderStatusChange


async def generate_order_number(db: AsyncSession) -> str:
    year = datetime.now().year
    result = await db.execute(
        select(func.count(Order.id)).where(
            func.extract("year", Order.created_at) == year
        )
    )
    count = result.scalar() + 1
    return f"ORD-{year}-{count:04d}"


def calculate_financials(order: Order) -> None:
    """Пересчитать финансовые показатели заказа"""
    order.final_price = order.price * (1 - order.discount / 100)
    if order.final_price > 0 and order.cost_price > 0:
        order.margin = round((order.final_price - order.cost_price) / order.final_price * 100, 2)
    else:
        order.margin = 0.0


async def create_order(db: AsyncSession, data: OrderCreate, current_user_id: int) -> Order:
    order = Order(
        order_number=await generate_order_number(db),
        client_id=data.client_id,
        manager_id=data.manager_id or current_user_id,
        furniture_type=data.furniture_type,
        title=data.title,
        description=data.description,
        price=data.price,
        cost_price=data.cost_price,
        discount=data.discount,
        specifications=data.specifications,
        measurement_date=data.measurement_date,
        production_deadline=data.production_deadline,
        delivery_date=data.delivery_date,
        delivery_address=data.delivery_address,
    )
    calculate_financials(order)

    # Записать первый статус
    history = OrderStatusHistory(
        to_status=OrderStatus.INQUIRY.value,
        comment="Заказ создан",
        changed_by_id=current_user_id,
    )
    order.status_history = [history]

    db.add(order)
    await db.flush()
    return order


async def get_order(db: AsyncSession, order_id: int) -> Order:
    result = await db.execute(
        select(Order).options(selectinload(Order.status_history)).where(Order.id == order_id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Заказ не найден")
    return order


async def update_order(db: AsyncSession, order_id: int, data: OrderUpdate) -> Order:
    order = await get_order(db, order_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(order, field, value)
    calculate_financials(order)
    return order


async def change_status(
    db: AsyncSession, order_id: int, data: OrderStatusChange, current_user_id: int
) -> Order:
    order = await get_order(db, order_id)

    allowed = VALID_TRANSITIONS.get(order.status, [])
    if data.status not in allowed:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=f"Переход из «{STATUS_LABELS[order.status]}» в «{STATUS_LABELS[data.status]}» недопустим",
        )

    history = OrderStatusHistory(
        order_id=order.id,
        from_status=order.status.value,
        to_status=data.status.value,
        comment=data.comment,
        changed_by_id=current_user_id,
    )
    db.add(history)

    order.status = data.status
    if data.status == OrderStatus.COMPLETED:
        order.completed_at = datetime.now(timezone.utc)

        # Начислить бонусы клиенту (1% от суммы)
        result = await db.execute(select(Client).where(Client.id == order.client_id))
        client = result.scalar_one_or_none()
        if client:
            client.bonus_points += int(order.final_price * 0.01)
            client.total_spent += order.final_price
            # Автосегментация
            if client.total_spent >= 500_000:
                client.segment = "vip"
            elif client.company_name:
                client.segment = "b2b"

    return order


async def get_pipeline(db: AsyncSession) -> dict:
    """Данные для воронки продаж"""
    pipeline = {}
    for st in OrderStatus:
        if st in (OrderStatus.CANCELLED,):
            continue
        result = await db.execute(
            select(Order).options(selectinload(Order.status_history)).where(Order.status == st)
        )
        orders = result.scalars().all()
        pipeline[st] = {
            "status": st,
            "label": STATUS_LABELS[st],
            "count": len(orders),
            "total_amount": sum(o.final_price for o in orders),
            "orders": orders,
        }
    return pipeline


async def get_orders_list(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 20,
    status: OrderStatus | None = None,
    client_id: int | None = None,
    manager_id: int | None = None,
) -> tuple[list[Order], int]:
    q = select(Order).options(selectinload(Order.status_history))
    conditions = []
    if status:
        conditions.append(Order.status == status)
    if client_id:
        conditions.append(Order.client_id == client_id)
    if manager_id:
        conditions.append(Order.manager_id == manager_id)
    if conditions:
        q = q.where(and_(*conditions))

    total_result = await db.execute(select(func.count()).select_from(q.subquery()))
    total = total_result.scalar()

    result = await db.execute(q.offset(skip).limit(limit).order_by(Order.created_at.desc()))
    return result.scalars().all(), total
