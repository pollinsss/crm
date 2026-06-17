import enum
from datetime import datetime, timezone
from sqlalchemy import String, Text, Enum, DateTime, Integer, Float, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class OrderStatus(str, enum.Enum):
    INQUIRY = "inquiry"
    MEASUREMENT = "measurement"
    DESIGN = "design"
    PRODUCTION = "production"
    READY = "ready"
    DELIVERY = "delivery"
    ASSEMBLY = "assembly"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class FurnitureType(str, enum.Enum):
    KITCHEN = "kitchen"
    WARDROBE = "wardrobe"
    BED = "bed"
    TABLE = "table"
    CHAIR = "chair"
    SOFA = "sofa"
    HALLWAY = "hallway"
    OTHER = "other"


STATUS_LABELS = {
    OrderStatus.INQUIRY: "Заявка",
    OrderStatus.MEASUREMENT: "Замер",
    OrderStatus.DESIGN: "Дизайн",
    OrderStatus.PRODUCTION: "Производство",
    OrderStatus.READY: "Готов",
    OrderStatus.DELIVERY: "Доставка",
    OrderStatus.ASSEMBLY: "Сборка",
    OrderStatus.COMPLETED: "Выполнен",
    OrderStatus.CANCELLED: "Отменён",
}

VALID_TRANSITIONS = {
    OrderStatus.INQUIRY: [OrderStatus.MEASUREMENT, OrderStatus.CANCELLED],
    OrderStatus.MEASUREMENT: [OrderStatus.DESIGN, OrderStatus.CANCELLED],
    OrderStatus.DESIGN: [OrderStatus.PRODUCTION, OrderStatus.CANCELLED],
    OrderStatus.PRODUCTION: [OrderStatus.READY, OrderStatus.CANCELLED],
    OrderStatus.READY: [OrderStatus.DELIVERY],
    OrderStatus.DELIVERY: [OrderStatus.ASSEMBLY],
    OrderStatus.ASSEMBLY: [OrderStatus.COMPLETED],
    OrderStatus.COMPLETED: [],
    OrderStatus.CANCELLED: [],
}


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    order_number: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)

    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id"), nullable=False)
    manager_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)

    furniture_type: Mapped[FurnitureType] = mapped_column(
        Enum(FurnitureType), nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Финансы
    price: Mapped[float] = mapped_column(Float, default=0.0)
    cost_price: Mapped[float] = mapped_column(Float, default=0.0)
    discount: Mapped[float] = mapped_column(Float, default=0.0)
    final_price: Mapped[float] = mapped_column(Float, default=0.0)
    margin: Mapped[float] = mapped_column(Float, default=0.0)

    specifications: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    status: Mapped[OrderStatus] = mapped_column(
        Enum(OrderStatus), default=OrderStatus.INQUIRY, nullable=False
    )

    # Даты
    measurement_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    production_deadline: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    delivery_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    delivery_address: Mapped[str | None] = mapped_column(Text, nullable=True)
    assembly_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    client = relationship("Client", back_populates="orders")
    manager = relationship("User", back_populates="orders", foreign_keys=[manager_id])
    status_history = relationship(
        "OrderStatusHistory", back_populates="order",
        order_by="OrderStatusHistory.created_at"
    )


class OrderStatusHistory(Base):
    __tablename__ = "order_status_history"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"), nullable=False)
    from_status: Mapped[str | None] = mapped_column(String(50), nullable=True)
    to_status: Mapped[str] = mapped_column(String(50), nullable=False)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    changed_by_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    order = relationship("Order", back_populates="status_history")


class OrderDocument(Base):
    __tablename__ = "order_documents"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"), nullable=False)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )