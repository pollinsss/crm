from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from app.models.order import Order, OrderStatus
from app.models.client import Client


async def get_dashboard_kpis(db: AsyncSession) -> dict:
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    prev_month_start = (month_start - timedelta(days=1)).replace(day=1)

    async def revenue_in_period(start, end):
        result = await db.execute(
            select(func.coalesce(func.sum(Order.final_price), 0)).where(
                and_(
                    Order.status == OrderStatus.COMPLETED,
                    Order.completed_at >= start,
                    Order.completed_at < end,
                )
            )
        )
        return float(result.scalar())

    async def orders_count_in_period(start, end):
        result = await db.execute(
            select(func.count(Order.id)).where(
                and_(Order.created_at >= start, Order.created_at < end)
            )
        )
        return int(result.scalar())

    # KPI текущего месяца
    curr_revenue = await revenue_in_period(month_start, now)
    prev_revenue = await revenue_in_period(prev_month_start, month_start)
    curr_orders = await orders_count_in_period(month_start, now)
    prev_orders = await orders_count_in_period(prev_month_start, month_start)

    # Конверсия: completed / all created this month
    all_created = await db.execute(
        select(func.count(Order.id)).where(Order.created_at >= month_start)
    )
    completed_created = await db.execute(
        select(func.count(Order.id)).where(
            and_(Order.created_at >= month_start, Order.status == OrderStatus.COMPLETED)
        )
    )
    total_created = int(all_created.scalar()) or 1
    total_completed = int(completed_created.scalar())
    conversion = round(total_completed / total_created * 100, 1)

    # Средний чек
    avg_check_res = await db.execute(
        select(func.avg(Order.final_price)).where(
            and_(
                Order.status == OrderStatus.COMPLETED,
                Order.completed_at >= month_start,
            )
        )
    )
    avg_check = float(avg_check_res.scalar() or 0)

    # Маржинальность
    margin_res = await db.execute(
        select(func.avg(Order.margin)).where(
            and_(
                Order.status == OrderStatus.COMPLETED,
                Order.completed_at >= month_start,
            )
        )
    )
    avg_margin = float(margin_res.scalar() or 0)

    # Всего клиентов
    clients_count = await db.execute(select(func.count(Client.id)))

    # Активные заказы по статусам
    active_by_status = {}
    for st in OrderStatus:
        if st in (OrderStatus.COMPLETED, OrderStatus.CANCELLED):
            continue
        cnt = await db.execute(select(func.count(Order.id)).where(Order.status == st))
        active_by_status[st.value] = int(cnt.scalar())

    return {
        "revenue": {
            "current": curr_revenue,
            "previous": prev_revenue,
            "delta_pct": round((curr_revenue - prev_revenue) / (prev_revenue or 1) * 100, 1),
        },
        "orders": {
            "current": curr_orders,
            "previous": prev_orders,
            "delta": curr_orders - prev_orders,
        },
        "conversion": conversion,
        "avg_check": avg_check,
        "avg_margin": round(avg_margin, 1),
        "clients_total": int(clients_count.scalar()),
        "active_by_status": active_by_status,
    }


async def get_revenue_by_month(db: AsyncSession, months: int = 6) -> list[dict]:
    """Выручка за последние N месяцев"""
    results = []
    now = datetime.now(timezone.utc)
    for i in range(months - 1, -1, -1):
        ref = now.replace(day=1) - timedelta(days=i * 28)
        period_start = ref.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if ref.month == 12:
            period_end = period_start.replace(year=ref.year + 1, month=1)
        else:
            period_end = period_start.replace(month=ref.month + 1)

        rev = await db.execute(
            select(func.coalesce(func.sum(Order.final_price), 0)).where(
                and_(
                    Order.status == OrderStatus.COMPLETED,
                    Order.completed_at >= period_start,
                    Order.completed_at < period_end,
                )
            )
        )
        results.append({
            "month": period_start.strftime("%Y-%m"),
            "label": period_start.strftime("%b %Y"),
            "revenue": float(rev.scalar()),
        })
    return results
