import time
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime
from ...db.session import get_db, engine

router = APIRouter()

@router.get("")
async def health_check(db: Session = Depends(get_db)):
    t0 = time.perf_counter()
    db_connected = False
    db_type = engine.dialect.name
    latency_ms = 0.0

    try:
        db.execute(text("SELECT 1"))
        latency_ms = round((time.perf_counter() - t0) * 1000, 2)
        db_connected = True
    except Exception as ex:
        db_connected = False

    return {
        "status": "healthy" if db_connected else "degraded",
        "application": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "RailOpt-AI API",
        "database": {
            "connected": db_connected,
            "type": db_type,
            "latency_ms": latency_ms
        }
    }

@router.get("/database")
async def database_health(db: Session = Depends(get_db)):
    t0 = time.perf_counter()
    db_connected = False
    db_type = engine.dialect.name
    latency_ms = 0.0
    err_msg = None

    try:
        db.execute(text("SELECT 1"))
        latency_ms = round((time.perf_counter() - t0) * 1000, 2)
        db_connected = True
    except Exception as ex:
        err_msg = str(ex)

    return {
        "status": "healthy" if db_connected else "degraded",
        "application": "healthy" if db_connected else "degraded",
        "connected": db_connected,
        "type": db_type,
        "latency_ms": latency_ms,
        "database": {
            "connected": db_connected,
            "type": db_type,
            "latency_ms": latency_ms,
            "error": err_msg
        }
    }

@router.get("/ping")
async def ping():
    return {"message": "pong", "service": "RailOpt-AI API"}