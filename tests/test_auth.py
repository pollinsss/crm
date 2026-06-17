"""
Тесты аутентификации и авторизации (TC-001 — TC-007)
"""
import pytest


class TestAuth:
    async def test_tc001_login_success(self, client, db):
        """TC-001: Вход с корректными данными"""
        from app.models.user import User
        from app.core.security import hash_password
        user = User(email="valid@test.com", full_name="Valid",
                    role="manager", hashed_password=hash_password("pass"))
        db.add(user)
        await db.flush()

        response = await client.post("/api/v1/auth/token", data={
            "username": "valid@test.com",
            "password": "pass",
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    async def test_tc002_login_wrong_password(self, client, db):
        """TC-002: Вход с неверным паролем"""
        from app.models.user import User
        from app.core.security import hash_password
        user = User(email="user@test.com", full_name="User",
                    role="manager", hashed_password=hash_password("right"))
        db.add(user)
        await db.flush()

        response = await client.post("/api/v1/auth/token", data={
            "username": "user@test.com",
            "password": "wrong",
        })
        assert response.status_code == 401
        assert "Неверный" in response.json()["detail"]

    async def test_tc003_login_nonexistent_email(self, client):
        """TC-003: Вход с несуществующим email"""
        response = await client.post("/api/v1/auth/token", data={
            "username": "nobody@test.com",
            "password": "any",
        })
        assert response.status_code == 401

    async def test_tc004_no_token_redirect(self, client):
        """TC-004: Доступ без токена — 401"""
        response = await client.get("/api/v1/clients")
        assert response.status_code == 401

    async def test_tc005_expired_token(self, client, db):
        """TC-005: Истекший токен (создаём с exp=0)"""
        from app.core.security import create_access_token
        from datetime import timedelta
        token = create_access_token({"sub": "1"}, expires_delta=timedelta(seconds=-1))
        response = await client.get("/api/v1/clients", headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 401

    async def test_tc006_register_success(self, client):
        """TC-006: Регистрация нового пользователя"""
        response = await client.post(
            "/api/v1/auth/register",
            params={"email": "new@test.com", "full_name": "New User", "password": "pass123", "role": "manager"},
        )
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "new@test.com"
        assert "id" in data

    async def test_tc007_register_duplicate_email(self, client, db):
        """TC-007: Регистрация с дублирующимся email"""
        from app.models.user import User
        from app.core.security import hash_password
        user = User(email="dup@test.com", full_name="Dup",
                    role="manager", hashed_password=hash_password("pass"))
        db.add(user)
        await db.flush()

        response = await client.post(
            "/api/v1/auth/register",
            params={"email": "dup@test.com", "full_name": "Dup2", "password": "pass", "role": "manager"},
        )
        assert response.status_code == 400
        assert "зарегистрирован" in response.json()["detail"]