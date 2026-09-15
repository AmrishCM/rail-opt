import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any

from ...db.session import get_db
from ...models.plan import MaintenancePlan
from ...models.block_window import BlockWindow
from ...models.maintenance_task import MaintenanceTask
from ...models.train import TrainMovement
from ...models.asset import Asset
from ...models.simulation import SimulationRun, SimulationStatus
from ...schemas.simulation import SimulationRequest, SimulationResponse
from ...simulation.engine import DiscreteEventSimulator
from ...services.scheduling.baseline import BaselineGreedyPlanner

router = APIRouter()

@router.post("/run", response_model=SimulationResponse)
def run_simulation(request: SimulationRequest, db: Session = Depends(get_db)):
    plan = db.query(MaintenancePlan).filter(MaintenancePlan.plan_id == request.plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    # Load entities
    tasks = db.query(MaintenanceTask).all()
    tasks_by_id = {t.task_id: t for t in tasks}
    blocks = db.query(BlockWindow).all()
    blocks_by_id = {b.block_id: b for b in blocks}
    train_movements = db.query(TrainMovement).all()
    assets = db.query(Asset).all()

    # Plan assignments format
    assignments = [
        {
            "task_id": a.task_id,
            "block_id": a.block_id,
            "assigned_start_time": a.assigned_start_time,
            "assigned_end_time": a.assigned_end_time
        }
        for a in plan.assignments
    ]

    # 1. Run Discrete-Event Simulation on AI Plan
    simulator = DiscreteEventSimulator(random_seed=request.random_seed)
    ai_sim_result = simulator.simulate_plan(
        assignments=assignments,
        blocks_by_id=blocks_by_id,
        tasks_by_id=tasks_by_id,
        train_movements=train_movements,
        assets=assets
    )

    # 2. Run Baseline Heuristic Planner & Simulation for comparison
    baseline_plan = BaselineGreedyPlanner.generate_baseline_plan(
        tasks=tasks,
        block_windows=blocks,
        train_movements=train_movements
    )
    baseline_sim = DiscreteEventSimulator(random_seed=request.random_seed).simulate_plan(
        assignments=baseline_plan["assignments"],
        blocks_by_id=blocks_by_id,
        tasks_by_id=tasks_by_id,
        train_movements=train_movements,
        assets=assets
    )

    # 3. Calculate Differences & Improvements
    avail_diff = round(ai_sim_result["asset_availability"] - baseline_sim["asset_availability"], 1)
    delay_saved = max(0, baseline_sim["train_delay_minutes"] - ai_sim_result["train_delay_minutes"])
    block_hours_saved = round(max(0.0, baseline_sim["total_block_hours"] - ai_sim_result["total_block_hours"]), 1)
    extra_tasks = max(0, int(ai_sim_result["maintenance_completion"] * len(tasks) / 100) - int(baseline_sim["maintenance_completion"] * len(tasks) / 100))

    comparison = {
        "baseline": {
            "asset_availability": baseline_sim["asset_availability"],
            "maintenance_completion": baseline_sim["maintenance_completion"],
            "critical_tasks_completed": baseline_sim["critical_tasks_completed"],
            "total_block_hours": baseline_sim["total_block_hours"],
            "train_delay_minutes": baseline_sim["train_delay_minutes"],
            "average_block_utilization": baseline_sim["average_block_utilization"],
            "conflicts": baseline_sim["conflicts"],
            "deferred_tasks": baseline_sim["deferred_tasks"],
            "coordination_events": 0,
            "dataset_type": "synthetic/demo"
        },
        "ai_plan": {
            "asset_availability": ai_sim_result["asset_availability"],
            "maintenance_completion": ai_sim_result["maintenance_completion"],
            "critical_tasks_completed": ai_sim_result["critical_tasks_completed"],
            "total_block_hours": ai_sim_result["total_block_hours"],
            "train_delay_minutes": ai_sim_result["train_delay_minutes"],
            "average_block_utilization": ai_sim_result["average_block_utilization"],
            "conflicts": ai_sim_result["conflicts"],
            "deferred_tasks": ai_sim_result["deferred_tasks"],
            "coordination_events": int(plan.coordination_score / 10.0) if plan.coordination_score else 2,
            "dataset_type": "synthetic/demo"
        },
        "improvements": {
            "availability_gain_percent": f"+{avail_diff}%",
            "train_delay_reduction_minutes": f"-{delay_saved} min",
            "block_hours_saved": f"-{block_hours_saved} h",
            "extra_tasks_completed": f"+{extra_tasks}",
            "conflicts_resolved": f"-{baseline_sim['conflicts']}",
            "utilization_improvement": f"+{round(ai_sim_result['average_block_utilization'] - baseline_sim['average_block_utilization'], 1)}%"
        }
    }

    # 4. Save Simulation Run Record in DB
    sim_run = SimulationRun(
        plan_id=plan.plan_id,
        status=SimulationStatus.COMPLETED,
        random_seed=request.random_seed,
        asset_availability_percent=ai_sim_result["asset_availability"],
        total_train_delay_minutes=ai_sim_result["train_delay_minutes"],
        total_block_hours=ai_sim_result["total_block_hours"],
        completed_tasks_count=len(assignments),
        deferred_tasks_count=ai_sim_result["deferred_tasks"],
        conflicts_count=ai_sim_result["conflicts"],
        average_block_utilization=ai_sim_result["average_block_utilization"],
        parameters=json.dumps({"seed": request.random_seed, "compare": request.run_baseline_comparison})
    )
    db.add(sim_run)
    db.commit()

    return {
        "simulation_id": sim_run.simulation_id,
        "plan_id": plan.plan_id,
        "status": "COMPLETED",
        "metrics": {
            "asset_availability": ai_sim_result["asset_availability"],
            "maintenance_completion": ai_sim_result["maintenance_completion"],
            "critical_tasks_completed": ai_sim_result["critical_tasks_completed"],
            "total_block_hours": ai_sim_result["total_block_hours"],
            "train_delay_minutes": ai_sim_result["train_delay_minutes"],
            "average_block_utilization": ai_sim_result["average_block_utilization"],
            "conflicts": ai_sim_result["conflicts"],
            "deferred_tasks": ai_sim_result["deferred_tasks"],
            "coordination_events": int(plan.coordination_score / 10.0) if plan.coordination_score else 2,
            "dataset_type": "synthetic/demo"
        },
        "comparison": comparison,
        "events_sample": ai_sim_result["events_sample"],
        "dataset_type": "synthetic/demo"
    }
