from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.routes.api_router import api_router
from .db.session import Base, engine
from . import models

from sqlalchemy import text

# Create database tables
Base.metadata.create_all(bind=engine)

# Ensure dynamic execution_issues columns exist in SQLite
try:
    with engine.connect() as conn:
        cols = [r[1] for r in conn.execute(text("PRAGMA table_info(execution_issues)")).fetchall()]
        if cols:
            if "current_location" not in cols:
                conn.execute(text("ALTER TABLE execution_issues ADD COLUMN current_location VARCHAR(100)"))
            if "additional_duration_minutes" not in cols:
                conn.execute(text("ALTER TABLE execution_issues ADD COLUMN additional_duration_minutes INTEGER DEFAULT 30"))
            if "status" not in cols:
                conn.execute(text("ALTER TABLE execution_issues ADD COLUMN status VARCHAR(50) DEFAULT 'PENDING_REPLAN'"))
            conn.commit()
except Exception as mig_err:
    print(f"[DB_MIGRATION] Migration note: {mig_err}")

app = FastAPI(
    title="RailOpt-AI API",
    description="AI-Powered Automatic Railway Maintenance Block Planning & Optimization Platform",
    version="1.0.0",
)

import os

from .api.routes.websocket import router as websocket_router

# Configure CORS - Allow localhost and all LAN IP access on port 5180
cors_env = os.getenv("BACKEND_CORS_ORIGINS", "http://localhost:5180,http://127.0.0.1:5180")
cors_origins = [o.strip() for o in cors_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins or ["*"],
    allow_origin_regex=r"^https?://.*:5180$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router and WebSocket endpoints
app.include_router(api_router, prefix="/api")
app.include_router(websocket_router)
app.include_router(websocket_router, prefix="/api")

@app.get("/")
async def root():
    return {
        "message": "Welcome to RailOpt-AI API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": "2026-09-12"}