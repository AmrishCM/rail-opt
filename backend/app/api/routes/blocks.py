from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ...db.session import get_db
from ...models.block_window import BlockWindow
from ...models.corridor import Corridor, Section
from ...schemas.block import BlockWindowResponse

router = APIRouter()

@router.get("", response_model=List[BlockWindowResponse])
def list_block_windows(
    corridor_id: Optional[int] = None,
    section_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(BlockWindow)
    if corridor_id:
        query = query.filter(BlockWindow.corridor_id == corridor_id)
    if section_id:
        query = query.filter(BlockWindow.section_id == section_id)
    if status:
        query = query.filter(BlockWindow.status == status)

    blocks = query.order_by(BlockWindow.start_time.asc()).limit(150).all()
    results = []
    for b in blocks:
        results.append({
            "block_id": b.block_id,
            "corridor_id": b.corridor_id,
            "section_id": b.section_id,
            "corridor_name": b.corridor.name if b.corridor else f"Corridor {b.corridor_id}",
            "section_name": b.section.name if b.section else f"Section {b.section_id}",
            "start_time": b.start_time,
            "end_time": b.end_time,
            "duration_minutes": b.duration_minutes,
            "block_type": b.block_type.value if hasattr(b.block_type, "value") else str(b.block_type),
            "traffic_level": b.traffic_level,
            "eligible_departments": b.eligible_departments,
            "status": b.status.value if hasattr(b.status, "value") else str(b.status),
            "assigned_tasks_count": len(b.plan_assignments) if b.plan_assignments else 0
        })
    return results
