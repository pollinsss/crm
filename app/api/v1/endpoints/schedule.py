from datetime import date
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from pydantic import BaseModel
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.misc import ScheduleEvent
from app.models.user import User

router = APIRouter(prefix="/schedule", tags=["schedule"])


class EventCreate(BaseModel):
    event_type: str  # measurement / delivery / assembly
    order_id: int | None = None
    assigned_user_id: int | None = None
    title: str
    address: str | None = None
    scheduled_at: datetime
    duration_minutes: int = 60
    notes: str | None = None


class EventOut(BaseModel):
    id: int
    event_type: str
    order_id: int | None
    assigned_user_id: int | None
    title: str
    address: str | None
    scheduled_at: datetime
    duration_minutes: int
    is_completed: bool
    notes: str | None

    model_config = {"from_attributes": True}


@router.get("", response_model=list[EventOut])
async def get_events(
    date_from: date = Query(...),
    date_to: date = Query(...),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(
        select(ScheduleEvent).where(
            and_(
                ScheduleEvent.scheduled_at >= date_from,
                ScheduleEvent.scheduled_at <= date_to,
            )
        ).order_by(ScheduleEvent.scheduled_at)
    )
    return result.scalars().all()


@router.post("", response_model=EventOut, status_code=201)
async def create_event(
    data: EventCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    event = ScheduleEvent(**data.model_dump())
    db.add(event)
    await db.flush()
    return event


@router.patch("/{event_id}/complete", response_model=EventOut)
async def complete_event(
    event_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(select(ScheduleEvent).where(ScheduleEvent.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Событие не найдено")
    event.is_completed = True
    return event
