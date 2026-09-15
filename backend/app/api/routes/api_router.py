from fastapi import APIRouter

# Import all route modules
from . import (
    auth,
    planning_workflow,
    execution,
    emergency,
    notifications,
    assets,
    maintenance_tasks,
    corridors,
    trains,
    blocks,
    plans,
    optimize,
    simulation,
    scenarios,
    analytics,
    ai,
    health,
    admin,
    users,
    system,
    replan,
    data,
    timeline,
    authorities,
)

# Create main API router
api_router = APIRouter()

# Authorities communication route
api_router.include_router(authorities.router, prefix="/authorities", tags=["authorities"])

# Authentication & RBAC
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])

# Workflow-first routes
api_router.include_router(planning_workflow.router, prefix="/planning", tags=["planning_workflow"])
api_router.include_router(planning_workflow.router, prefix="/planning-workflow", tags=["planning_workflow_alias"])
api_router.include_router(execution.router, prefix="/execution", tags=["execution"])
api_router.include_router(emergency.router, prefix="/emergency", tags=["emergency"])
api_router.include_router(timeline.router, prefix="/timeline", tags=["timeline"])
api_router.include_router(timeline.router, prefix="/timetable", tags=["timetable_alias"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])

# Entity & operational routes
api_router.include_router(maintenance_tasks.router, prefix="/tasks", tags=["maintenance_tasks"])
api_router.include_router(maintenance_tasks.router, prefix="/maintenance-tasks", tags=["maintenance_tasks_alias"])
api_router.include_router(maintenance_tasks.router, prefix="/maintenance", tags=["maintenance_legacy"])
api_router.include_router(assets.router, prefix="/assets", tags=["assets"])
api_router.include_router(corridors.router, prefix="/corridors", tags=["corridors"])
api_router.include_router(trains.router, prefix="/trains", tags=["trains"])
api_router.include_router(blocks.router, prefix="/blocks", tags=["blocks"])
api_router.include_router(plans.router, prefix="/plans", tags=["plans"])
api_router.include_router(optimize.router, prefix="/optimize", tags=["optimization"])
api_router.include_router(simulation.router, prefix="/simulation", tags=["simulation"])
api_router.include_router(scenarios.router, prefix="/scenarios", tags=["scenarios"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(system.router, prefix="/system", tags=["system"])
api_router.include_router(replan.router, prefix="/replan", tags=["replanning"])
api_router.include_router(data.router, prefix="/data", tags=["data"])

__all__ = ["api_router"]