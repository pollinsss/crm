import asyncio
import pytest
from typing import AsyncGenerator
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.database import Base, get_db
from app.core.security import hash_password
from app.models.user import User, UserRole
from app.models.client import Client, ClientSegment
from app.models.order import Order, OrderStatus, FurnitureType

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestSessionLocal = async_sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def override_get_db() -> AsyncGenerator:
    async with TestSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
async def setup_db():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
async def db(setup_db) -> AsyncGenerator:
    async with TestSessionLocal() as session:
        yield session


@pytest.fixture
async def client(setup_db) -> AsyncGenerator:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture
async def manager_token(client, db) -> str:
    user = User(
        email="manager@test.com",
        full_name="Test Manager",
        role=UserRole.MANAGER,
        hashed_password=hash_password("password123"),
    )
    db.add(user)
    await db.flush()
    response = await client.post("/api/v1/auth/token", data={
        "username": "manager@test.com",
        "password": "password123",
    })
    return response.json()["access_token"]


@pytest.fixture
async def admin_token(client, db) -> str:
    user = User(
        email="admin@test.com",
        full_name="Test Admin",
        role=UserRole.ADMIN,
        hashed_password=hash_password("password123"),
    )
    db.add(user)
    await db.flush()
    response = await client.post("/api/v1/auth/token", data={
        "username": "admin@test.com",
        "password": "password123",
    })
    return response.json()["access_token"]


@pytest.fixture
async def auth_headers(manager_token: str) -> dict:
    return {"Authorization": f"Bearer {manager_token}"}


@pytest.fixture
async def sample_client(db, auth_headers) -> Client:
    client_obj = Client(
        full_name="Иван Петров",
        phone="+79123456789",
        email="ivan@test.com",
        segment=ClientSegment.B2C,
    )
    db.add(client_obj)
    await db.flush()
    return client_obj


@pytest.fixture
async def sample_order(db, sample_client, manager_token) -> Order:
    order = Order(
        order_number="ORD-2026-0001",
        client_id=sample_client.id,
        manager_id=1,
        furniture_type=FurnitureType.KITCHEN,
        title="Кухня 3м",
        price=100_000,
        cost_price=60_000,
        discount=10,
        status=OrderStatus.INQUIRY,
    )
    order.final_price = order.price * (1 - order.discount / 100)
    order.margin = round((order.final_price - order.cost_price) / order.final_price * 100, 2)
    db.add(order)
    await db.flush()
    return order