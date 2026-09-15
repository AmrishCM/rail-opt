from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ...db.session import get_db
from ...models.train import Train, TrainMovement
from ...schemas.train import TrainResponse, TrainMovementResponse

router = APIRouter()

@router.get("", response_model=List[TrainResponse])
def list_trains(db: Session = Depends(get_db)):
    trains = db.query(Train).all()
    results = []
    for tr in trains:
        movements = [
            {
                "movement_id": m.movement_id,
                "train_id": m.train_id,
                "corridor_id": m.corridor_id,
                "section_id": m.section_id,
                "arrival_time": m.arrival_time,
                "departure_time": m.departure_time,
                "scheduled_duration": m.scheduled_duration,
                "delay_minutes": m.delay_minutes,
                "forecast_status": m.forecast_status,
                "train_number": tr.train_number,
                "train_type": tr.train_type.value if hasattr(tr.train_type, "value") else str(tr.train_type),
                "priority": tr.priority.value if hasattr(tr.priority, "value") else str(tr.priority)
            }
            for m in tr.movements
        ]
        results.append({
            "train_id": tr.train_id,
            "train_number": tr.train_number,
            "train_type": tr.train_type.value if hasattr(tr.train_type, "value") else str(tr.train_type),
            "priority": tr.priority.value if hasattr(tr.priority, "value") else str(tr.priority),
            "max_speed": tr.max_speed,
            "capacity": tr.capacity,
            "current_status": tr.current_status,
            "movements": movements
        })
    return results

@router.get("/movements", response_model=List[TrainMovementResponse])
def list_train_movements(
    corridor_id: Optional[int] = None,
    section_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(TrainMovement).join(Train)
    if corridor_id:
        query = query.filter(TrainMovement.corridor_id == corridor_id)
    if section_id:
        query = query.filter(TrainMovement.section_id == section_id)

    movements = query.order_by(TrainMovement.arrival_time.asc()).limit(100).all()
    results = []
    for m in movements:
        tr = m.train
        results.append({
            "movement_id": m.movement_id,
            "train_id": m.train_id,
            "corridor_id": m.corridor_id,
            "section_id": m.section_id,
            "arrival_time": m.arrival_time,
            "departure_time": m.departure_time,
            "scheduled_duration": m.scheduled_duration,
            "delay_minutes": m.delay_minutes,
            "forecast_status": m.forecast_status,
            "train_number": tr.train_number if tr else f"TR-{m.train_id}",
            "train_type": tr.train_type.value if (tr and hasattr(tr.train_type, "value")) else "EXPRESS",
            "priority": tr.priority.value if (tr and hasattr(tr.priority, "value")) else "MEDIUM"
        })
    return results
