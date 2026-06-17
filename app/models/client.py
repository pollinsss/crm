import enum
from datetime import datetime, timezone
from sqlalchemy import String, Text, Enum, DateTime, Integer, Float, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class ClientSegment(str, enum.Enum):
    B2C = "b2c"
    B2B = "b2b"
    VIP = "vip"


class Client(Base):
    __tablename__ = "clients"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    # Основные данные
    full_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    company_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str] = mapped_column(String(20), nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Сегментация
    segment: Mapped[ClientSegment] = mapped_column(
        Enum(ClientSegment), default=ClientSegment.B2C, nullable=False
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Предпочтения
    preferred_style: Mapped[str | None] = mapped_column(String(100), nullable=True)
    preferred_materials: Mapped[str | None] = mapped_column(Text, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Лояльность
    bonus_points: Mapped[int] = mapped_column(Integer, default=0)
    discount_percent: Mapped[float] = mapped_column(Float, default=0.0)
    total_spent: Mapped[float] = mapped_column(Float, default=0.0)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    orders = relationship("Order", back_populates="client")
    communications = relationship("Communication", back_populates="client")
