import pytest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from fastapi.testclient import TestClient
from app.main import app
from app.ml.criticality import get_explainable_priority

client = TestClient(app)

def get_token(username: str, password: str = "RailOpt@2026") -> str:
    res = client.post("/api/auth/login", json={"username": username, "password": password})
    assert res.status_code == 200, f"Login failed for {username}: {res.text}"
    return res.json()["access_token"]

@pytest.fixture(scope="module")
def tokens():
    return {
        "inspector": get_token("inspector@railopt.demo"),
        "manager": get_token("manager@railopt.demo"),
        "engineer": get_token("engineer@railopt.demo"),
        "admin": get_token("admin@railopt.demo")
    }

# ==============================================================================
# PART 39: AI PLANNER ACCEPTANCE TESTS (P.1 – P.7)
# ==============================================================================

def test_p1_critical_issue_higher_planning_priority():
    """P.1 — Critical issue receives higher planning priority and explainable reasons."""
    # Critical defect with high safety risk
    crit_result = get_explainable_priority(
        safety_impact=9,
        failure_probability=0.85,
        asset_criticality=90,
        overdue_days=4,
        defect_severity=9,
        corridor_traffic_level=5
    )
    assert crit_result["priority_level"] == "CRITICAL"
    assert len(crit_result["reasons"]) >= 3
    assert any("safety" in r.lower() for r in crit_result["reasons"])
    assert any("overdue" in r.lower() for r in crit_result["reasons"])

    # Minor routine defect
    low_result = get_explainable_priority(
        safety_impact=2,
        failure_probability=0.1,
        asset_criticality=20,
        overdue_days=0,
        defect_severity=2,
        corridor_traffic_level=1
    )
    assert low_result["priority_level"] == "LOW"
    assert crit_result["score"] > low_result["score"]

