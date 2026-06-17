from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.database import engine, Base
from app.api.v1 import api_router

# Импорт всех моделей для создания таблиц
import app.models  # noqa: F401


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Создать таблицы при старте (в продакшене — только через Alembic)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


app = FastAPI(
    title="МебельCRM API",
    description="CRM-система для мебельной компании",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": f"Внутренняя ошибка сервера: {str(exc)}"},
    )


app.include_router(api_router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "МебельCRM"}
