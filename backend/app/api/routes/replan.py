import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ...db.session import get_db
from ...models.plan import MaintenancePlan, PlanAssignment, PlanStatus, PlanType
from ...models.maintenance_task import MaintenanceTask
from ...models.block_window import BlockWindow
from ...models.train import TrainMovement
from ...models.resource import Resource, Department
from ...schemas.scenario import ReplanRequest, ReplanResponse
from ...services.replanning.replanner import DynamicReplanner

router = APIRouter()

@router.post("", response_model=ReplanResponse)
def trigger_replan(request: ReplanRequest, db: Session = Depends(get_db)):
    base_plan = db.query(MaintenancePlan).filter(MaintenancePlan.plan_id == request.plan_id).first()
    if not base_plan:
        raise HTTPException(status_code=404, detail="Base plan not found")

    tasks = db.query(MaintenanceTask).all()
    block_windows = db.query(BlockWindow).all()
    train_movements = db.query(TrainMovement).all()
    resources = db.query(Resource).all()
    departments = [d.name for d in db.query(Department).all()]

    replan_result = DynamicReplanner.replan_scenario(
        base_plan=base_plan,
        event=request.event.model_dump(),
        tasks=tasks,
        block_windows=block_windows,
        train_movements=train_movements,
        resources=resources,
        departments=departments
    )

    new_result = replan_result["new_plan_result"]
    now = datetime.now()

    # Save newly re-optimized plan
    new_plan = MaintenancePlan(
        plan_name=f"Dynamic Re-Plan (Event: {request.event.type})",
        plan_type=PlanType.AD_HOC,
        status=PlanStatus.GENERATED,
        horizon_start=base_plan.horizon_start,
        horizon_end=base_plan.horizon_end,
        total_score=new_result["objective_score"],
        asset_availability=new_result["metrics"]["asset_availability"],
        train_impact_minutes=new_result["metrics"]["train_impact_minutes"],
        maintenance_completion_percent=round(new_result["metrics"]["tasks_completed"] / max(1, len(tasks)) * 100, 1),
        block_utilization_percent=new_result["metrics"]["utilization"],
        notes=f"Re-planned following {request.event.type}: {request.event.description or ''}"
    )
    db.add(new_plan)
    db.flush()

    for a in new_result["assignments"]:
        tid = a["task_id"]
        if tid != 9999:
            pa = PlanAssignment(
                plan_id=new_plan.plan_id,
                task_id=tid,
                block_id=a["block_id"],
                assigned_start_time=now,
                assigned_end_time=now,
                status="ASSIGNED",
                efficiency_score=94.0
            )
            db.add(pa)
    db.commit()

    return {
        "old_plan_id": base_plan.plan_id,
        "new_plan_id": new_plan.plan_id,
        "status": "REPLANNED_OPTIMAL",
        "changed_assignments": replan_result["changed_assignments"],
        "impact": replan_result["impact"],
        "reason_summary": replan_result["reason_summary"],
        "dataset_type": "synthetic/demo"
    }