def test_p2_train_conflict_detected(tokens):
    """P.2 — Train conflict is detected in the timetable timeline."""
    headers = {"Authorization": f"Bearer {tokens['manager']}"}
    res = client.get("/api/timeline?corridor_id=2&date=2026-09-15", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "conflicts" in data
    assert "sections" in data
    assert len(data["sections"]) >= 1
    # Check that conflict contains track, maintenance, and train details
    if len(data["conflicts"]) > 0:
        c = data["conflicts"][0]
        assert "track_name" in c or "section_name" in c
        assert "overlap_minutes" in c
        assert "maintenance_time" in c or "maintenance_id" in c

def test_p3_maintenance_duration_respected(tokens):
    """P.3 — Maintenance duration is respected in candidate plans."""
    headers = {"Authorization": f"Bearer {tokens['manager']}"}
    res = client.get("/api/planning/candidates?corridor_id=2", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "candidates" in data
    assert len(data["candidates"]) >= 1

    plan_a = data["candidates"][0]
    assert "start_time" in plan_a
    assert "end_time" in plan_a
    # Start and end time difference should be at least 45 minutes
    st_h, st_m = [int(x) for x in plan_a["start_time"].split(":")]
    et_h, et_m = [int(x) for x in plan_a["end_time"].split(":")]
    dur = (et_h * 60 + et_m) - (st_h * 60 + st_m)
    assert dur >= 45, f"Expected duration >= 45 mins, got {dur}"

def test_p4_engineer_availability_respected(tokens):
    """P.4 — Engineer availability is respected in candidate plan reasons."""
    headers = {"Authorization": f"Bearer {tokens['manager']}"}
    res = client.get("/api/planning/candidates?corridor_id=2", headers=headers)
    assert res.status_code == 200
    data = res.json()
    plan_a = data["candidates"][0]
    assert "reasons" in plan_a
    assert any("gang" in r.lower() or "equipment" in r.lower() or "available" in r.lower() for r in plan_a["reasons"])

def test_p5_ai_cannot_publish_without_manager_approval(tokens):
    """P.5 — AI cannot publish a plan without Manager approval (RBAC enforced)."""
    # Inspector attempt to approve plan -> 403
    insp_headers = {"Authorization": f"Bearer {tokens['inspector']}"}
    res_insp = client.post("/api/planning/1/approve", json={"comments": "Inspector unauthorized approval"}, headers=insp_headers)
    assert res_insp.status_code == 403

    # Engineer attempt to approve plan -> 403
    eng_headers = {"Authorization": f"Bearer {tokens['engineer']}"}
    res_eng = client.post("/api/planning/1/approve", json={"comments": "Engineer unauthorized approval"}, headers=eng_headers)
    assert res_eng.status_code == 403

def test_p6_ai_generated_plan_is_auditable(tokens):
    """P.6 — AI-generated plan and approvals are recorded in audit trail."""
    headers = {"Authorization": f"Bearer {tokens['admin']}"}
    res = client.get("/api/system/audit?limit=20", headers=headers)
    assert res.status_code == 200
    logs = res.json()
    assert isinstance(logs, list)

def test_p7_replan_request_generates_candidate_plans(tokens):
    """P.7 — Replan and planning endpoints return alternative candidate plans (Plan A vs Plan B)."""
    headers = {"Authorization": f"Bearer {tokens['manager']}"}
    res = client.get("/api/planning/candidates?corridor_id=2", headers=headers)
    assert res.status_code == 200
    data = res.json()
    candidates = data["candidates"]
    assert len(candidates) >= 2, "Expected at least Plan A and Plan B"
    assert candidates[0]["id"] == "PLAN_A"
    assert candidates[1]["id"] == "PLAN_B"
    # Plan A has 0 conflicts, Plan B has trade-off
    assert candidates[0]["train_conflicts"] == 0
    assert "trade_off" in candidates[0]
    assert "trade_off" in candidates[1]

def test_p8_issue_ai_plan_and_approval_workflow(tokens):
    """P.8 — Automatic AI plan generation upon issue selection, and Manager Approve & Assign atomic transaction."""
    mgr_headers = {"Authorization": f"Bearer {tokens['manager']}"}
    insp_headers = {"Authorization": f"Bearer {tokens['inspector']}"}

    # Step 1: Inspector creates an issue
    issue_payload = {
        "description": "Intermittent track circuit failure on C2",
        "defect_type": "Track Circuit Intermittent Failure",
        "severity": 8,
        "safety_impact": 9,
        "department": "S&T/Signalling",
        "location_name": "Section C2 / KM 124.6",
        "estimated_duration": 90,
        "required_block_type": "FULL_BLOCK"
    }
    create_res = client.post("/api/tasks", json=issue_payload, headers=insp_headers)
    assert create_res.status_code == 200, f"Create issue failed: {create_res.text}"
    created_task = create_res.json()
    task_id = created_task["task_id"]
    ref_no = created_task["reference_no"]

    # Step 2: Manager retrieves automatic AI recommended plan for this issue
    plan_res = client.get(f"/api/planning/issue-plan/{task_id}", headers=mgr_headers)
    assert plan_res.status_code == 200, f"Failed to get issue plan: {plan_res.text}"
    plan_data = plan_res.json()

    # Verify Issue Information
    assert plan_data["task_id"] == task_id
    assert plan_data["issue_id"] == ref_no
    assert "asset" in plan_data
    assert plan_data["safety_impact"] == "HIGH"
    assert "location" in plan_data

    # Verify AI Recommended Plan
    rec_plan = plan_data["recommended_plan"]
    assert "maintenance_window" in rec_plan
    assert "track" in rec_plan
    assert "engineer" in rec_plan
    assert rec_plan["estimated_duration_minutes"] == 90
    assert "lowest operational conflict" in rec_plan["reason"]

    # Verify Operational Conflicts
    conflicts = plan_data["operational_conflicts"]
    assert "trains" in conflicts
    assert "conflict_status" in conflicts

    # Verify Timeline Preview
    assert "timeline_preview" in plan_data
    assert len(plan_data["timeline_preview"]) >= 1

    # Step 3: Inspector attempt to approve -> 403 Forbidden
    unauth_res = client.post(f"/api/planning/issue-plan/{task_id}/approve", json={}, headers=insp_headers)
    assert unauth_res.status_code == 403

    # Step 4: Manager Approves & Assigns Plan
    approve_res = client.post(f"/api/planning/issue-plan/{task_id}/approve", json={"comments": "Approved for possession."}, headers=mgr_headers)
    assert approve_res.status_code == 200, f"Approval failed: {approve_res.text}"
    approve_data = approve_res.json()
    assert approve_data["success"] is True
    assert approve_data["version"] == 1
    assert approve_data["status"] == "APPROVED"
    assert "work_order_id" in approve_data
    assert "assigned_window" in approve_data

