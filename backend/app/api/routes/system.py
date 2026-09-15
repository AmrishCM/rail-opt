from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Dict, Any, List, Optional

from ...db.session import get_db
from ...models.auth import User, Role, Permission
from ...models.scenario import AuditLog
from ...utils.security import require_permission, get_current_user

router = APIRouter()

SYSTEM_SETTINGS: Dict[str, Any] = {
    "engine": "Google OR-Tools CP-SAT (v9.8+)",
    "solver_timeout_seconds": 15,
    "max_concurrency_workers": 4,
    "express_train_protection_margin_minutes": 25,
    "min_train_headway_minutes": 15,
    "critical_overdue_threshold_days": 3,
    "multi_crew_concurrency_discount": 1.4,
    "weights": {
        "asset_availability": 0.30,
        "train_disruption": 0.25,
        "maintenance_urgency": 0.20,
        "multi_department_coordination": 0.15,
        "block_window_efficiency": 0.10
    }
}

class SettingsUpdateRequest(BaseModel):
    solver_timeout_seconds: Optional[int] = None
    express_train_protection_margin_minutes: Optional[int] = None
    min_train_headway_minutes: Optional[int] = None
    critical_overdue_threshold_days: Optional[int] = None
    weights: Optional[Dict[str, float]] = None

@router.get("/settings")
def get_system_settings(user: User = Depends(get_current_user)):
    return {
        "status": "OPERATIONAL",
        "settings": SYSTEM_SETTINGS
    }

@router.post("/settings")
def update_system_settings(
    req: SettingsUpdateRequest,
    current_user: User = Depends(require_permission("system:settings")),
    db: Session = Depends(get_db)
):
    """
    Update core planning engine & solver configuration.
    Requires system:settings permission (SYSTEM_ADMIN only).
    """
    if req.solver_timeout_seconds is not None:
        SYSTEM_SETTINGS["solver_timeout_seconds"] = req.solver_timeout_seconds
    if req.express_train_protection_margin_minutes is not None:
        SYSTEM_SETTINGS["express_train_protection_margin_minutes"] = req.express_train_protection_margin_minutes
    if req.min_train_headway_minutes is not None:
        SYSTEM_SETTINGS["min_train_headway_minutes"] = req.min_train_headway_minutes
    if req.critical_overdue_threshold_days is not None:
        SYSTEM_SETTINGS["critical_overdue_threshold_days"] = req.critical_overdue_threshold_days
    if req.weights is not None:
        SYSTEM_SETTINGS["weights"].update(req.weights)

    audit = AuditLog(
        action="SYSTEM_SETTINGS_UPDATE",
        entity_type="SYSTEM",
        entity_id="GLOBAL",
        user_id=current_user.employee_id,
        details=f"System settings updated by {current_user.employee_id} ({current_user.role})"
    )
    db.add(audit)
    db.commit()

    return {
        "status": "SUCCESS",
        "message": "System parameters updated successfully.",
        "settings": SYSTEM_SETTINGS
    }

@router.get("/audit")
def get_audit_trail(
    limit: int = 100,
    current_user: User = Depends(require_permission("system:audit")),
    db: Session = Depends(get_db)
):
    """
    Inspect compliance audit logs. Requires system:audit permission.
    """
    logs = db.query(AuditLog).order_by(AuditLog.log_id.desc()).limit(limit).all()
    return [
        {
            "log_id": l.log_id,
            "action": l.action,
            "entity_type": l.entity_type,
            "entity_id": l.entity_id,
            "user_id": l.user_id,
            "details": l.details,
            "created_at": l.created_at.isoformat() if l.created_at else None
        } for l in logs
    ]

@router.get("/roles")
def get_roles_and_permissions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns list of all roles with their mapped permissions.
    """
    roles = db.query(Role).all()
    results = []
    for r in roles:
        results.append({
            "role_id": r.role_id,
            "name": r.name,
            "display_name": r.display_name,
            "description": r.description,
            "permissions": [p.code for p in r.permissions],
            "user_count": len(r.users)
        })
    return results
