from datetime import datetime
from pydantic import BaseModel, EmailStr
from app.models.client import ClientSegment


class ClientBase(BaseModel):
    full_name: str
    company_name: str | None = None
    phone: str
    email: EmailStr | None = None
    address: str | None = None
    segment: ClientSegment = ClientSegment.B2C
    preferred_style: str | None = None
    preferred_materials: str | None = None
    notes: str | None = None


class ClientCreate(ClientBase):
    pass


class ClientUpdate(BaseModel):
    full_name: str | None = None
    company_name: str | None = None
    phone: str | None = None
    email: EmailStr | None = None
    address: str | None = None
    segment: ClientSegment | None = None
    preferred_style: str | None = None
    preferred_materials: str | None = None
    notes: str | None = None
    is_active: bool | None = None


class ClientOut(ClientBase):
    id: int
    bonus_points: int
    discount_percent: float
    total_spent: float
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class ClientList(BaseModel):
    items: list[ClientOut]
    total: int
    page: int
    size: int
