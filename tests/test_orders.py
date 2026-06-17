"""
Тесты управления заказами и статусной модели (TC-016 — TC-027)
"""
import pytest


class TestOrders:
    async def test_tc016_create_order(self, client, auth_headers, sample_client):
        """TC-016: Создание заказа"""
        response = await client.post("/api/v1/orders", json={
            "client_id": sample_client.id,
            "furniture_type": "kitchen",
            "title": "Кухня 3м",
            "price": 100000,
            "cost_price": 60000,
            "discount": 10,
        }, headers=auth_headers)
        assert response.status_code == 201
        data = response.json()
        assert data["order_number"].startswith("ORD-")
        assert data["status"] == "inquiry"
        assert data["final_price"] == 90000
        assert data["margin"] == pytest.approx(33.33, abs=0.1)

    async def test_tc017_create_order_no_client(self, client, auth_headers):
        """TC-017: Создание заказа без client_id"""
        response = await client.post("/api/v1/orders", json={
            "furniture_type": "kitchen",
            "title": "No client",
        }, headers=auth_headers)
        assert response.status_code == 422

    async def test_tc018_order_number_sequence(self, client, auth_headers, sample_client):
        """TC-018: Генерация номера заказа"""
        ids = []
        for _ in range(3):
            r = await client.post("/api/v1/orders", json={
                "client_id": sample_client.id,
                "furniture_type": "wardrobe",
                "title": f"Order {_}",
            }, headers=auth_headers)
            ids.append(r.json()["order_number"])
        assert ids[0] != ids[1] != ids[2]

    async def test_tc019_financial_calculation(self, client, auth_headers, sample_client):
        """TC-019: Расчёт финальной цены и маржи"""
        response = await client.post("/api/v1/orders", json={
            "client_id": sample_client.id,
            "furniture_type": "table",
            "title": "Table",
            "price": 100000,
            "cost_price": 60000,
            "discount": 10,
        }, headers=auth_headers)
        data = response.json()
        assert data["final_price"] == 90000
        assert data["margin"] == pytest.approx(33.33, abs=0.1)

    async def test_tc020_list_orders_by_status(self, client, auth_headers, sample_order):
        """TC-020: Фильтрация заказов по статусу"""
        response = await client.get("/api/v1/orders?status=inquiry", headers=auth_headers)
        assert response.status_code == 200
        assert len(response.json()["items"]) >= 1

        response2 = await client.get("/api/v1/orders?status=completed", headers=auth_headers)
        assert len(response2.json()["items"]) == 0

    async def test_tc021_update_order(self, client, auth_headers, sample_order):
        """TC-021: Обновление заказа — пересчёт финансов"""
        response = await client.patch(f"/api/v1/orders/{sample_order.id}", json={
            "price": 150000,
        }, headers=auth_headers)
        data = response.json()
        assert data["price"] == 150000
        assert data["final_price"] == 135000  # 150000 - 10%

    async def test_tc022_valid_transition(self, client, auth_headers, sample_order):
        """TC-022: Корректный переход inquiry → measurement"""
        response = await client.post(f"/api/v1/orders/{sample_order.id}/status", json={
            "status": "measurement",
        }, headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["status"] == "measurement"

    async def test_tc023_invalid_transition(self, client, auth_headers, sample_order):
        """TC-023: Некорректный переход inquiry → completed"""
        response = await client.post(f"/api/v1/orders/{sample_order.id}/status", json={
            "status": "completed",
        }, headers=auth_headers)
        assert response.status_code == 422

    async def test_tc024_full_path(self, client, auth_headers, sample_order):
        """TC-024: Полный путь inquiry → completed"""
        path = ["measurement", "design", "production", "ready", "delivery", "assembly", "completed"]
        for status in path:
            r = await client.post(f"/api/v1/orders/{sample_order.id}/status", json={
                "status": status,
            }, headers=auth_headers)
            assert r.status_code == 200, f"Failed at {status}"
        assert r.json()["status"] == "completed"

    async def test_tc025_cancel_order(self, client, auth_headers, sample_order):
        """TC-025: Отмена заказа"""
        response = await client.post(f"/api/v1/orders/{sample_order.id}/status", json={
            "status": "cancelled",
        }, headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["status"] == "cancelled"