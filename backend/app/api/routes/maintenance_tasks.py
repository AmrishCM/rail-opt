import random
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from ...db.session import get_db
from ...models.maintenance_task import MaintenanceTask, TaskStatus, TaskType
from ...models.asset import Asset
from ...models.corridor import Section
from ...models.scenario import AuditLog
from ...models.auth import User, to_canonical_role
from ...schemas.task import MaintenanceTaskResponse, MaintenanceTaskCreate, CriticalityBreakdown
from ...schemas.common import PaginatedResponse
from ...ml.criticality import calculate_task_criticality
from ...utils.security import get_current_user, require_role, require_permission, get_user_data_scope
from ...services.event_bus import DomainEventBus

router = APIRouter()

def _format_task_dict(t: MaintenanceTask) -> dict:
    ast = t.asset
    corr = t.corridor or (ast.corridor if ast else None)
    sec = t.section or (getattr(ast, "section", None) if ast else None)
    traffic = corr.traffic_level if corr else 3
    crit_breakdown = calculate_task_criticality(
        safety_impact=t.safety_impact or 5,
        failure_probability=t.failure_probability or 0.2,
        asset_criticality=ast.criticality if ast else 50,
        overdue_days=t.overdue_days or 0,
        defect_severity=t.severity or 5,
        corridor_traffic_level=traffic
    )

    score = t.priority_score or crit_breakdown.get("total_score", 50)
    level = t.priority_level or ("CRITICAL" if score >= 85 else ("HIGH" if score >= 70 else ("MEDIUM" if score >= 50 else "LOW")))

    # Current Plan details if linked
    current_plan_info = None
    if t.current_plan:
        cp = t.current_plan
        current_plan_info = {
            "plan_id": cp.plan_id,
            "plan_number": cp.plan_number or f"PLAN-2026-{cp.plan_id:05d}",
            "version": cp.version or 1,
            "status": cp.status.value if hasattr(cp.status, "value") else str(cp.status),
            "horizon_start": cp.horizon_start.isoformat() if cp.horizon_start else None,
            "horizon_end": cp.horizon_end.isoformat() if cp.horizon_end else None,
        }

    ref_no = t.reference_no or f"MR-2026-{t.task_id:05d}"
    status_str = t.status.value if hasattr(t.status, "value") else str(t.status)

    ast_name = getattr(ast, "name", None) or (f"{ast.asset_type.value if hasattr(ast.asset_type, 'value') else ast.asset_type} #{ast.asset_id}" if ast else f"Asset #{t.asset_id}")
    ast_location = ast.location if ast else "Section C2-02"
    sec_id = sec.section_id if sec else (getattr(ast, "section_id", None) or 2)
    sec_name = sec.name if sec else "C2-02"

    assigned_name = t.assigned_user.full_name if t.assigned_user else None
    created_name = t.created_user.full_name if t.created_user else None
    created_role = t.created_user.role if t.created_user else "FIELD_INSPECTOR"
    track_num = getattr(ast, "track_number", "Track 2") if ast else "Track 2"

    return {
        "id": t.task_id,
        "task_id": t.task_id,
        "request_number": ref_no,
        "reference_no": ref_no,
        "title": t.defect_type or (t.description[:40] if t.description else "Maintenance Request"),
        "description": t.description,
        "asset_id": t.asset_id,
        "asset_name": ast_name,
        "asset_location": ast_location,
        "track": track_num,
        "track_number": track_num,
        "corridor_id": corr.corridor_id if corr else (ast.corridor_id if ast else 2),
        "corridor_name": corr.name if corr else "Corridor C2",
        "section_id": sec_id,
        "section_name": sec_name,
        "department": t.department,
        "department_id": t.department,
        "task_type": t.task_type.value if hasattr(t.task_type, "value") else str(t.task_type),
        "defect_type": t.defect_type,
        "severity": t.severity,
        "reported_by": t.created_by_user_id or 3,
        "created_by_user_id": t.created_by_user_id,
        "created_user_name": created_name,
        "created_user_role": created_role,
        "assigned_to_user_id": t.assigned_to_user_id,
        "assigned_user_name": assigned_name,
        "detected_at": t.detected_at.isoformat() if t.detected_at else None,
        "reported_at": t.detected_at.isoformat() if t.detected_at else None,
        "due_date": t.due_date.isoformat() if t.due_date else None,
        "preferred_start": t.preferred_start.isoformat() if t.preferred_start else None,
        "preferred_end": t.preferred_end.isoformat() if t.preferred_end else None,
        "estimated_duration": t.estimated_duration,
        "estimated_duration_minutes": t.estimated_duration,
        "required_resources": t.required_resources,
        "required_block_type": t.required_block_type,
        "safety_impact": t.safety_impact,
        "failure_probability": t.failure_probability,
        "overdue_days": t.overdue_days,
        "priority_score": score,
        "priority_level": level,
        "location": t.location_name or ast_location,
        "location_name": t.location_name or ast_location,
        "photo_evidence": t.photo_evidence,
        "additional_notes": t.additional_notes,
        "status": status_str,
        "current_status": status_str,
        "current_plan_id": t.current_plan_id,
        "current_plan": current_plan_info,
        "breakdown": crit_breakdown,
        "created_at": t.created_at.isoformat() if t.created_at else None,
        "updated_at": t.updated_at.isoformat() if t.updated_at else (t.created_at.isoformat() if t.created_at else None)
    }

