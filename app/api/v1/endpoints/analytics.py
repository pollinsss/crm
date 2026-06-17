from datetime import date
from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.services import analytics_service, report_service

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/dashboard")
async def dashboard(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return await analytics_service.get_dashboard_kpis(db)


@router.get("/revenue-by-month")
async def revenue_chart(
    months: int = Query(6, ge=1, le=24),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return await analytics_service.get_revenue_by_month(db, months)


@router.get("/report/pdf")
async def report_pdf(
    date_from: date = Query(...),
    date_to: date = Query(...),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    orders = await report_service.fetch_orders_for_period(db, date_from, date_to)
    pdf_bytes = report_service.generate_pdf_report(orders, date_from, date_to)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=report_{date_from}_{date_to}.pdf"},
    )


@router.get("/report/excel")
async def report_excel(
    date_from: date = Query(...),
    date_to: date = Query(...),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    orders = await report_service.fetch_orders_for_period(db, date_from, date_to)
    xlsx_bytes = report_service.generate_excel_report(orders, date_from, date_to)
    return Response(
        content=xlsx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=report_{date_from}_{date_to}.xlsx"},
    )
