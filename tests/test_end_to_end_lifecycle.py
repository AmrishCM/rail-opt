import pytest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from fastapi.testclient import TestClient
from app.main import app

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

def test_complete_end_to_end_acceptance_scenario(tokens):
    """
    Section 38: Canonical End-to-End Acceptance Test
    Executes Steps 1 to 13 with single issue ID preservation and plan versioning.
    """
    insp_headers = {"Authorization": f"Bearer {tokens['inspector']}"}
    mgr_headers = {"Authorization": f"Bearer {tokens['manager']}"}
    eng_headers = {"Authorization": f"Bearer {tokens['engineer']}"}

    # =========================================================================
    # Step 1: Inspector creates Issue
    # =========================================================================
    issue_payload = {
        "description": "Track circuit intermittently failing",
        "defect_type": "Track Circuit Failure",
        "severity": 8,
        "safety_impact": 9,
        "department": "S&T/Signalling",
        "location_name": "Section C2 / KM 124.6",
        "estimated_duration": 90,
        "required_block_type": "FULL_BLOCK"
    }
    create_res = client.post("/api/tasks", json=issue_payload, headers=insp_headers)
    assert create_res.status_code == 200, f"Step 1 Failed: {create_res.text}"
    created_task = create_res.json()
    task_id = created_task["task_id"]
    issue_id = created_task["reference_no"]
    assert issue_id, "Issue ID must be present"

    # =========================================================================
    # Step 2 & 3: Manager opens Approval & Planning, AI generates candidate plan
    # =========================================================================
    plan_res = client.get(f"/api/planning/issue-plan/{task_id}", headers=mgr_headers)
    assert plan_res.status_code == 200, f"Step 2/3 Failed: {plan_res.text}"
    plan_data = plan_res.json()
    assert plan_data["task_id"] == task_id
    assert plan_data["issue_id"] == issue_id
    assert "Section C2" in plan_data["location"]

    # Recommended window & reason
    rec = plan_data["recommended_plan"]
    assert rec["track"] in ["C1", "C2", "C3"]
    assert rec["estimated_duration_minutes"] == 90
    assert "lowest operational conflict" in rec["reason"]
    assert "timeline_preview" in plan_data

    # =========================================================================
    # Step 4: Manager Approves & Assigns -> Creates Plan v1, Work Order, Block
    # =========================================================================
    approve_res = client.post(
        f"/api/planning/issue-plan/{task_id}/approve",
        json={"comments": "Approved for possession under Section 38 protocol."},
        headers=mgr_headers
    )
    assert approve_res.status_code == 200, f"Step 4 Failed: {approve_res.text}"
    approve_data = approve_res.json()
    assert approve_data["success"] is True
    assert approve_data["version"] == 1
    assert approve_data["status"] == "APPROVED"
    assert "work_order_id" in approve_data
    wo_id = approve_data["work_order_id"]

    # =========================================================================
    # Step 5: Engineer sees assigned work in Pending Work
    # =========================================================================
    today_res = client.get("/api/execution/today", headers=eng_headers)
    assert today_res.status_code == 200, f"Step 5 Failed: {today_res.text}"
    today_items = today_res.json()
    matching_work = [w for w in today_items if w["task_id"] == task_id or w.get("reference_no") == issue_id]
    assert len(matching_work) >= 1, "Approved work order must appear in engineer work queue"
    assignment_id = matching_work[0]["assignment_id"]
    assert assignment_id is not None

    # =========================================================================
    # Step 6: Engineer starts work -> Status: IN_PROGRESS
    # =========================================================================
    start_res = client.post(f"/api/execution/{assignment_id}/start", json={"notes": "Possession taken."}, headers=eng_headers)
    assert start_res.status_code == 200, f"Step 6 Failed: {start_res.text}"
    start_data = start_res.json()
    assert start_data["status"] == "IN_PROGRESS"

    # =========================================================================
    # Step 7: Engineer discovers additional damage -> clicks REPORT WORK ISSUE
    # Same Issue ID, Work Order ID, and Plan v1 are automatically linked
    # =========================================================================
    report_res = client.post(
        f"/api/execution/{assignment_id}/report-problem",
        json={
            "issue_category": "Additional Repair Required",
            "description": "Severe thermal stress cracks detected on adjacent joint.",
            "is_critical": True,
            "additional_duration_minutes": 45,
            "current_location": "Section C2 / KM 124.6"
        },
        headers=eng_headers
    )
    assert report_res.status_code == 200, f"Step 7 Failed: {report_res.text}"
    report_data = report_res.json()
    exec_issue_id = report_data.get("issue_id") or report_data.get("execution_issue_id")
    assert exec_issue_id is not None
    assert report_data["replan_required"] is True

    # =========================================================================
    # Step 8: Manager receives replan request -> AI generates Plan v2
    # =========================================================================
    delay_requests_res = client.get("/api/execution/delay-requests", headers=mgr_headers)
    assert delay_requests_res.status_code == 200, f"Step 8 Failed: {delay_requests_res.text}"
    delay_requests = delay_requests_res.json()
    req_match = [r for r in delay_requests if r["task_id"] == task_id]
    assert len(req_match) >= 1, "Delay request must appear in Manager replanning queue"
    assert req_match[0]["additional_duration_minutes"] == 45
    assert req_match[0]["task_ref"] == issue_id

    # =========================================================================
    # Step 9: Manager approves Plan v2
    # =========================================================================
    replan_approve_res = client.post(
        f"/api/planning/replan-delay/{exec_issue_id}/approve",
        headers=mgr_headers
    )
    assert replan_approve_res.status_code == 200, f"Step 9 Failed: {replan_approve_res.text}"
    replan_data = replan_approve_res.json()
    assert replan_data["status"] in ["APPROVED", "REPLAN_APPROVED"]
    assert replan_data["version"] >= 2
    assert replan_data["task_id"] == task_id

    # =========================================================================
    # Step 10: Engineer receives notification and updated plan
    # =========================================================================
    notif_res = client.get("/api/notifications", headers=eng_headers)
    assert notif_res.status_code == 200, f"Step 10 Failed: {notif_res.text}"
    notifs = notif_res.json()
    assert len(notifs) >= 1

    # =========================================================================
    # Step 11 & 12: Engineer completes work
    # =========================================================================
    complete_res = client.post(
        f"/api/execution/{assignment_id}/complete",
        json={
            "actual_duration_minutes": 135,
            "completion_note": "Joint ground, welded and ultrasonically tested.",
            "issue_encountered": "Thermal stress repaired."
        },
        headers=eng_headers
    )
    assert complete_res.status_code == 200, f"Step 12 Failed: {complete_res.text}"
    assert complete_res.json()["status"] == "COMPLETED"

    # =========================================================================
    # Step 13: Issue proceeds to RESOLVED / Traceable by original Issue ID
    # =========================================================================
    final_task_res = client.get(f"/api/tasks/{task_id}", headers=mgr_headers)
    assert final_task_res.status_code == 200, f"Step 13 Failed: {final_task_res.text}"
    final_task = final_task_res.json()
    assert final_task["reference_no"] == issue_id, "Original issue reference number must be strictly preserved"
    assert final_task["status"] in ["RESOLVED", "COMPLETED"]
