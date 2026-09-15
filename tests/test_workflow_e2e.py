import pytest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_complete_railway_workflow_e2e():
    """
    Validates the exact 10-step user story specified in Sections 63 & 78:
    1. Engineer logs in
    2. Engineer reports maintenance defect
    3. AI priority check provides plain-language reasons
    4. Generate recommended AI plan (CP-SAT solver)
    5. Engineer submits plan for manager approval
    6. Manager logs in, reviews and approves plan
    7. Field Inspector logs in, views today's work, starts work
    8. Inspector completes work with notes and actual duration
    9. Manager logs in, reports critical defect event
    10. Automatic replanner creates revised plan with comparison
    """
    # 1. Login as Engineer
    eng_res = client.post("/api/auth/login", json={
        "username": "engineer@railopt.demo",
        "password": "RailOpt@2026"
    })
    assert eng_res.status_code == 200
    eng_token = eng_res.json()["access_token"]
    eng_headers = {"Authorization": f"Bearer {eng_token}"}

    # 2. Report Maintenance Work
    create_res = client.post("/api/tasks", json={
        "asset_id": 1,  # Track T-104 on Section C2-02
        "department": "Engineering/Track",
        "task_type": "CORRECTIVE",
        "defect_type": "Rail crack detected",
        "description": "Rail crack detected on Up Line weld joint",
        "severity": 10,
        "estimated_duration": 120,
        "required_block_type": "TRAFFIC_BLOCK",
        "safety_impact": 10,
        "overdue_days": 3
    }, headers=eng_headers)
    assert create_res.status_code == 200
    task = create_res.json()
    task_id = task["task_id"]
    assert "reference_no" in task

    # 3. Check AI Priority (Plain language, NO ML jargon)
    prio_res = client.get(f"/api/tasks/{task_id}/priority")
    assert prio_res.status_code == 200
    prio = prio_res.json()
    assert prio["score"] >= 80
    assert prio["level"] in ["Critical", "High"]
    assert len(prio["reasons"]) > 0
    assert any("Safety" in r for r in prio["reasons"])

    # 4. Generate Recommended AI Plan
    gen_res = client.post("/api/planning/generate", json={
        "corridor_ids": [2],
        "departments": ["Engineering/Track", "S&T/Signalling", "Traction Distribution"],
        "max_solve_time_seconds": 10
    }, headers=eng_headers)
    assert gen_res.status_code == 200
    plan = gen_res.json()
    plan_id = plan["plan_id"]
    assert plan["status"] == "AI_RECOMMENDED"
    assert len(plan["assignments"]) > 0
    assert "smart_combination" in plan
    assert plan["smart_combination"]["is_coordinated"] is True

    # 5. Engineer Submits Plan for Approval
    submit_res = client.post(f"/api/planning/{plan_id}/submit-review", headers=eng_headers)
    assert submit_res.status_code == 200
    assert submit_res.json()["status"] == "MANAGER_APPROVAL"

    # 6. Login as Manager & Approve Plan
    mgr_res = client.post("/api/auth/login", json={
        "username": "manager@railopt.demo",
        "password": "RailOpt@2026"
    })
    assert mgr_res.status_code == 200
    mgr_token = mgr_res.json()["access_token"]
    mgr_headers = {"Authorization": f"Bearer {mgr_token}"}

    appr_res = client.post(f"/api/planning/{plan_id}/approve", json={
        "comments": "Approved for possession 14:00-16:30 today."
    }, headers=mgr_headers)
    assert appr_res.status_code == 200
    assert appr_res.json()["status"] == "APPROVED"

    # 7. Login as Field Inspector & View Today's Work
    ins_res = client.post("/api/auth/login", json={
        "username": "inspector@railopt.demo",
        "password": "RailOpt@2026"
    })
    assert ins_res.status_code == 200
    ins_token = ins_res.json()["access_token"]
    ins_headers = {"Authorization": f"Bearer {ins_token}"}

    today_res = client.get("/api/execution/today", headers=ins_headers)
    assert today_res.status_code == 200
    work_items = today_res.json()
    assert len(work_items) > 0
    assignment_id = work_items[0]["assignment_id"]

    # Start Work
    start_res = client.post(f"/api/execution/{assignment_id}/start", json={
        "notes": "Safety flags established. Commencing track cutting."
    }, headers=ins_headers)
    assert start_res.status_code == 200
    assert start_res.json()["status"] == "IN_PROGRESS"

    # 8. Complete Work
    comp_res = client.post(f"/api/execution/{assignment_id}/complete", json={
        "actual_duration_minutes": 115,
        "completion_note": "Rail replaced and thermit welded. Track clearance confirmed with 130 km/h speed test.",
        "issue_encountered": "None."
    }, headers=ins_headers)
    assert comp_res.status_code == 200
    assert comp_res.json()["status"] == "COMPLETED"

    # 9. Manager Reports Critical Defect (Emergency Event)
    emerg_res = client.post("/api/emergency/report", json={
        "section_code": "C2-02",
        "asset_name": "Signal S-104",
        "issue_description": "Emergency Signal Failure / Lamp current drop",
        "severity": "CRITICAL",
        "detected_time": "14:20"
    }, headers=mgr_headers)
    assert emerg_res.status_code == 200
    emerg_data = emerg_res.json()
    assert "new_plan_id" in emerg_data
    assert emerg_data["change_summary"]["tasks_moved"] > 0
    assert "comparison" in emerg_data
    assert "original_plan" in emerg_data["comparison"]
    assert "revised_plan" in emerg_data["comparison"]
