from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.routes.api_router import api_router
from .db.session import Base, engine
from . import models

# Create database tables
Base.metadata.create_all(bind=engine)

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