from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ...db.session import get_db
from ...models.maintenance_task import MaintenanceTask, TaskStatus
from ...models.plan import MaintenancePlan
from ...models.asset import Asset
from ...models.corridor import Corridor

router = APIRouter()

@router.get("/overview")
def get_analytics_overview(db: Session = Depends(get_db)):
    total_tasks = db.query(MaintenanceTask).count()
    open_tasks = db.query(MaintenanceTask).filter(MaintenanceTask.status == TaskStatus.OPEN).count()
    critical_tasks = db.query(MaintenanceTask).filter(MaintenanceTask.priority_score >= 80).count()
    high_safety_tasks = db.query(MaintenanceTask).filter(MaintenanceTask.safety_impact >= 8).count()

    latest_plan = db.query(MaintenancePlan).order_by(MaintenancePlan.plan_id.desc()).first()

    # Backlog by department
    depts = ["Engineering/Track", "S&T/Signalling", "Traction Distribution", "Telecommunication"]
    dept_backlog = []
    for d in depts:
        count = db.query(MaintenanceTask).filter(MaintenanceTask.department == d).count()
        crit_count = db.query(MaintenanceTask).filter(MaintenanceTask.department == d, MaintenanceTask.priority_score >= 75).count()
        dept_backlog.append({
            "department": d,
            "total_tasks": count,
            "critical_tasks": crit_count
        })

    # Asset availability trend
    availability_trend = [
        {"day": "Day 1", "baseline": 90.8, "ai_optimized": 95.8},
        {"day": "Day 2", "baseline": 91.2, "ai_optimized": 96.2},
        {"day": "Day 3", "baseline": 91.0, "ai_optimized": 96.5},
        {"day": "Day 4", "baseline": 91.5, "ai_optimized": 96.8},
        {"day": "Day 5", "baseline": 91.2, "ai_optimized": 97.1}
    ]

    # Train delay reduction comparison
    delay_breakdown = [
        {"category": "Express Passenger", "baseline_minutes": 42, "ai_plan_minutes": 18},
        {"category": "Suburban Feeder", "baseline_minutes": 16, "ai_plan_minutes": 8},
        {"category": "Container Freight", "baseline_minutes": 14, "ai_plan_minutes": 12}
    ]

    # Multi-department coordination savings
    coordination_savings = {
        "combined_possessions_count": 6,
        "total_separate_hours": 14.5,
        "total_combined_hours": 9.2,
        "saved_block_hours": 5.3,
        "saved_delay_minutes": 68
    }

    return {
        "kpi_summary": {
            "asset_availability": latest_plan.asset_availability if latest_plan else 96.4,
            "train_impact_minutes": latest_plan.train_impact_minutes if latest_plan else 38,
            "total_backlog": open_tasks,
            "critical_backlog": critical_tasks,
            "high_safety_hazards": high_safety_tasks,
            "ai_plan_score": latest_plan.total_score if latest_plan else 91.5
        },
        "dept_backlog": dept_backlog,
        "availability_trend": availability_trend,
        "delay_breakdown": delay_breakdown,
        "coordination_savings": coordination_savings,
        "dataset_type": "synthetic/demo"
    }

@router.get("/availability")
def get_availability_analytics():
    return {
        "trend": [
            {"hour": "00:00", "availability": 94.2},
            {"hour": "04:00", "availability": 93.8},
            {"hour": "08:00", "availability": 96.5},
            {"hour": "12:00", "availability": 97.0},
            {"hour": "16:00", "availability": 96.8},
            {"hour": "20:00", "availability": 95.9}
        ],
        "dataset_type": "synthetic/demo"
    }

@router.get("/disruption")
def get_disruption_analytics():
    return {
        "total_delay_minutes": 38,
        "baseline_delay_minutes": 72,
        "reduction_percentage": "47.2%",
        "dataset_type": "synthetic/demo"
    }

@router.get("/backlog")
def get_backlog_analytics(db: Session = Depends(get_db)):
    tasks = db.query(MaintenanceTask).filter(MaintenanceTask.status == TaskStatus.OPEN).all()
    high_risk = sum([1 for t in tasks if t.priority_score >= 80])
    medium_risk = sum([1 for t in tasks if 50 <= t.priority_score < 80])
    low_risk = sum([1 for t in tasks if t.priority_score < 50])
    return {
        "total_open": len(tasks),
        "high_risk": high_risk,
        "medium_risk": medium_risk,
        "low_risk": low_risk,
        "dataset_type": "synthetic/demo"
    }
