from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from ...db.session import get_db
from ...models.auth import User
from ...models.plan import MaintenancePlan, PlanAssignment, PlanStatus
from ...models.maintenance_task import MaintenanceTask, TaskStatus
from ...models.execution import ExecutionRecord, ExecutionStatus, FieldEvidence, Notification, ExecutionIssue
from ...models.critical_event import CriticalEvent
from ...models.scenario import AuditLog
from ...utils.security import get_current_user, require_permission
from ...services.event_bus import DomainEventBus

router = APIRouter()

class StartWorkRequest(BaseModel):
    notes: Optional[str] = "Maintenance crew commenced work with standard safety flag protection."

class CompleteWorkRequest(BaseModel):
    actual_duration_minutes: int
    completion_note: str
    issue_encountered: Optional[str] = "None. Work completed as per standard operating procedure."

class ReportProblemRequest(BaseModel):
    issue_category: str = "Additional defect"
    description: str
    is_critical: bool = False
    photo_evidence: Optional[str] = None

class EvidenceUploadRequest(BaseModel):
    file_name: str
    file_type: Optional[str] = "image/jpeg"
    file_data: Optional[str] = None  # Base64 string or image URL
    comments: Optional[str] = "Post-work ultrasonic weld test and track clearance photograph"

@router.get("/today")
def get_today_work(user: Optional[User] = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Field Inspector mobile-friendly today's assignment view.
    Returns today's active assignments on Section C2-02 from approved/scheduled plans.
    """
    # Auto-synchronize any approved plan assignments that lack execution records
    approved_plans = db.query(MaintenancePlan).filter(
        MaintenancePlan.status.in_([PlanStatus.APPROVED, PlanStatus.SCHEDULED, PlanStatus.IN_PROGRESS])
    ).all()

    inspector = db.query(User).filter(User.role == "FIELD_INSPECTOR").first()
    for ap in approved_plans:
        for pa in ap.assignments:
            existing_er = db.query(ExecutionRecord).filter(ExecutionRecord.assignment_id == pa.assignment_id).first()
            if not existing_er:
                new_er = ExecutionRecord(
                    assignment_id=pa.assignment_id,
                    task_id=pa.task_id,
                    inspector_id=inspector.user_id if inspector else None,
                    status=ExecutionStatus.NOT_STARTED
                )
                db.add(new_er)
    db.commit()

    records = db.query(ExecutionRecord).order_by(ExecutionRecord.record_id.asc()).all()
    results = []

    for er in records:
        pa = er.assignment
        task = er.task
        ast = task.asset if task else None
        plan = pa.plan if pa else None

        results.append({
            "record_id": er.record_id,
            "assignment_id": pa.assignment_id if pa else None,
            "task_id": task.task_id if task else None,
            "plan_id": plan.plan_id if plan else None,
            "plan_number": plan.plan_number if plan else (f"PLAN-2026-{plan.plan_id:05d}" if plan else "PLAN-2026-00101"),
            "plan_version": plan.version if plan else 1,
            "reference_no": getattr(task, "reference_no", f"MR-2026-{task.task_id:05d}" if task else "MR-0"),
            "task_description": task.description if task else "Maintenance Work",
            "defect_type": task.defect_type if task else "Routine defect",
            "location": ast.location if ast else "Section C2-02 (KM 42.8)",
            "section_code": "C2-02",
            "department": task.department if task else "Engineering/Track",
            "scheduled_window": f"{pa.assigned_start_time.strftime('%H:%M')} – {pa.assigned_end_time.strftime('%H:%M')}" if (pa and pa.assigned_start_time and pa.assigned_end_time) else "14:00 – 16:30",
            "estimated_duration": f"{task.estimated_duration if task else 120} min",
            "status": er.status.value,
            "started_at": er.started_at.isoformat() if er.started_at else None,
            "completed_at": er.completed_at.isoformat() if er.completed_at else None,
            "actual_duration_minutes": er.actual_duration_minutes,
            "completion_note": er.completion_note,
            "issue_encountered": er.issue_encountered,
            "evidence_count": len(er.evidence_items),
            "instructions": [
                "1. Establish red flag protection at 600m and 1200m distance",
                "2. Verify adjacent line track circuit continuity before cutting rail",
                "3. Use hydraulic rail tensor to maintain neutral temperature gap",
                "4. Photograph welded joint after grinding and ultrasonic test"
            ]
        })

    return results

@router.post("/{assignment_id}/start")
def start_work(
    assignment_id: int,
    request: StartWorkRequest,
    user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Field user marks work started.
    Sets status to IN_PROGRESS and records actual timestamp across assignment, task, plan, and request.
    """
    pa = db.query(PlanAssignment).filter(PlanAssignment.assignment_id == assignment_id).first()
    if not pa:
        raise HTTPException(status_code=404, detail="Assignment not found")

    now = datetime.now()
    pa.status = "IN_PROGRESS"
    pa.actual_start_time = now

    task = pa.task
    if task:
        task.status = TaskStatus.IN_PROGRESS

    plan = pa.plan
    if plan:
        plan.status = PlanStatus.IN_PROGRESS
        if plan.maintenance_request:
            plan.maintenance_request.status = TaskStatus.IN_PROGRESS

    er = db.query(ExecutionRecord).filter(ExecutionRecord.assignment_id == assignment_id).first()
    if not er:
        er = ExecutionRecord(
            assignment_id=assignment_id,
            task_id=pa.task_id,
            inspector_id=user.user_id if user else None,
            status=ExecutionStatus.IN_PROGRESS,
            started_at=now
        )
        db.add(er)
    else:
        er.status = ExecutionStatus.IN_PROGRESS
        er.started_at = now

    user_name = user.full_name if user else "Inspector Manoj"

    audit = AuditLog(
        action="WORK_STARTED",
        entity_type="TASK",
        entity_id=str(pa.task_id),
        user_id=user.employee_id if user else "EMP-INS-007",
        details=f"Field work started on Task {pa.task_id} by {user_name} at {now.strftime('%H:%M')}"
    )
    db.add(audit)

    notif = Notification(
        target_role="OPERATIONS_MANAGER",
        title="Field Maintenance Started",
        message=f"Work started on Task {pa.task_id} at Section C2-02 by {user_name}.",
        link="/execution",
        notification_type="INFO",
        event_type="TASK_STARTED",
        reference_type="TASK",
        reference_id=str(pa.task_id)
    )
    db.add(notif)
    db.commit()

    # Domain Event Bus broadcast
    try:
        DomainEventBus.publish(
            db=db,
            event_type="TASK_STARTED",
            aggregate_type="TASK",
            aggregate_id=str(pa.task_id),
            payload={
                "assignment_id": assignment_id,
                "task_id": pa.task_id,
                "plan_id": plan.plan_id if plan else None,
                "plan_number": plan.plan_number if plan else None,
                "started_at": now.isoformat(),
                "engineer_name": user_name
            },
            user_id=user.user_id if user else None,
            target_role="OPERATIONS_MANAGER",
            title=f"Task #{pa.task_id} IN PROGRESS",
            message=f"Work started by {user_name} at {now.strftime('%H:%M')}.",
            reference_type="TASK",
            reference_id=str(pa.task_id)
        )
    except Exception as bus_err:
        print(f"[EVENT_BUS] TASK_STARTED error: {bus_err}")

    return {
        "assignment_id": assignment_id,
        "status": "IN_PROGRESS",
        "started_at": now.isoformat(),
        "message": f"Work started successfully at {now.strftime('%H:%M')}."
    }

@router.post("/{assignment_id}/complete")
def complete_work(
    assignment_id: int,
    request: CompleteWorkRequest,
    user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Field user marks work completed.
    Requires completion note, actual duration, and issue encountered.
    Transitions status to COMPLETED and propagates across assignment, task, plan, and request.
    Broadcasts TASK_COMPLETED and ISSUE_UPDATED (RESOLVED) events.
    """
    pa = db.query(PlanAssignment).filter(PlanAssignment.assignment_id == assignment_id).first()
    if not pa:
        raise HTTPException(status_code=404, detail="Assignment not found")

    now = datetime.now()
    pa.status = "COMPLETED"
    pa.actual_end_time = now

    task = pa.task
    if task:
        task.status = TaskStatus.RESOLVED

    plan = pa.plan
    all_completed = False
    if plan:
        all_completed = all(a.status == "COMPLETED" for a in plan.assignments)
        if all_completed:
            plan.status = PlanStatus.COMPLETED
            if plan.maintenance_request:
                plan.maintenance_request.status = TaskStatus.RESOLVED

    er = db.query(ExecutionRecord).filter(ExecutionRecord.assignment_id == assignment_id).first()
    if er:
        er.status = ExecutionStatus.COMPLETED
        er.completed_at = now
        er.actual_duration_minutes = request.actual_duration_minutes
        er.completion_note = request.completion_note
        er.issue_encountered = request.issue_encountered

    user_name = user.full_name if user else "Engineer Arun"

    audit = AuditLog(
        action="WORK_COMPLETED",
        entity_type="TASK",
        entity_id=str(pa.task_id),
        user_id=user.employee_id if user else "EMP-INS-007",
        details=f"Task {pa.task_id} completed in {request.actual_duration_minutes} min by {user_name}. Note: {request.completion_note}"
    )
    db.add(audit)

    notif = Notification(
        target_role="OPERATIONS_MANAGER",
        title="Maintenance Task Completed",
        message=f"Work completed on Task {pa.task_id} at Section C2-02. Actual duration: {request.actual_duration_minutes} mins.",
        link="/execution",
        notification_type="INFO",
        event_type="TASK_COMPLETED",
        reference_type="TASK",
        reference_id=str(pa.task_id)
    )
    db.add(notif)
    db.commit()

    # Broadcast TASK_COMPLETED
    try:
        DomainEventBus.publish(
            db=db,
            event_type="TASK_COMPLETED",
            aggregate_type="TASK",
            aggregate_id=str(pa.task_id),
            payload={
                "assignment_id": assignment_id,
                "task_id": pa.task_id,
                "plan_id": plan.plan_id if plan else None,
                "completed_at": now.isoformat(),
                "actual_duration_minutes": request.actual_duration_minutes,
                "engineer_name": user_name
            },
            user_id=user.user_id if user else None,
            target_role="OPERATIONS_MANAGER",
            title=f"Task #{pa.task_id} COMPLETED",
            message=f"Work completed by {user_name} in {request.actual_duration_minutes} min.",
            reference_type="TASK",
            reference_id=str(pa.task_id)
        )

        if all_completed and plan and plan.maintenance_request:
            req_ref = plan.maintenance_request.reference_no or f"IR-2026-{plan.maintenance_request.task_id:04d}"
            DomainEventBus.publish(
                db=db,
                event_type="ISSUE_UPDATED",
                aggregate_type="ISSUE",
                aggregate_id=req_ref,
                payload={"status": "RESOLVED", "task_id": plan.maintenance_request.task_id},
                target_role="OPERATIONS_MANAGER",
                title=f"Issue {req_ref} Resolved",
                message=f"All work completed. Issue {req_ref} marked RESOLVED."
            )
    except Exception as bus_err:
        print(f"[EVENT_BUS] TASK_COMPLETED error: {bus_err}")

    return {
        "assignment_id": assignment_id,
        "status": "COMPLETED",
        "completed_at": now.isoformat(),
        "actual_duration_minutes": request.actual_duration_minutes,
        "message": f"Work completed successfully. Possession cleared at {now.strftime('%H:%M')}."
    }

@router.post("/{assignment_id}/report-problem")
def report_problem(
    assignment_id: int,
    request: ReportProblemRequest,
    user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Engineer reports an in-field problem or blocker during work execution.
    If marked critical, immediately creates a CriticalEvent entity linked to the affected plan,
    transitions task/assignment to BLOCKED, and broadcasts CRITICAL_EVENT_CREATED to Operations Manager.
    """
    pa = db.query(PlanAssignment).filter(PlanAssignment.assignment_id == assignment_id).first()
    if not pa:
        raise HTTPException(status_code=404, detail="Assignment not found")

    user_name = user.full_name if user else "Engineer Arun"
    task = pa.task
    plan = pa.plan

    # Save ExecutionIssue
    exec_issue = ExecutionIssue(
        assignment_id=assignment_id,
        task_id=pa.task_id,
        issue_category=request.issue_category,
        severity="CRITICAL" if request.is_critical else "WARNING",
        is_critical=request.is_critical,
        description=request.description,
        photo_evidence=request.photo_evidence,
        reported_by=user_name
    )
    db.add(exec_issue)
    db.flush()

    critical_event_id = None
    event_number = None

    if request.is_critical:
        import uuid
        crit_event = CriticalEvent(
            event_number=f"CE-TMP-{uuid.uuid4().hex[:4].upper()}",
            type="CRITICAL_FIELD_DEFECT",
            asset_id=task.asset_id if task else 2,
            corridor_id=plan.corridor_id if plan else 2,
            section_id=task.section_id if task else 2,
            severity=10,
            description=f"CRITICAL PROBLEM during {plan.plan_number if plan else 'Work'}: {request.description}",
            reported_by=user_name,
            affected_plan_id=plan.plan_id if plan else None,
            status="OPEN",
            replan_required=True
        )
        db.add(crit_event)
        db.flush()
        crit_event.event_number = f"CE-2026-{crit_event.event_id:04d}"
        critical_event_id = crit_event.event_id
        event_number = crit_event.event_number

        # Update assignment, task, and execution record status
        pa.status = "BLOCKED"
        if task:
            task.status = TaskStatus.BLOCKED

        er = db.query(ExecutionRecord).filter(ExecutionRecord.assignment_id == assignment_id).first()
        if er:
            er.status = ExecutionStatus.BLOCKED

        db.commit()

        # Broadcast CRITICAL_EVENT_CREATED
        try:
            DomainEventBus.publish(
                db=db,
                event_type="CRITICAL_EVENT_CREATED",
                aggregate_type="CRITICAL_EVENT",
                aggregate_id=event_number,
                payload={
                    "event_id": critical_event_id,
                    "event_number": event_number,
                    "affected_plan_id": plan.plan_id if plan else None,
                    "affected_plan_number": plan.plan_number if plan else None,
                    "task_id": pa.task_id,
                    "description": request.description,
                    "severity": 10,
                    "replan_required": True,
                    "reported_by": user_name
                },
                user_id=user.user_id if user else None,
                target_role="OPERATIONS_MANAGER",
                title=f"🚨 CRITICAL MAINTENANCE EVENT: {event_number}",
                message=f"Plan {plan.plan_number if plan else ''} affected: {request.description}. Replanning required.",
                reference_type="CRITICAL_EVENT",
                reference_id=event_number
            )
        except Exception as bus_err:
            print(f"[EVENT_BUS] CRITICAL_EVENT_CREATED error: {bus_err}")
    else:
        db.commit()
        # Broadcast warning
        try:
            DomainEventBus.publish(
                db=db,
                event_type="ENGINEER_BLOCKED_TASK",
                aggregate_type="TASK",
                aggregate_id=str(pa.task_id),
                payload={
                    "assignment_id": assignment_id,
                    "task_id": pa.task_id,
                    "category": request.issue_category,
                    "description": request.description,
                    "reported_by": user_name
                },
                user_id=user.user_id if user else None,
                target_role="OPERATIONS_MANAGER",
                title="Field Work Problem Reported",
                message=f"Issue on Task #{pa.task_id}: {request.description}",
                reference_type="TASK",
                reference_id=str(pa.task_id)
            )
        except Exception as bus_err:
            print(f"[EVENT_BUS] ENGINEER_BLOCKED_TASK error: {bus_err}")

    return {
        "success": True,
        "issue_id": exec_issue.issue_id,
        "is_critical": request.is_critical,
        "critical_event_id": critical_event_id,
        "event_number": event_number,
        "message": f"Problem reported successfully{' with critical replan alert' if request.is_critical else ''}."
    }

@router.post("/{assignment_id}/evidence")
def upload_evidence(
    assignment_id: int,
    request: EvidenceUploadRequest,
    user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload field photograph or PDF evidence.
    """
    pa = db.query(PlanAssignment).filter(PlanAssignment.assignment_id == assignment_id).first()
    if not pa:
        raise HTTPException(status_code=404, detail="Assignment not found")

    er = db.query(ExecutionRecord).filter(ExecutionRecord.assignment_id == assignment_id).first()

    evidence = FieldEvidence(
        execution_id=er.record_id if er else None,
        task_id=pa.task_id,
        file_name=request.file_name,
        file_type=request.file_type or "image/jpeg",
        file_data=request.file_data,
        comments=request.comments,
        uploaded_by=user.full_name if user else "Inspector Manoj"
    )
    db.add(evidence)
    db.commit()

    return {
        "evidence_id": evidence.evidence_id,
        "file_name": evidence.file_name,
        "uploaded_at": evidence.uploaded_at.isoformat(),
        "message": "Field evidence uploaded and linked to task record successfully."
    }
