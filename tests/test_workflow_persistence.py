import pytest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_database_health_endpoints():
    """Verify Section 3: Database health checks and connectivity diagnostics."""
    health_res = client.get("/api/health")
    assert health_res.status_code == 200
    h_data = health_res.json()
    assert h_data["status"] in ["ok", "healthy"]
    assert "database" in h_data
    assert h_data["database"]["connected"] is True
    assert h_data["database"]["type"] in ["sqlite", "postgresql"]
    assert "latency_ms" in h_data["database"]

    db_health_res = client.get("/api/health/database")
    assert db_health_res.status_code == 200
    dbh = db_health_res.json()
    assert dbh["connected"] is True
    assert dbh["type"] in ["sqlite", "postgresql"]
    assert dbh["latency_ms"] >= 0

def test_complete_persistent_workflow_lifecycle():
    """
    Validates the single persistent workflow across the database lifecycle:
    1. Maintenance Request created and persisted with canonical fields
    2. AI Plan generated and linked to MaintenanceRequest (plan_number, version=1)
    3. Manager approves plan; request transitions to SCHEDULED; PlanTask records assigned
    4. Inspector executes work; statuses propagate back to task and plan
    5. Critical Event reported and persisted (CriticalEvent entity)
    6. Automatic replan creates Plan v2 with previous_plan_id=v1, v1 marked SUPERSEDED
    7. Timeline returns real database tracks and minute spatial coordinates
    8. Trace and diagnostics return accurate persistent timestamps
    """
    # 1. Login as Engineer
    eng_res = client.post("/api/auth/login", json={
        "username": "engineer@railopt.demo",
        "password": "RailOpt@2026"
    })
    assert eng_res.status_code == 200
    eng_token = eng_res.json()["access_token"]
    eng_headers = {"Authorization": f"Bearer {eng_token}"}

    # 2. Report Maintenance Work (Request Creation)
    create_res = client.post("/api/tasks", json={
        "asset_id": 1,
        "department": "Engineering/Track",
        "task_type": "CORRECTIVE",
        "defect_type": "Rail joint misalignment",
        "description": "Severe joint misalignment on Section C2-02 Up Line",
        "severity": 9,
        "estimated_duration": 120,
        "required_block_type": "TRAFFIC_BLOCK",
        "safety_impact": 9,
        "overdue_days": 2
    }, headers=eng_headers)
    assert create_res.status_code == 200
    req = create_res.json()
    task_id = req["task_id"]
    assert req["status"] in ["NEW", "SUBMITTED"]
    assert "reference_no" in req
    assert req["reference_no"].startswith(("IR-2026-", "MR-2026-"))

    # Verify persistent retrieval
    get_req_res = client.get(f"/api/tasks/{task_id}")
    assert get_req_res.status_code == 200
    persisted_req = get_req_res.json()
    assert persisted_req["task_id"] == task_id
    assert persisted_req["description"] == "Severe joint misalignment on Section C2-02 Up Line"

    # 3. Generate AI Plan linked to Request
    gen_res = client.post("/api/planning/generate", json={
        "maintenance_request_id": task_id,
        "corridor_ids": [2],
        "departments": ["Engineering/Track"],
        "max_solve_time_seconds": 10
    }, headers=eng_headers)
    assert gen_res.status_code == 200
    plan = gen_res.json()
    plan_id = plan["plan_id"]
    assert plan["version"] == 1
    assert "plan_number" in plan
    assert plan["plan_number"].startswith("PLAN-2026-")
    assert plan["maintenance_request_id"] == task_id

    # Verify that request is linked to plan and status is updated
    updated_req_res = client.get(f"/api/tasks/{task_id}")
    assert updated_req_res.status_code == 200
    u_req = updated_req_res.json()
    assert u_req["current_plan_id"] == plan_id
    assert u_req["status"] == "PLAN_PENDING_REVIEW"
    assert u_req["current_plan"]["plan_id"] == plan_id

    # 4. Submit plan for review
    submit_res = client.post(f"/api/planning/{plan_id}/submit-review", headers=eng_headers)
    assert submit_res.status_code == 200

    # 5. Login as Manager and Approve Plan
    mgr_res = client.post("/api/auth/login", json={
        "username": "manager@railopt.demo",
        "password": "RailOpt@2026"
    })
    assert mgr_res.status_code == 200
    mgr_token = mgr_res.json()["access_token"]
    mgr_headers = {"Authorization": f"Bearer {mgr_token}"}

    appr_res = client.post(f"/api/planning/{plan_id}/approve", json={
        "comments": "Approved possession window for track maintenance"
    }, headers=mgr_headers)
    assert appr_res.status_code == 200
    approved_plan = appr_res.json()
    assert approved_plan["status"] == "APPROVED"

    # Verify request transitioned to SCHEDULED
    after_appr_req = client.get(f"/api/tasks/{task_id}").json()
    assert after_appr_req["status"] == "SCHEDULED"

    # 6. Login as Field Inspector and Execute Work
    ins_res = client.post("/api/auth/login", json={
        "username": "inspector@railopt.demo",
        "password": "RailOpt@2026"
    })
    assert ins_res.status_code == 200
    ins_token = ins_res.json()["access_token"]
    ins_headers = {"Authorization": f"Bearer {ins_token}"}

    today_res = client.get("/api/execution/today", headers=ins_headers)
    assert today_res.status_code == 200
    today_items = today_res.json()
    assert len(today_items) > 0

    # Find the execution item belonging to our plan
    matching_work = next((w for w in today_items if w["plan_id"] == plan_id), today_items[0])
    assignment_id = matching_work["assignment_id"]

    # Start work
    start_res = client.post(f"/api/execution/{assignment_id}/start", json={
        "notes": "Field crew arrived on site. Site safety perimeter established."
    }, headers=ins_headers)
    assert start_res.status_code == 200
    assert start_res.json()["status"] == "IN_PROGRESS"

    # Verify task is IN_PROGRESS
    in_prog_req = client.get(f"/api/tasks/{task_id}").json()
    assert in_prog_req["status"] == "IN_PROGRESS"

    # Complete work
    comp_res = client.post(f"/api/execution/{assignment_id}/complete", json={
        "actual_duration_minutes": 110,
        "completion_note": "Joint aligned and torqued to standard.",
        "issue_encountered": "None."
    }, headers=ins_headers)
    assert comp_res.status_code == 200
    assert comp_res.json()["status"] == "COMPLETED"

    # 7. Report Critical Event (Impact Assessment)
    emerg_res = client.post("/api/emergency/report", json={
        "corridor_id": 2,
        "section_code": "C2-02",
        "asset_name": "Signal S-104",
        "issue_description": "Signal aspect red-failure during train approach",
        "severity": "CRITICAL",
        "detected_time": "15:00",
        "auto_replan": False
    }, headers=mgr_headers)
    assert emerg_res.status_code == 200
    emerg_data = emerg_res.json()
    assert "event_id" in emerg_data
    event_id = emerg_data["event_id"]
    assert "impact" in emerg_data
    assert emerg_data["impact"]["affected_plans_count"] >= 1

    # Verify CriticalEvent entity is stored in database
    events_list_res = client.get("/api/emergency/events")
    assert events_list_res.status_code == 200
    all_events = events_list_res.json()
    assert any(e["event_id"] == event_id for e in all_events)

    # 8. Trigger Emergency Replanning Pipeline
    replan_res = client.post(f"/api/emergency/{event_id}/replan", headers=mgr_headers)
    assert replan_res.status_code == 200
    replan_data = replan_res.json()
    assert "new_plan_id" in replan_data
    assert "comparison" in replan_data
    new_plan_id = replan_data["new_plan_id"]

    # Verify Plan Versioning on Replanned Plan
    new_plan_res = client.get(f"/api/planning/{new_plan_id}")
    assert new_plan_res.status_code == 200
    v2_plan = new_plan_res.json()
    assert v2_plan["version"] == 2
    assert v2_plan["previous_plan_id"] is not None
    assert v2_plan["replan_reason"] is not None

    # Verify base plan status is SUPERSEDED
    base_plan_res = client.get(f"/api/planning/{v2_plan['previous_plan_id']}")
    assert base_plan_res.status_code == 200
    assert base_plan_res.json()["status"] == "SUPERSEDED"

    # 9. Verify Timeline Service returns 3 tracks and spatial calculations
    tl_res = client.get("/api/timeline?corridor_id=2")
    assert tl_res.status_code == 200
    tl_data = tl_res.json()
    assert "tracks" in tl_data
    assert "trains" in tl_data["tracks"]
    assert "maintenance" in tl_data["tracks"]
    assert "blocks" in tl_data["tracks"]
    assert len(tl_data["tracks"]["trains"]) > 0
    assert "metrics" in tl_data

    # Check minute spatial calculations
    first_train = tl_data["tracks"]["trains"][0]
    assert "start_minute" in first_train
    assert "duration_minutes" in first_train
    assert first_train["duration_minutes"] > 0

    # 10. Verify Diagnostics & Trace
    diag_res = client.get("/api/admin/diagnostics", headers=mgr_headers)
    assert diag_res.status_code == 200
    diag = diag_res.json()
    assert diag["database"]["connected"] is True
    assert diag["counts"]["maintenance_requests"] > 0
    assert diag["counts"]["plans"] > 0
    assert diag["counts"]["critical_events"] > 0

    trace_res = client.get(f"/api/admin/trace/{task_id}")
    assert trace_res.status_code == 200
    trace = trace_res.json()
    assert "trace" in trace
    assert len(trace["trace"]) >= 2
    assert all("timestamp" in step for step in trace["trace"])
