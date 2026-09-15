from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from typing import List, Optional
import io
import csv

from ...db.session import get_db
from ...models.auth import User
from ...models.plan import MaintenancePlan, PlanAssignment, PlanStatus
from ...models.maintenance_task import MaintenanceTask
from ...models.block_window import BlockWindow
from ...schemas.plan import MaintenancePlanResponse, PlanAssignmentResponse
from ...utils.security import require_permission

router = APIRouter()

@router.get("", response_model=List[MaintenancePlanResponse])
def list_plans(db: Session = Depends(get_db)):
    plans = db.query(MaintenancePlan).order_by(MaintenancePlan.plan_id.desc()).limit(20).all()
    results = []
    for p in plans:
        results.append(_format_plan(p))
    return results

@router.get("/{plan_id}", response_model=MaintenancePlanResponse)
def get_plan(plan_id: int, db: Session = Depends(get_db)):
    p = db.query(MaintenancePlan).filter(MaintenancePlan.plan_id == plan_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Plan not found")
    return _format_plan(p)

@router.post("/{plan_id}/approve")
def approve_plan(
    plan_id: int,
    current_user: User = Depends(require_permission("planning:approve")),
    db: Session = Depends(get_db)
):
    p = db.query(MaintenancePlan).filter(MaintenancePlan.plan_id == plan_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Plan not found")
    p.status = PlanStatus.APPROVED
    db.commit()
    return {"message": f"Plan #{plan_id} approved for railway corridor possession.", "status": "APPROVED"}

@router.get("/{plan_id}/export")
def export_plan(plan_id: int, format: str = "csv", db: Session = Depends(get_db)):
    p = db.query(MaintenancePlan).filter(MaintenancePlan.plan_id == plan_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Plan not found")

    if format.lower() == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["RailOpt-AI Maintenance Block Plan", f"Plan ID: {p.plan_id}", f"Generated: {p.created_at}"])
        writer.writerow(["Asset Availability", f"{p.asset_availability}%", "Train Disruption", f"{p.train_impact_minutes} min"])
        writer.writerow([])
        writer.writerow(["Assignment ID", "Task ID", "Block ID", "Department", "Start Time", "End Time", "Status"])
        for a in p.assignments:
            writer.writerow([
                a.assignment_id,
                a.task_id,
                a.block_id,
                a.task.department if a.task else "ENGINEERING",
                a.assigned_start_time.isoformat(),
                a.assigned_end_time.isoformat(),
                a.status
            ])
        output.seek(0)
        return Response(
            content=output.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=plan_{plan_id}_export.csv"}
        )
    else:
        return _format_plan(p)

def _format_plan(p: MaintenancePlan) -> dict:
    assignments = []
    for a in p.assignments:
        task = a.task
        block = a.block
        ast = task.asset if task else None
        corr = ast.corridor if ast else None
        sec = block.section if block else None

        assignments.append({
            "assignment_id": a.assignment_id,
            "plan_id": a.plan_id,
            "task_id": a.task_id,
            "block_id": a.block_id,
            "resource_id": a.resource_id,
            "assigned_start_time": a.assigned_start_time,
            "assigned_end_time": a.assigned_end_time,
            "status": a.status,
            "efficiency_score": a.efficiency_score,
            "notes": a.notes,
            "task_description": task.description if task else f"Task {a.task_id}",
            "department": task.department if task else "Engineering",
            "corridor_name": corr.name if corr else None,
            "section_name": sec.name if sec else None,
            "block_type": block.block_type.value if (block and hasattr(block.block_type, "value")) else "BLOCK",
            "priority_score": task.priority_score if task else 50,
            "safety_impact": task.safety_impact if task else 5
        })

    return {
        "plan_id": p.plan_id,
        "plan_name": p.plan_name,
        "plan_type": p.plan_type.value if hasattr(p.plan_type, "value") else str(p.plan_type),
        "status": p.status.value if hasattr(p.status, "value") else str(p.status),
        "horizon_start": p.horizon_start,
        "horizon_end": p.horizon_end,
        "corridor_ids": p.corridor_ids,
        "departments": p.departments,
        "total_score": p.total_score,
        "asset_availability": p.asset_availability,
        "train_impact_minutes": p.train_impact_minutes,
        "maintenance_completion_percent": p.maintenance_completion_percent,
        "block_utilization_percent": p.block_utilization_percent,
        "coordination_score": p.coordination_score,
        "notes": p.notes,
        "assignments": assignments,
        "created_at": p.created_at
    }