@router.get("")
def list_tasks(
    department: Optional[str] = None,
    status: Optional[str] = None,
    severity_min: Optional[int] = None,
    corridor_id: Optional[int] = None,
    my_issues: Optional[bool] = None,
    assigned_to_me: Optional[bool] = None,
    completed: Optional[bool] = None,
    scope: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(MaintenanceTask)

    canonical = to_canonical_role(user.role) if user else None

    # Scope filters
    if my_issues is True or scope == "my_issues":
        if user:
            query = query.filter(MaintenanceTask.created_by_user_id == user.user_id)
    elif assigned_to_me is True or scope == "assigned":
        if user:
            query = query.filter(
                (MaintenanceTask.assigned_to_user_id == user.user_id) |
                (MaintenanceTask.department == user.department)
            )
    elif canonical == "INSPECTOR" and scope is None and my_issues is None and completed is None:
        # Default inspector view to their submitted issues
        if user:
            query = query.filter(MaintenanceTask.created_by_user_id == user.user_id)
    elif canonical == "ENGINEER" and scope is None and assigned_to_me is None:
        # Department engineering view
        if user:
            query = query.filter(
                (MaintenanceTask.department == user.department) |
                (MaintenanceTask.assigned_to_user_id == user.user_id)
            )
    elif department:
        query = query.filter(MaintenanceTask.department == department)

    # Completed vs Pending filters
    if completed is True or scope == "completed":
        query = query.filter(MaintenanceTask.status.in_([
            TaskStatus.RESOLVED, TaskStatus.CLOSED, TaskStatus.COMPLETED
        ]))
    elif completed is False or scope == "pending" or scope == "active":
        query = query.filter(~MaintenanceTask.status.in_([
            TaskStatus.RESOLVED, TaskStatus.CLOSED, TaskStatus.COMPLETED, TaskStatus.CANCELLED
        ]))
    elif scope == "approvals":
        query = query.filter(MaintenanceTask.status.in_([
            TaskStatus.NEW, TaskStatus.SUBMITTED, TaskStatus.UNDER_REVIEW, TaskStatus.ACKNOWLEDGED
        ]))
    elif scope == "approved":
        query = query.filter(MaintenanceTask.status.in_([
            TaskStatus.APPROVED, TaskStatus.SCHEDULED
        ]))

    if status:
        query = query.filter(MaintenanceTask.status == status)
    if severity_min:
        query = query.filter(MaintenanceTask.severity >= severity_min)
    if corridor_id:
        query = query.join(Asset).filter(Asset.corridor_id == corridor_id)

    total = query.count()
    tasks = query.order_by(MaintenanceTask.priority_score.desc()).offset((page - 1) * page_size).limit(page_size).all()

    items = [_format_task_dict(t) for t in tasks]

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "dataset_type": "database/persisted"
    }

