"""
Тесты управления клиентами (TC-008 — TC-015)
"""
import pytest


class TestClients:
    async def test_tc008_create_client_b2c(self, client, auth_headers):
        """TC-008: Создание клиента B2C"""
        response = await client.post("/api/v1/clients", json={
            "full_name": "Иван Петров",
            "phone": "+79123456789",
            "segment": "b2c",
        }, headers=auth_headers)
        assert response.status_code == 201
        data = response.json()
        assert data["full_name"] == "Иван Петров"
        assert data["is_active"] is True
        assert "id" in data

    async def test_tc009_create_client_b2b(self, client, auth_headers):
        """TC-009: Создание клиента B2B"""
        response = await client.post("/api/v1/clients", json={
            "full_name": "ООО Мебель",
            "company_name": "Мебель-Сервис",
            "phone": "+78121234567",
            "segment": "b2b",
        }, headers=auth_headers)
        assert response.status_code == 201
        assert response.json()["company_name"] == "Мебель-Сервис"

    async def test_tc010_create_client_missing_name(self, client, auth_headers):
        """TC-010: Создание клиента без обязательного поля full_name"""
        response = await client.post("/api/v1/clients", json={
            "phone": "+79123456789",
        }, headers=auth_headers)
        assert response.status_code == 422

    async def test_tc011_list_clients_pagination(self, client, auth_headers, db):
        """TC-011: Получение списка с пагинацией"""
        from app.models.client import Client
        for i in range(5):
            db.add(Client(full_name=f"Client {i}", phone=f"+7900{i:07d}"))
        await db.flush()

        response = await client.get("/api/v1/clients?page=1&size=3", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 3
        assert data["page"] == 1
        assert data["size"] == 3
        assert data["total"] >= 5

    async def test_tc012_search_client(self, client, auth_headers, db):
        """TC-012: Поиск клиента по имени"""
        from app.models.client import Client
        db.add(Client(full_name="Алексей Смирнов", phone="+79111111111"))
        await db.flush()

        response = await client.get("/api/v1/clients?search=Смирнов", headers=auth_headers)
        assert response.status_code == 200
        items = response.json()["items"]
        assert any("Смирнов" in c["full_name"] for c in items)

    async def test_tc013_filter_by_segment(self, client, auth_headers, db):
        """TC-013: Фильтрация по сегменту VIP"""
        from app.models.client import Client, ClientSegment
        db.add(Client(full_name="VIP Client", phone="+79000000001", segment=ClientSegment.VIP))
        db.add(Client(full_name="Regular", phone="+79000000002", segment=ClientSegment.B2C))
        await db.flush()

        response = await client.get("/api/v1/clients?segment=vip", headers=auth_headers)
        assert response.status_code == 200
        for c in response.json()["items"]:
            assert c["segment"] == "vip"

    async def test_tc014_update_client(self, client, auth_headers, db):
        """TC-014: Обновление клиента"""
        from app.models.client import Client
        c = Client(full_name="Old Name", phone="+79000000000")
        db.add(c)
        await db.flush()

        response = await client.patch(f"/api/v1/clients/{c.id}", json={
            "phone": "+79999999999"
        }, headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["phone"] == "+79999999999"

    async def test_tc015_soft_delete_client(self, client, auth_headers, db):
        """TC-015: Мягкое удаление клиента"""
        from app.models.client import Client
        c = Client(full_name="To Delete", phone="+79000000000")
        db.add(c)
        await db.flush()

        delete_resp = await client.delete(f"/api/v1/clients/{c.id}", headers=auth_headers)
        assert delete_resp.status_code == 204

        get_resp = await client.get(f"/api/v1/clients/{c.id}", headers=auth_headers)
        assert get_resp.json()["is_active"] is False