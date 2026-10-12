
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.database import engine
from app.routes.auth import router as auth_router
from app.routes.students import router as students_router
from app.routes.events import router as events_router
from app.routes.connections import router as connections_router
from app.routes.chat import router as chat_router


app = FastAPI(
    title="CampusX API",
    description="Backend API for the CampusX student community app",
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "message": "CampusX API is running",
        "status": "ok",
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
    }


@app.get("/database-test")
def database_test():
    with engine.connect() as connection:
        result = connection.execute(
            text("SELECT current_database();")
        )
        database_name = result.scalar()

    return {
        "database": database_name,
        "status": "connected",
    }


app.include_router(auth_router)
app.include_router(students_router)
app.include_router(connections_router)
app.include_router(chat_router)
app.include_router(events_router)