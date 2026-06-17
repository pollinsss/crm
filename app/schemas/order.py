from datetime import datetime, date
from pydantic import BaseModel, model_validator
from app.models.order import OrderStatus, FurnitureType


class OrderSpecifications(BaseModel):
    width_mm: int | None = None
    height_mm: int | None = None
    depth_mm: int | None = None
    material: str | None = None
    color: str | None = None
    hardware: str | None = None
    extra: dict | None = None


class OrderBase(BaseModel):
    client_id: int
    furniture_type: FurnitureType
    title: str
    description: str | None = None
    price: float = 0.0
    cost_price: float = 0.0
    discount: float = 0.0
    specifications: dict | None = None
    measurement_date: date | None = None
    production_deadline: date | None = None
    delivery_date: date | None = None
    delivery_address: str | None = None


class OrderCreate(OrderBase):
    manager_id: int | None = None


class OrderUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    price: float | None = None
    cost_price: float | None = None
    discount: float | None = None
    specifications: dict | None = None
    measurement_date: date | None = None
    production_deadline: date | None = None
    delivery_date: date | None = None
    assembly_date: date | None = None
    delivery_address: str | None = None


class OrderStatusChange(BaseModel):
    status: OrderStatus
    comment: str | None = None


class OrderStatusHistoryOut(BaseModel):
    from_status: str | None
    to_status: str
    comment: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class OrderOut(OrderBase):
    id: int
    order_number: str
    manager_id: int
    status: OrderStatus
    final_price: float
    margin: float
    assembly_date: date | None = None
    completed_at: datetime | None = None
    created_at: datetime
    updated_at: datetime
    status_history: list[OrderStatusHistoryOut] = []

    model_config = {"from_attributes": True}


class OrderList(BaseModel):
    items: list[OrderOut]
    total: int
    page: int
    size: int


class PipelineStage(BaseModel):
    status: OrderStatus
    label: str
    count: int
    total_amount: float
    orders: list[OrderOut]
