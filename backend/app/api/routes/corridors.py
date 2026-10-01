from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ...db.session import get_db
from ...models.corridor import Corridor, Section
from ...models.asset import Asset
from ...models.maintenance_task import MaintenanceTask, TaskStatus
from ...schemas.corridor import CorridorResponse

router = APIRouter()

@router.get("", response_model=List[CorridorResponse])
def list_corridors(db: Session = Depends(get_db)):
    corridors = db.query(Corridor).all()
    results = []
    for c in corridors:
        secs = [
            {
                "section_id": s.section_id,
                "corridor_id": s.corridor_id,
                "name": s.name,
                "section_number": s.section_number,
                "start_km": s.start_km,
                "end_km": s.end_km,
                "length_km": s.length_km,
                "start_chainage_km": getattr(s, "start_chainage_km", None) or s.start_km,
                "end_chainage_km": getattr(s, "end_chainage_km", None) or s.end_km,
                "station_code": getattr(s, "station_code", None),
                "gmt_density": getattr(s, "gmt_density", 48.6),
                "data_source": getattr(s, "data_source", "Aligned with OGD Platform India (data.gov.in)"),
                "max_speed": s.max_speed,
                "gradient": s.gradient,
                "maintenance_complexity": s.maintenance_complexity
            }
            for s in c.sections
        ]
        asset_count = db.query(Asset).filter(Asset.corridor_id == c.corridor_id).count()
        active_tasks = db.query(MaintenanceTask).join(Asset).filter(
            Asset.corridor_id == c.corridor_id,
            MaintenanceTask.status == TaskStatus.OPEN
        ).count()

        results.append({
            "corridor_id": c.corridor_id,
            "name": c.name,
            "start_station": c.start_station,
            "end_station": c.end_station,
            "start_station_code": getattr(c, "start_station_code", None),
            "end_station_code": getattr(c, "end_station_code", None),
            "gmt_density": getattr(c, "gmt_density", 52.4),
            "data_source": getattr(c, "data_source", "Aligned with OGD Platform India (data.gov.in)"),
            "traffic_level": c.traffic_level,
            "route_capacity": c.route_capacity,
            "sections": secs,
            "assets_count": asset_count,
            "active_tasks_count": active_tasks
        })

    return results

@router.get("/{corridor_id}", response_model=CorridorResponse)
def get_corridor(corridor_id: int, db: Session = Depends(get_db)):
    c = db.query(Corridor).filter(Corridor.corridor_id == corridor_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Corridor not found")

    secs = [
        {
            "section_id": s.section_id,
            "corridor_id": s.corridor_id,
            "name": s.name,
            "section_number": s.section_number,
            "start_km": s.start_km,
            "end_km": s.end_km,
            "length_km": s.length_km,
            "start_chainage_km": getattr(s, "start_chainage_km", None) or s.start_km,
            "end_chainage_km": getattr(s, "end_chainage_km", None) or s.end_km,
            "station_code": getattr(s, "station_code", None),
            "gmt_density": getattr(s, "gmt_density", 48.6),
            "data_source": getattr(s, "data_source", "Aligned with OGD Platform India (data.gov.in)"),
            "max_speed": s.max_speed,
            "gradient": s.gradient,
            "maintenance_complexity": s.maintenance_complexity
        }
        for s in c.sections
    ]
    asset_count = db.query(Asset).filter(Asset.corridor_id == c.corridor_id).count()
    active_tasks = db.query(MaintenanceTask).join(Asset).filter(
        Asset.corridor_id == c.corridor_id,
        MaintenanceTask.status == TaskStatus.OPEN
    ).count()

    return {
        "corridor_id": c.corridor_id,
        "name": c.name,
        "start_station": c.start_station,
        "end_station": c.end_station,
        "start_station_code": getattr(c, "start_station_code", None),
        "end_station_code": getattr(c, "end_station_code", None),
        "gmt_density": getattr(c, "gmt_density", 52.4),
        "data_source": getattr(c, "data_source", "Aligned with OGD Platform India (data.gov.in)"),
        "traffic_level": c.traffic_level,
        "route_capacity": c.route_capacity,
        "sections": secs,
        "assets_count": asset_count,
        "active_tasks_count": active_tasks
    }
