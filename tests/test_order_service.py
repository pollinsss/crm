"""
Тесты бизнес-логики: статусная машина, финансовые расчёты
"""
import pytest
from unittest.mock import AsyncMock, MagicMock
from app.models.order import Order, OrderStatus, VALID_TRANSITIONS
from app.services.order_service import calculate_financials


def test_calculate_financials_with_discount():
    order = Order(price=100_000, cost_price=60_000, discount=10.0)
    calculate_financials(order)
    assert order.final_price == pytest.approx(90_000)
    assert order.margin == pytest.approx(33.33, abs=0.1)


def test_calculate_financials_no_cost():
    order = Order(price=50_000, cost_price=0, discount=0)
    calculate_financials(order)
    assert order.final_price == 50_000
    assert order.margin == 0.0


def test_valid_transitions_inquiry():
    assert OrderStatus.MEASUREMENT in VALID_TRANSITIONS[OrderStatus.INQUIRY]
    assert OrderStatus.CANCELLED in VALID_TRANSITIONS[OrderStatus.INQUIRY]
    assert OrderStatus.COMPLETED not in VALID_TRANSITIONS[OrderStatus.INQUIRY]


def test_valid_transitions_completed_is_terminal():
    assert VALID_TRANSITIONS[OrderStatus.COMPLETED] == []


def test_full_happy_path():
    """Проверяем полный путь заказа через все статусы"""
    path = [
        OrderStatus.INQUIRY,
        OrderStatus.MEASUREMENT,
        OrderStatus.DESIGN,
        OrderStatus.PRODUCTION,
        OrderStatus.READY,
        OrderStatus.DELIVERY,
        OrderStatus.ASSEMBLY,
        OrderStatus.COMPLETED,
    ]
    for i in range(len(path) - 1):
        assert path[i + 1] in VALID_TRANSITIONS[path[i]], (
            f"{path[i]} → {path[i+1]} должен быть допустим"
        )
