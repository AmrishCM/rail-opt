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
        "message": "Database reset and seeded with realistic synthetic railway data aligned with Indian Railways OGD datasets.",
        "counts": result,
        "dataset_type": "synthetic/demo",
        "data_source": "Aligned with OGD Platform India (data.gov.in)"
    }

@router.get("/ogd-metadata")
def get_ogd_metadata():
    """
    Returns the Open Government Data (data.gov.in) schema mappings and dataset catalog
    for Indian Railways operational assets, chainages, and timetable schedules.
    """
    return {
        "status": "ACTIVE_ALIGNED",
        "platform": "Open Government Data (OGD) Platform India",
        "portal_url": "https://data.gov.in",
        "ministry": "Ministry of Railways (Railway Board)",
        "datasets_aligned": [
            {
                "catalog_id": "IR-OGD-STN-2026",
                "title": "Indian Railways Station Codes & Master Directory",
                "mapped_fields": ["start_station_code", "end_station_code", "station_code"],
                "sample_codes": ["NDLS", "CNB", "GZB", "ADI", "BRC", "ANND", "ASN", "DHN", "MAS", "SA", "ED"]
            },
            {
                "catalog_id": "IR-OGD-CHN-2026",
                "title": "Permanent Way Track Section Chainage (Km) Register",
                "mapped_fields": ["start_chainage_km", "end_chainage_km", "length_km"],
                "datum_format": "Kilometre chainage with decimal metre precision"
            },
            {
                "catalog_id": "IR-OGD-GMT-2026",
                "title": "Corridor Gross Million Tonnes (GMT) Traffic Density Index",
                "mapped_fields": ["gmt_density"],
                "unit": "GMT per annum (Heavy Haul / High-Density Network HDN)"
            },
            {
                "catalog_id": "IR-OGD-TT-2026",
                "title": "National Passenger Train Working Timetable (COA / WTT)",
                "mapped_fields": ["train_number", "origin_station_code", "destination_station_code", "scheduled_duration", "arrival_time", "departure_time"],
                "sample_trains": ["12009", "22926", "12952", "12001", "12301", "12675", "20643"]
            }
        ],
        "data_source": "Aligned with OGD Platform India (data.gov.in)"
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
