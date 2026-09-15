from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import os

from ...db.session import get_db
from ...services.ingestion.seeder import seed_database

router = APIRouter()

TEMPLATES_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../../data/templates"))

@router.post("/seed")
def reseed_database(days: int = 7, db: Session = Depends(get_db)):
    result = seed_database(db, days=days, reset=True)
    return {
        "message": "Database reset and seeded with realistic synthetic railway data.",
        "counts": result,
        "dataset_type": "synthetic/demo"
    }

@router.get("/templates")
def list_templates():
    os.makedirs(TEMPLATES_DIR, exist_ok=True)
    files = [f for f in os.listdir(TEMPLATES_DIR) if f.endswith(".csv")]
    return {
        "templates": [
            {"filename": f, "download_url": f"/api/data/templates/{f}"}
            for f in files
        ]
    }

@router.get("/templates/{filename}")
def download_template(filename: str):
    file_path = os.path.join(TEMPLATES_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Template file not found")
    return FileResponse(file_path, filename=filename, media_type="text/csv")
