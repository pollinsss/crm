## Быстрый старт (Docker)

```bash
git clone <repo> && cd furniture_crm
cp .env.example .env
docker compose up -d
docker compose exec api alembic upgrade head
# Документация: http://localhost:8000/docs
```

## Локальный запуск (без Docker)

```bash
python -m venv .venv
.venv\Scripts\activate           # Windows
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```
