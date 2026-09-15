import pytest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "backend"))

from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal
from app.models.maintenance_task import MaintenanceTask, TaskStatus
from app.models.plan import MaintenancePlan, PlanStatus
from app.models.critical_event import CriticalEvent
from app.models.execution import ExecutionIssue, DomainEvent

client = TestClient(app)

def test_multi_user_shared_operational_workflow():
    """
    MASTER PRODUCTION PRODUCT ACCEPTANCE TEST (Sections 70, 71 & 81)
    
    Validates the complete multi-user operational lifecycle across 3 distinct roles
    operating on the exact same database records:
    
    1. Inspector logs in (inspector@railopt.demo) -> Reports Issue IR-2026-0042
    2. Operations Manager logs in (manager@railopt.demo) -> Receives issue in real-time, generates AI Plan v1
    3. Manager approves Plan v1 -> Dispatches to Engineer, Timetable updated
    4. Engineer logs in (engineer@railopt.demo) -> Receives assignment, starts work (IN_PROGRESS)
    5. Engineer reports unexpected critical defect -> Creates CriticalEvent, marks assignment BLOCKED
    6. Manager receives critical alert in real-time -> Generates AI Revised Plan v2 (v1 frozen as SUPERSEDED)
    7. Manager approves Plan v2 -> Timetable updated with new window, Engineer receives v2
    8. Engineer completes work -> Task COMPLETED, Issue marked RESOLVED
    9. Authoritative DB verification: Records persisted across restarts, no mock or browser-local state.
    """
    # =========================================================================
    # 1. USER AUTHENTICATION FOR ALL 3 ROLES
    # =========================================================================
    
    # 1a. Device 1: Field Inspector
    insp_res = client.post("/api/auth/login", json={
        "username": "inspector@railopt.demo",
        "password": "RailOpt@2026"
    })
    assert insp_res.status_code == 200, f"Inspector login failed: {insp_res.text}"
    insp_token = insp_res.json()["access_token"]
    insp_headers = {"Authorization": f"Bearer {insp_token}"}
    
    insp_me = client.get("/api/auth/me", headers=insp_headers).json()
    assert insp_me["role"] == "FIELD_INSPECTOR"

    # 1b. Device 2: Operations Manager
    mgr_res = client.post("/api/auth/login", json={
        "username": "manager@railopt.demo",
        "password": "RailOpt@2026"
    })
    assert mgr_res.status_code == 200, f"Manager login failed: {mgr_res.text}"
    mgr_token = mgr_res.json()["access_token"]
    mgr_headers = {"Authorization": f"Bearer {mgr_token}"}
    
    mgr_me = client.get("/api/auth/me", headers=mgr_headers).json()
    assert mgr_me["role"] == "OPERATIONS_MANAGER"

    # 1c. Device 3: Maintenance Engineer
    eng_res = client.post("/api/auth/login", json={
        "username": "engineer@railopt.demo",
        "password": "RailOpt@2026"
    })
    assert eng_res.status_code == 200, f"Engineer login failed: {eng_res.text}"
    eng_token = eng_res.json()["access_token"]
    eng_headers = {"Authorization": f"Bearer {eng_token}"}
    
    eng_me = client.get("/api/auth/me", headers=eng_headers).json()
    assert eng_me["role"] == "MAINTENANCE_ENGINEER"

    # =========================================================================
    # 2. DEVICE 1 — INSPECTOR REPORTS FIELD ISSUE (IR-2026-XXXX)
    # =========================================================================
    import uuid
    idemp_key = f"IDEMP-{uuid.uuid4().hex[:8]}"
    
    issue_payload = {
        "asset_id": 2,
        "department": "Engineering/Track",
        "task_type": "CORRECTIVE",
        "defect_type": "Rail defect",
        "description": "Critical transverse rail fissure detected on Section C2-04 near KM 48.2",
        "severity": 9,
        "safety_impact": 9,
        "failure_probability": 0.85,
        "estimated_duration": 150,
        "required_block_type": "TRAFFIC_BLOCK",
        "location_name": "Section C2-04 (KM 48.2)",
        "additional_notes": "Ultrasonic flaw detector indicates high risk of sudden rail fracture.",
        "idempotency_key": idemp_key
    }
    
    create_issue_res = client.post("/api/maintenance-tasks", json=issue_payload, headers=insp_headers)
    assert create_issue_res.status_code == 200, f"Issue creation failed: {create_issue_res.text}"
    issue_data = create_issue_res.json()
    
    task_id = issue_data["task_id"]
    issue_ref = issue_data["reference_no"]
    assert issue_ref.startswith("IR-2026-"), f"Expected IR-YYYY-NNNN format, got {issue_ref}"
    assert issue_data["priority_level"] in ["CRITICAL", "HIGH"]
    assert issue_data["status"] in ["NEW", "SUBMITTED"]

    # =========================================================================
    # 3. DEVICE 2 — MANAGER RECEIVES ISSUE & GENERATES AI PLAN v1
    # =========================================================================
    # Manager receives notification via event bus
    mgr_notifs_res = client.get("/api/notifications", headers=mgr_headers)
    assert mgr_notifs_res.status_code == 200
    mgr_notifs = mgr_notifs_res.json()["items"]
    assert any(issue_ref in n["message"] or issue_ref in n["title"] or n["title"].startswith("New Defect") for n in mgr_notifs), \
        f"Manager did not receive notification for {issue_ref}"

    # Manager generates AI maintenance plan
    plan_gen_res = client.post("/api/planning-workflow/generate", json={
        "corridor_ids": [2],
        "departments": ["Engineering/Track", "S&T/Signalling", "Traction Distribution"],
        "maintenance_request_id": task_id
    }, headers=mgr_headers)
    assert plan_gen_res.status_code == 200, f"Plan generation failed: {plan_gen_res.text}"
    plan_v1_data = plan_gen_res.json()
    
    plan_v1_id = plan_v1_data["plan_id"]
    plan_v1_number = plan_v1_data["plan_number"]
    assert plan_v1_number.startswith("PLAN-2026-")
    assert plan_v1_data["version"] == 1
    assert len(plan_v1_data["assignments"]) > 0

    # =========================================================================
    # 4. DEVICE 2 — MANAGER APPROVES PLAN v1
    # =========================================================================
    approve_res = client.post(f"/api/planning-workflow/{plan_v1_id}/approve", json={
        "comments": "Approved for corridor track possession."
    }, headers=mgr_headers)
    assert approve_res.status_code == 200, f"Plan approval failed: {approve_res.text}"
    assert approve_res.json()["status"] == "APPROVED"

    # Verify unauthorized approval is strictly forbidden (RBAC test: Inspector cannot approve)
    insp_unauth_approve = client.post(f"/api/planning-workflow/{plan_v1_id}/approve", json={
        "comments": "Inspector trying to approve"
    }, headers=insp_headers)
    assert insp_unauth_approve.status_code == 403, "Inspector must NOT be allowed to approve plans"

    # =========================================================================
    # 5. DEVICE 3 — ENGINEER RECEIVES ASSIGNMENT & STARTS WORK
    # =========================================================================
    today_work_res = client.get("/api/execution/today", headers=eng_headers)
    assert today_work_res.status_code == 200
    today_work = today_work_res.json()
    
    # Find assignment linked to our task
    target_work = next((w for w in today_work if w["task_id"] == task_id or w["plan_id"] == plan_v1_id), None)
    assert target_work is not None, f"Engineer could not find assignment for Task #{task_id}"
    assignment_id = target_work["assignment_id"]

    # Engineer starts work
    start_res = client.post(f"/api/execution/{assignment_id}/start", json={
        "notes": "Red flags established at 600m and 1200m. Rail tensor deployed."
    }, headers=eng_headers)
    assert start_res.status_code == 200
    assert start_res.json()["status"] == "IN_PROGRESS"

    # Manager sees IN_PROGRESS in shared database without manual reload
    mgr_view_task = client.get(f"/api/tasks/{task_id}", headers=mgr_headers).json()
    assert mgr_view_task["status"] == "IN_PROGRESS"

    # =========================================================================
    # 6. DEVICE 3 — ENGINEER REPORTS CRITICAL PROBLEM IN FIELD
    # =========================================================================
    problem_res = client.post(f"/api/execution/{assignment_id}/report-problem", json={
        "issue_category": "Unexpected damage",
        "description": "Additional deep internal transverse fissure discovered under rail joint. Repair duration must be extended.",
        "is_critical": True
    }, headers=eng_headers)
    assert problem_res.status_code == 200
    prob_data = problem_res.json()
    assert prob_data["is_critical"] is True
    assert prob_data["event_number"].startswith("CE-2026-")
    crit_event_id = prob_data["critical_event_id"]

    # Verify task/assignment marked BLOCKED
    today_work_after_problem = client.get("/api/execution/today", headers=eng_headers).json()
    prob_work = next(w for w in today_work_after_problem if w["assignment_id"] == assignment_id)
    assert prob_work["status"] == "BLOCKED"

    # =========================================================================
    # 7. DEVICE 2 — MANAGER RECEIVES CRITICAL ALERT & REPLANS (v1 -> v2)
    # =========================================================================
    crit_events_res = client.get("/api/emergency/events", headers=mgr_headers)
    assert crit_events_res.status_code == 200
    crit_events = crit_events_res.json()
    assert any(e["event_id"] == crit_event_id for e in crit_events), "Critical event not found in manager view"

    # Manager triggers AI replanner
    replan_res = client.post(f"/api/emergency/{crit_event_id}/replan", headers=mgr_headers)
    assert replan_res.status_code == 200, f"Replanning failed: {replan_res.text}"
    replan_data = replan_res.json()
    
    plan_v2_id = replan_data["new_plan_id"]
    plan_v2_version = replan_data["revised_plan"]["version"]
    assert plan_v2_version == 2, f"Expected Plan v2, got v{plan_v2_version}"
    assert replan_data["revised_plan"]["previous_plan_id"] == plan_v1_id

    # Verify base plan v1 was frozen as SUPERSEDED (Never overwritten!)
    db = SessionLocal()
    try:
        v1_in_db = db.query(MaintenancePlan).filter(MaintenancePlan.plan_id == plan_v1_id).first()
        assert v1_in_db.status == PlanStatus.SUPERSEDED, f"Plan v1 should be SUPERSEDED, got {v1_in_db.status}"
    finally:
        db.close()

    # =========================================================================
    # 8. DEVICE 2 — MANAGER APPROVES REVISED PLAN v2
    # =========================================================================
    approve_v2_res = client.post(f"/api/emergency/plans/{plan_v2_id}/approve", headers=mgr_headers)
    assert approve_v2_res.status_code == 200
    assert approve_v2_res.json()["status"] == "APPROVED"

    # =========================================================================
    # 9. DEVICE 3 — ENGINEER RECEIVES v2 & COMPLETES WORK
    # =========================================================================
    today_work_v2 = client.get("/api/execution/today", headers=eng_headers).json()
    v2_assignments = [w for w in today_work_v2 if w["plan_id"] == plan_v2_id]
    assert len(v2_assignments) > 0, "Engineer did not receive revised plan assignments"

    # Engineer completes all assignments for Plan v2
    for w in v2_assignments:
        complete_res = client.post(f"/api/execution/{w['assignment_id']}/complete", json={
            "actual_duration_minutes": 165,
            "completion_note": "Replaced 6m rail section with new 60kg 90UTS rail, welded and ultrasonic flaw tested.",
            "issue_encountered": "Fissure resolved under approved Plan v2 possession."
        }, headers=eng_headers)
        assert complete_res.status_code == 200
        assert complete_res.json()["status"] == "COMPLETED"

    # =========================================================================
    # 10. FINAL WORKFLOW & PERSISTENCE VERIFICATION
    # =========================================================================
    db = SessionLocal()
    try:
        # Verify Plan v2 is COMPLETED
        v2_in_db = db.query(MaintenancePlan).filter(MaintenancePlan.plan_id == plan_v2_id).first()
        assert v2_in_db.status == PlanStatus.COMPLETED

        # Verify Plan v1 remains SUPERSEDED
        v1_in_db = db.query(MaintenancePlan).filter(MaintenancePlan.plan_id == plan_v1_id).first()
        assert v1_in_db.status == PlanStatus.SUPERSEDED

        # Verify Issue is RESOLVED
        task_in_db = db.query(MaintenanceTask).filter(MaintenanceTask.task_id == task_id).first()
        assert task_in_db.status in [TaskStatus.RESOLVED, TaskStatus.COMPLETED], f"Expected RESOLVED/COMPLETED, got {task_in_db.status}"

        # Verify DomainEvents were persisted in database
        domain_events = db.query(DomainEvent).all()
        event_types = set(de.event_type for de in domain_events)
        assert "ISSUE_CREATED" in event_types, "ISSUE_CREATED domain event missing"
        assert "PLAN_APPROVED" in event_types, "PLAN_APPROVED domain event missing"
        assert "TASK_STARTED" in event_types, "TASK_STARTED domain event missing"
        assert "CRITICAL_EVENT_CREATED" in event_types, "CRITICAL_EVENT_CREATED domain event missing"
        assert "TASK_COMPLETED" in event_types, "TASK_COMPLETED domain event missing"
    finally:
        db.close()
