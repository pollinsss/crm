"""
Тесты: воронка продаж, аналитика, отчёты, расписание, граничные случаи
"""
import pytest


class TestPipeline:
    async def test_tc028_get_pipeline(self, client, auth_headers, sample_order):
        """TC-028: Получение воронки продаж"""
        response = await client.get("/api/v1/orders/pipeline", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        stages = {s["status"]: s for s in data}
        assert "inquiry" in stages
        assert stages["inquiry"]["count"] >= 1


@pytest.mark.asyncio
class TestAnalytics:
    async def test_tc030_dashboard_kpi(self, client, auth_headers):
        """TC-030: Получение KPI дашборда"""
        response = await client.get("/api/v1/analytics/dashboard", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "revenue" in data
        assert "orders" in data
        assert "conversion" in data
        assert "avg_check" in data
        assert "avg_margin" in data
        assert "clients_total" in data
        assert "active_by_status" in data

    async def test_tc031_revenue_by_month(self, client, auth_headers):
        """TC-031: Выручка по месяцам"""
        response = await client.get("/api/v1/analytics/revenue-by-month?months=6", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 6
        for point in data:
            assert "month" in point
            assert "label" in point
            assert "revenue" in point

    async def test_tc032_empty_revenue(self, client, auth_headers):
        """TC-032: Пустой график при отсутствии данных"""
        response = await client.get("/api/v1/analytics/revenue-by-month?months=6", headers=auth_headers)
        for point in response.json():
            assert point["revenue"] == 0


@pytest.mark.asyncio
class TestReports:
    async def test_tc033_pdf_report(self, client, auth_headers, sample_order):
        """TC-033: Генерация PDF-отчёта"""
        response = await client.get(
            "/api/v1/analytics/report/pdf?date_from=2026-01-01&date_to=2026-12-31",
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.headers["content-type"] == "application/pdf"

    async def test_tc034_excel_report(self, client, auth_headers, sample_order):
        """TC-034: Генерация Excel-отчёта"""
        response = await client.get(
            "/api/v1/analytics/report/excel?date_from=2026-01-01&date_to=2026-12-31",
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert "spreadsheetml" in response.headers["content-type"]

    async def test_tc035_empty_period_report(self, client, auth_headers):
        """TC-035: Отчёт за пустой период"""
        response = await client.get(
            "/api/v1/analytics/report/pdf?date_from=2025-01-01&date_to=2025-01-31",
            headers=auth_headers,
        )
        assert response.status_code == 200


@pytest.mark.asyncio
class TestSchedule:
    async def test_tc036_create_event(self, client, auth_headers):
        """TC-036: Создание события"""
        response = await client.post("/api/v1/schedule", json={
            "event_type": "measurement",
            "title": "Замер кухни",
            "scheduled_at": "2026-06-20T10:00:00",
        }, headers=auth_headers)
        assert response.status_code == 201
        assert response.json()["is_completed"] is False

    async def test_tc038_get_events_by_period(self, client, auth_headers, db):
        """TC-038: Получение событий за период"""
        from app.models.misc import ScheduleEvent
        from datetime import datetime, timezone
        ev1 = ScheduleEvent(event_type="measurement", title="Event 1",
                           scheduled_at=datetime(2026, 6, 15, tzinfo=timezone.utc))
        ev2 = ScheduleEvent(event_type="delivery", title="Event 2",
                           scheduled_at=datetime(2026, 7, 15, tzinfo=timezone.utc))
        db.add(ev1)
        db.add(ev2)
        await db.flush()

        response = await client.get(
            "/api/v1/schedule?date_from=2026-06-01&date_to=2026-06-30",
            headers=auth_headers,
        )
        assert len(response.json()) == 1


@pytest.mark.asyncio
class TestEdgeCases:
    async def test_tc039_sql_injection(self, client, auth_headers):
        """TC-039: SQL-инъекция в поиске"""
        response = await client.get(
            "/api/v1/clients?search='; DROP TABLE clients;--",
            headers=auth_headers,
        )
        assert response.status_code == 200

    async def test_tc040_invalid_id(self, client, auth_headers):
        """TC-040: Несуществующий ID клиента"""
        response = await client.get("/api/v1/clients/99999", headers=auth_headers)
        assert response.status_code == 404

    async def test_tc041_empty_patch(self, client, auth_headers, sample_client):
        """TC-041: Пустой PATCH"""
        response = await client.patch(f"/api/v1/clients/{sample_client.id}", json={}, headers=auth_headers)
        assert response.status_code == 200

    async def test_tc042_invalid_token(self, client):
        """TC-042: Некорректный токен"""
        response = await client.get("/api/v1/clients", headers={"Authorization": "Bearer invalid"})
        assert response.status_code == 401

    async def test_tc043_negative_price(self, client, auth_headers, sample_client):
        """TC-043: Отрицательная цена"""
        response = await client.post("/api/v1/orders", json={
            "client_id": sample_client.id,
            "furniture_type": "table",
            "title": "Negative price",
            "price": -10000,
        }, headers=auth_headers)
        assert response.status_code in (201, 422)