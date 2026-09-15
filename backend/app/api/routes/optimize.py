import json
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, List, Optional

from ...db.session import get_db
from ...models.maintenance_task import MaintenanceTask, TaskStatus
from ...models.block_window import BlockWindow
from ...models.train import TrainMovement
from ...models.resource import Resource, Department
from ...models.plan import MaintenancePlan, PlanAssignment, PlanStatus, PlanType
from ...models.asset import Asset
from ...schemas.optimization import OptimizeRequest, OptimizeResponse
from ...optimization.solver import RailwayBlockOptimizer
from ...optimization.validators import PlanValidator

router = APIRouter()

@router.post("", response_model=OptimizeResponse)
def optimize_plan(request: OptimizeRequest, db: Session = Depends(get_db)):
    # 1. Load active maintenance tasks
    task_query = db.query(MaintenanceTask).filter(
        MaintenanceTask.status.in_([TaskStatus.OPEN, TaskStatus.PRIORITIZED, TaskStatus.SCHEDULED, TaskStatus.DEFERRED])
    )
    if request.departments:
        task_query = task_query.filter(MaintenanceTask.department.in_(request.departments))
    if not request.include_low_priority:
        task_query = task_query.filter(MaintenanceTask.priority_score >= 50)
    if request.corridor_ids:
        task_query = task_query.join(Asset).filter(Asset.corridor_id.in_(request.corridor_ids))

    tasks = task_query.all()
    if not tasks:
        raise HTTPException(status_code=400, detail="No open maintenance tasks found matching the criteria.")

    # 2. Load available block windows
    block_query = db.query(BlockWindow)
    if request.corridor_ids:
        block_query = block_query.filter(BlockWindow.corridor_id.in_(request.corridor_ids))
    block_windows = block_query.all()

    # 3. Load train movements
    train_query = db.query(TrainMovement)
    if request.corridor_ids:
        train_query = train_query.filter(TrainMovement.corridor_id.in_(request.corridor_ids))
    train_movements = train_query.all()

    # 4. Load resources and departments
    resources = db.query(Resource).all()
    departments = [d.name for d in db.query(Department).all()]

    # 5. Run OR-Tools CP-SAT Solver
    optimizer = RailwayBlockOptimizer(
        tasks=tasks,
        block_windows=block_windows,
        train_movements=train_movements,
        departments=departments,
        resources=resources,
        objective_weights=request.objective_weights,
        max_solve_time_seconds=request.max_solve_time_seconds
    )
    result = optimizer.solve()

    # 6. Save Plan to Database
    now = datetime.now()
    plan_name = f"Optimized Block Plan ({now.strftime('%d %b %H:%M')})"
    h_start = min([b.start_time for b in block_windows]) if block_windows else now
    h_end = max([b.end_time for b in block_windows]) if block_windows else (now + timedelta(days=7))

    plan = MaintenancePlan(
        plan_name=plan_name,
        plan_type=PlanType.DAILY,
        status=PlanStatus.GENERATED,
        horizon_start=h_start,
        horizon_end=h_end,
        corridor_ids=json.dumps(request.corridor_ids) if request.corridor_ids else "[]",
        departments=json.dumps(request.departments) if request.departments else "[]",
        objective_weights=json.dumps(request.objective_weights) if request.objective_weights else "{}",
        total_score=result["objective_score"],
        asset_availability=result["metrics"]["asset_availability"],
        train_impact_minutes=result["metrics"]["train_impact_minutes"],
        maintenance_completion_percent=round(result["metrics"]["tasks_completed"] / max(1, len(tasks)) * 100, 1),
        block_utilization_percent=result["metrics"]["utilization"],
        coordination_score=float(len(result.get("bundled_blocks", [])) * 10.0),
        notes=f"CP-SAT solver status: {result['status']}. Considered {len(tasks)} tasks."
    )
    db.add(plan)
    db.flush()

    # 7. Save Assignments
    tasks_map = {t.task_id: t for t in tasks}
    blocks_map = {b.block_id: b for b in block_windows}

    for a in result["assignments"]:
        tid = a["task_id"]
        bid = a["block_id"]
        b = blocks_map.get(bid)
        t = tasks_map.get(tid)

        pa = PlanAssignment(
            plan_id=plan.plan_id,
            task_id=tid,
            block_id=bid,
            assigned_start_time=getattr(b, "start_time", now),
            assigned_end_time=getattr(b, "end_time", now + timedelta(hours=2)),
            status="ASSIGNED",
            efficiency_score=a.get("efficiency_score", 90.0)
        )
        db.add(pa)
        if t:
            t.status = TaskStatus.SCHEDULED

    db.commit()

    run_id = f"OPT-{plan.plan_id:04d}"

    return {
        "run_id": run_id,
        "plan_id": plan.plan_id,
        "status": result["status"],
        "objective_score": result["objective_score"],
        "assignments": result["assignments"],
        "deferred_tasks": result["deferred_tasks"],
        "bundled_blocks": result.get("bundled_blocks", []),
        "metrics": result["metrics"],
        "solver_stats": result["solver_stats"],
        "dataset_type": "synthetic/demo"
    }