@router.get("/{task_id}")
def get_task(task_id: int, db: Session = Depends(get_db)):
    t = db.query(MaintenanceTask).filter(MaintenanceTask.task_id == task_id).first()
    if not t:
        raise HTTPException(status_code=404, detail=f"Maintenance request #{task_id} not found")

    return _format_task_dict(t)

@router.get("/{task_id}/priority")
def get_task_priority(task_id: int, db: Session = Depends(get_db)):
    """
    Step 2: AI Prioritization endpoint.
    Exposes explainable priority score, reasons, and recommended action
    in plain language without any ML/algorithm formulas.
    """
    t = db.query(MaintenanceTask).filter(MaintenanceTask.task_id == task_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Maintenance task not found")

    score = t.priority_score or 75
    level = "Critical" if score >= 85 else ("High" if score >= 70 else ("Medium" if score >= 50 else "Low"))

    reasons = []
    if t.safety_impact >= 8:
        reasons.append("Safety impact is high")
    if t.asset and t.asset.criticality >= 80:
        reasons.append("Asset is operationally important")
    if t.overdue_days > 0:
        reasons.append(f"Maintenance is overdue by {t.overdue_days} days")
    if t.severity >= 8:
        reasons.append("Delay may affect mainline passenger train operations")
    if not reasons:
        reasons.append("Periodic preventive cycle reached maintenance window threshold")

    rec = "Schedule at the earliest suitable maintenance block." if score >= 75 else "Combine with upcoming planned corridor possession."

    return {
        "task_id": t.task_id,
        "reference_no": getattr(t, "reference_no", f"MR-2026-00{t.task_id}"),
        "level": level,
        "score": score,
        "max_score": 100,
        "reasons": reasons,
        "recommended_action": rec,
        "status": t.status.value if hasattr(t.status, "value") else str(t.status)
    }

@router.post("")
def create_task(
    payload: MaintenanceTaskCreate,
    user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Step 1: Report Maintenance Work.
    Persists Issue/MaintenanceRequest with database-level transaction, calculates priority, logs audit,
    and broadcasts ISSUE_CREATED domain event to Operations Managers.
    Strictly checks user permission (issue:create).
    """
    if user:
        perms = getattr(user, "permissions", []) or []
        user_role = getattr(user, "role", "")
        # Allow Admin, Manager, Inspector, or anyone with issue:create / maintenance:create
        allowed = (
            user_role in ["SYSTEM_ADMIN", "OPERATIONS_MANAGER", "FIELD_INSPECTOR", "MAINTENANCE_ENGINEER"]
            or "issue:create" in perms
            or "maintenance:create" in perms
            or "*" in perms
        )
        if not allowed:
            raise HTTPException(status_code=403, detail="Forbidden: You do not have permission to report maintenance issues.")

    # Idempotency check
    if payload.idempotency_key:
        existing = db.query(MaintenanceTask).filter(MaintenanceTask.idempotency_key == payload.idempotency_key).first()
        if existing:
            return {
                "success": True,
                "data": _format_task_dict(existing),
                "message": f"Existing issue retrieved with idempotency key: {existing.reference_no}",
                **_format_task_dict(existing)
            }

    target_asset_id = payload.asset_id
    if not target_asset_id:
        dept_asset = db.query(Asset).filter(Asset.department == payload.department).first()
        if not dept_asset:
            dept_asset = db.query(Asset).first()
        target_asset_id = dept_asset.asset_id if dept_asset else 1

    ast = db.query(Asset).filter(Asset.asset_id == target_asset_id).first()
    traffic = ast.corridor.traffic_level if (ast and ast.corridor) else 3

    actual_fail_p = payload.failure_probability
    if payload.safety_impact >= 8 and payload.severity >= 8 and (actual_fail_p is None or actual_fail_p <= 0.3):
        actual_fail_p = 0.85
    elif actual_fail_p is None:
        actual_fail_p = 0.30

    crit_res = calculate_task_criticality(
        safety_impact=payload.safety_impact,
        failure_probability=actual_fail_p,
        asset_criticality=ast.criticality if ast else 50,
        overdue_days=payload.overdue_days,
        defect_severity=payload.severity,
        corridor_traffic_level=traffic
    )

    score = crit_res["total_score"]
    level = "CRITICAL" if score >= 85 else ("HIGH" if score >= 70 else ("MEDIUM" if score >= 50 else "LOW"))

    corridor_id = (ast.corridor_id if ast and ast.corridor_id else None) or 2
    sec = db.query(Section).filter(Section.corridor_id == corridor_id).first()
    section_id = sec.section_id if sec else 2

    # Database transaction
    try:
        new_task = MaintenanceTask(
            asset_id=target_asset_id,
            corridor_id=corridor_id,
            section_id=section_id,
            location_name=payload.location_name or (ast.location if ast else f"Section C2-0{section_id}"),
            department=payload.department,
            task_type=payload.task_type,
            defect_type=payload.defect_type or "Maintenance defect",
            description=payload.description,
            severity=payload.severity,
            photo_evidence=payload.photo_evidence,
            additional_notes=payload.additional_notes,
            idempotency_key=payload.idempotency_key,
            estimated_duration=payload.estimated_duration,
            required_block_type=payload.required_block_type,
            safety_impact=payload.safety_impact,
            failure_probability=actual_fail_p,
            overdue_days=payload.overdue_days,
            priority_score=score,
            priority_level=level,
            status=TaskStatus.NEW,
            created_by_user_id=user.user_id if user else None
        )
        db.add(new_task)
        db.flush()

        ref_no = f"IR-2026-{new_task.task_id:04d}"
        new_task.reference_no = ref_no

        audit = AuditLog(
            action="MAINTENANCE_REPORTED",
            entity_type="TASK",
            entity_id=ref_no,
            user_id=user.employee_id if user else "EMP-INS-001",
            details=f"Issue {ref_no} reported: {payload.description} (Priority: {score}/100 - {level})"
        )
        db.add(audit)
        db.commit()
        db.refresh(new_task)
    except Exception as ex:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to persist maintenance request: {str(ex)}")

    # Broadcast ISSUE_CREATED domain event
    try:
        DomainEventBus.publish(
            db=db,
            event_type="ISSUE_CREATED",
            aggregate_type="ISSUE",
            aggregate_id=ref_no,
            payload={
                "task_id": new_task.task_id,
                "reference_no": ref_no,
                "title": new_task.defect_type or new_task.description[:40],
                "description": new_task.description,
                "severity": new_task.severity,
                "priority_score": score,
                "priority_level": level,
                "department": new_task.department,
                "location": new_task.location_name or (ast.location if ast else "Section C2-02"),
                "status": "NEW"
            },
            user_id=user.user_id if user else None,
            target_role="OPERATIONS_MANAGER",
            title=f"New Issue: {ref_no}",
            message=f"{ref_no} ({new_task.defect_type or 'Rail defect'}) reported by {user.full_name if user else 'Field Inspector'}.",
            reference_type="ISSUE",
            reference_id=ref_no
        )
    except Exception as bus_err:
        print(f"[EVENT_BUS] Broadcast error: {bus_err}")

    formatted = _format_task_dict(new_task)
    return {
        "success": True,
        "data": formatted,
        "message": f"Maintenance issue {ref_no} submitted and prioritized ({score}/100 - {level}).",
        **formatted
    }

@router.post("/{task_id}/acknowledge")
def acknowledge_task(
    task_id: int,
    user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Operations Manager acknowledges incoming field issue."""
    t = db.query(MaintenanceTask).filter(MaintenanceTask.task_id == task_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Maintenance issue not found")

    t.status = TaskStatus.ACKNOWLEDGED
    db.commit()
    db.refresh(t)

    DomainEventBus.publish(
        db=db,
        event_type="ISSUE_UPDATED",
        aggregate_type="ISSUE",
        aggregate_id=t.reference_no or str(t.task_id),
        payload={"task_id": t.task_id, "status": "ACKNOWLEDGED"},
        user_id=user.user_id if user else None,
        target_role="FIELD_INSPECTOR",
        title=f"Issue {t.reference_no} Acknowledged",
        message=f"Issue {t.reference_no} has been acknowledged by operations management.",
        reference_type="ISSUE",
        reference_id=t.reference_no
    )
    return _format_task_dict(t)

@router.post("/{task_id}/submit")
def submit_task(task_id: int, db: Session = Depends(get_db)):
    t = db.query(MaintenanceTask).filter(MaintenanceTask.task_id == task_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Maintenance task not found")
    t.status = TaskStatus.NEW
    db.commit()
    db.refresh(t)
    return _format_task_dict(t)

class ApproveTaskRequest(BaseModel):
    comments: Optional[str] = "Approved for corridor maintenance work."
    assigned_to_user_id: Optional[int] = None

class RejectTaskRequest(BaseModel):
    reason: str

class ClarifyTaskRequest(BaseModel):
    comments: str

class AssignTaskRequest(BaseModel):
    assigned_to_user_id: int
    instructions: Optional[str] = None

class StartTaskWorkRequest(BaseModel):
    notes: Optional[str] = "Field maintenance started."

class ResolveTaskWorkRequest(BaseModel):
    actual_duration_minutes: Optional[int] = 60
    completion_notes: str
    photo_evidence: Optional[str] = None

class VerifyTaskRequest(BaseModel):
    verification_notes: Optional[str] = "Work verified and track possession cleared."

@router.post("/{task_id}/approve")
def approve_task(
    task_id: int,
    payload: Optional[ApproveTaskRequest] = None,
    user: User = Depends(require_role(["MANAGER", "ADMIN"])),
    db: Session = Depends(get_db)
):
    t = db.query(MaintenanceTask).filter(MaintenanceTask.task_id == task_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Maintenance issue not found")

    t.status = TaskStatus.APPROVED
    if payload and payload.assigned_to_user_id:
        t.assigned_to_user_id = payload.assigned_to_user_id
        t.status = TaskStatus.SCHEDULED

    audit = AuditLog(
        action="ISSUE_APPROVED",
        entity_type="TASK",
        entity_id=t.reference_no or str(t.task_id),
        user_id=user.employee_id,
        details=f"Issue {t.reference_no} approved by {user.full_name} ({user.role}): {payload.comments if payload else 'Approved'}"
    )
    db.add(audit)
    db.commit()
    db.refresh(t)

    DomainEventBus.publish(
        db=db,
        event_type="ISSUE_APPROVED",
        aggregate_type="ISSUE",
        aggregate_id=t.reference_no or str(t.task_id),
        payload={"task_id": t.task_id, "status": t.status.value},
        user_id=user.user_id,
        target_role="ENGINEER",
        title=f"Issue {t.reference_no} Approved",
        message=f"Issue {t.reference_no} has been approved by {user.full_name}.",
        reference_type="ISSUE",
        reference_id=t.reference_no
    )
    return _format_task_dict(t)

@router.post("/{task_id}/reject")
def reject_task(
    task_id: int,
    payload: RejectTaskRequest,
    user: User = Depends(require_role(["MANAGER", "ADMIN"])),
    db: Session = Depends(get_db)
):
    t = db.query(MaintenanceTask).filter(MaintenanceTask.task_id == task_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Maintenance issue not found")

    t.status = TaskStatus.CANCELLED
    t.additional_notes = f"Rejection reason: {payload.reason}"

    audit = AuditLog(
        action="ISSUE_REJECTED",
        entity_type="TASK",
        entity_id=t.reference_no or str(t.task_id),
        user_id=user.employee_id,
        details=f"Issue {t.reference_no} rejected by {user.full_name}: {payload.reason}"
    )
    db.add(audit)
    db.commit()
    db.refresh(t)

    DomainEventBus.publish(
        db=db,
        event_type="ISSUE_REJECTED",
        aggregate_type="ISSUE",
        aggregate_id=t.reference_no or str(t.task_id),
        payload={"task_id": t.task_id, "status": "CANCELLED", "reason": payload.reason},
        user_id=user.user_id,
        target_role="FIELD_INSPECTOR",
        title=f"Issue {t.reference_no} Rejected",
        message=f"Issue {t.reference_no} was rejected: {payload.reason}",
        reference_type="ISSUE",
        reference_id=t.reference_no
    )
    return _format_task_dict(t)

@router.post("/{task_id}/clarify")
def clarify_task(
    task_id: int,
    payload: ClarifyTaskRequest,
    user: User = Depends(require_role(["MANAGER", "ADMIN"])),
    db: Session = Depends(get_db)
):
    t = db.query(MaintenanceTask).filter(MaintenanceTask.task_id == task_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Maintenance issue not found")

    t.status = TaskStatus.UNDER_REVIEW
    t.additional_notes = f"Clarification requested: {payload.comments}"
    db.commit()
    db.refresh(t)
    return _format_task_dict(t)

@router.post("/{task_id}/assign")
def assign_task(
    task_id: int,
    payload: AssignTaskRequest,
    user: User = Depends(require_role(["MANAGER", "ADMIN"])),
    db: Session = Depends(get_db)
):
    t = db.query(MaintenanceTask).filter(MaintenanceTask.task_id == task_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Maintenance issue not found")

    assigned_engineer = db.query(User).filter(User.user_id == payload.assigned_to_user_id).first()
    if not assigned_engineer:
        raise HTTPException(status_code=404, detail="Assigned user not found")

    t.assigned_to_user_id = payload.assigned_to_user_id
    t.status = TaskStatus.SCHEDULED
    if payload.instructions:
        t.additional_notes = f"Assignment Instructions: {payload.instructions}"

    audit = AuditLog(
        action="WORK_ASSIGNED",
        entity_type="TASK",
        entity_id=t.reference_no or str(t.task_id),
        user_id=user.employee_id,
        details=f"Issue {t.reference_no} assigned to {assigned_engineer.full_name} ({assigned_engineer.employee_id})"
    )
    db.add(audit)
    db.commit()
    db.refresh(t)

    DomainEventBus.publish(
        db=db,
        event_type="WORK_ASSIGNED",
        aggregate_type="TASK",
        aggregate_id=t.reference_no or str(t.task_id),
        payload={"task_id": t.task_id, "assigned_to_user_id": payload.assigned_to_user_id},
        user_id=user.user_id,
        target_role="ENGINEER",
        title=f"Work Assigned: {t.reference_no}",
        message=f"You have been assigned maintenance task {t.reference_no}.",
        reference_type="ISSUE",
        reference_id=t.reference_no
    )
    return _format_task_dict(t)

@router.post("/{task_id}/start")
def start_task(
    task_id: int,
    payload: Optional[StartTaskWorkRequest] = None,
    user: User = Depends(require_role(["ENGINEER", "ADMIN"])),
    db: Session = Depends(get_db)
):
    t = db.query(MaintenanceTask).filter(MaintenanceTask.task_id == task_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Maintenance issue not found")

    t.status = TaskStatus.IN_PROGRESS
    audit = AuditLog(
        action="WORK_STARTED",
        entity_type="TASK",
        entity_id=t.reference_no or str(t.task_id),
        user_id=user.employee_id,
        details=f"Work started on {t.reference_no} by {user.full_name}"
    )
    db.add(audit)
    db.commit()
    db.refresh(t)

    DomainEventBus.publish(
        db=db,
        event_type="WORK_STARTED",
        aggregate_type="TASK",
        aggregate_id=t.reference_no or str(t.task_id),
        payload={"task_id": t.task_id, "status": "IN_PROGRESS"},
        user_id=user.user_id,
        target_role="OPERATIONS_MANAGER",
        title=f"Work Started: {t.reference_no}",
        message=f"{user.full_name} started work on {t.reference_no}.",
        reference_type="ISSUE",
        reference_id=t.reference_no
    )
    return _format_task_dict(t)

@router.post("/{task_id}/resolve")
def resolve_task(
    task_id: int,
    payload: ResolveTaskWorkRequest,
    user: User = Depends(require_role(["ENGINEER", "ADMIN"])),
    db: Session = Depends(get_db)
):
    t = db.query(MaintenanceTask).filter(MaintenanceTask.task_id == task_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Maintenance issue not found")

    t.status = TaskStatus.RESOLVED
    if payload.photo_evidence:
        t.photo_evidence = payload.photo_evidence
    if payload.completion_notes:
        t.additional_notes = f"{t.additional_notes or ''}\nResolution: {payload.completion_notes}".strip()

    audit = AuditLog(
        action="WORK_RESOLVED",
        entity_type="TASK",
        entity_id=t.reference_no or str(t.task_id),
        user_id=user.employee_id,
        details=f"Work on {t.reference_no} marked resolved by {user.full_name}. Notes: {payload.completion_notes}"
    )
    db.add(audit)
    db.commit()
    db.refresh(t)

    DomainEventBus.publish(
        db=db,
        event_type="WORK_RESOLVED",
        aggregate_type="TASK",
        aggregate_id=t.reference_no or str(t.task_id),
        payload={"task_id": t.task_id, "status": "RESOLVED"},
        user_id=user.user_id,
        target_role="OPERATIONS_MANAGER",
        title=f"Work Resolved: {t.reference_no}",
        message=f"Work on {t.reference_no} was completed by {user.full_name}. Awaiting verification.",
        reference_type="ISSUE",
        reference_id=t.reference_no
    )
    return _format_task_dict(t)

@router.post("/{task_id}/verify")
def verify_task(
    task_id: int,
    payload: Optional[VerifyTaskRequest] = None,
    user: User = Depends(require_role(["MANAGER", "ADMIN"])),
    db: Session = Depends(get_db)
):
    t = db.query(MaintenanceTask).filter(MaintenanceTask.task_id == task_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Maintenance issue not found")

    t.status = TaskStatus.CLOSED
    audit = AuditLog(
        action="ISSUE_CLOSED",
        entity_type="TASK",
        entity_id=t.reference_no or str(t.task_id),
        user_id=user.employee_id,
        details=f"Issue {t.reference_no} verified and closed by {user.full_name} ({user.role})"
    )
    db.add(audit)
    db.commit()
    db.refresh(t)

    DomainEventBus.publish(
        db=db,
        event_type="ISSUE_CLOSED",
        aggregate_type="ISSUE",
        aggregate_id=t.reference_no or str(t.task_id),
        payload={"task_id": t.task_id, "status": "CLOSED"},
        user_id=user.user_id,
        target_role="FIELD_INSPECTOR",
        title=f"Issue {t.reference_no} Verified & Closed",
        message=f"Issue {t.reference_no} has been verified and officially closed.",
        reference_type="ISSUE",
        reference_id=t.reference_no
    )
    return _format_task_dict(t)
