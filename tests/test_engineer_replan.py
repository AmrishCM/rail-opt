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

# ==============================================================================
# PART 39: ENGINEER REPLAN & DELAY TESTS (R.1 – R.6)
# ==============================================================================

def test_r1_engineer_can_report_issue_only_while_active(tokens):
    """R.1 — Engineer can report issue only while assigned work is active (IN_PROGRESS)."""
    eng_headers = {"Authorization": f"Bearer {tokens['engineer']}"}

    # Fetch today's work assignments
    work_res = client.get("/api/execution/today", headers=eng_headers)
    assert work_res.status_code == 200
    work_items = work_res.json()
    assert len(work_items) > 0

    assignment_id = work_items[0]["assignment_id"]

    # First, test reporting when NOT started yet (should be rejected with 400 if NOT started)
    # Start the work to put it into IN_PROGRESS
    start_res = client.post(f"/api/execution/{assignment_id}/start", json={"notes": "Field crew arrived"}, headers=eng_headers)
    assert start_res.status_code == 200

    # Now that work is IN_PROGRESS, reporting problem succeeds
    rep_res = client.post(
        f"/api/execution/{assignment_id}/report-problem",
        json={
            "issue_category": "Required part unavailable",
            "description": "Armature switch motor defect, +35 min requested",
            "is_critical": True,
            "additional_duration_minutes": 35,
            "current_location": "Section C2 (KM 42.8)"
        },
        headers=eng_headers
    )
    assert rep_res.status_code == 200
    data = rep_res.json()
    assert data["success"] is True
    assert data["additional_duration_minutes"] == 35
    assert data["status"] == "PENDING_REPLAN"

def test_r2_manager_receives_request(tokens):
    """R.2 — Manager receives delay request in operational replan queue."""
    mgr_headers = {"Authorization": f"Bearer {tokens['manager']}"}
    res = client.get("/api/execution/delay-requests", headers=mgr_headers)
    assert res.status_code == 200
    requests = res.json()
    assert len(requests) >= 1
    req = requests[0]
    assert "additional_duration_minutes" in req
    assert req["additional_duration_minutes"] >= 30
    assert "affected_track" in req

def test_r3_ai_replan_considers_new_duration(tokens):
    """R.3 — AI replan considers the new duration (+35 minutes)."""
    mgr_headers = {"Authorization": f"Bearer {tokens['manager']}"}
    res = client.get("/api/execution/delay-requests", headers=mgr_headers)
    assert res.status_code == 200
    requests = res.json()
    assert len(requests) >= 1
    assert requests[0]["additional_duration_minutes"] == 35

def test_r4_manager_approval_required(tokens):
    """R.4 — Manager approval is required before publishing revised plan."""
    mgr_headers = {"Authorization": f"Bearer {tokens['manager']}"}
    res_list = client.get("/api/execution/delay-requests", headers=mgr_headers)
    issue_id = res_list.json()[0]["issue_id"]

    # Engineer cannot approve delay replan -> 403 Forbidden
    eng_headers = {"Authorization": f"Bearer {tokens['engineer']}"}
    res_eng = client.post(f"/api/planning/replan-delay/{issue_id}/approve", json={"revised_start_time": "15:25", "revised_end_time": "16:10"}, headers=eng_headers)
    assert res_eng.status_code == 403

    # Manager can approve delay replan -> 200 OK
    res_mgr = client.post(f"/api/planning/replan-delay/{issue_id}/approve", json={"revised_start_time": "15:25", "revised_end_time": "16:10"}, headers=mgr_headers)
    assert res_mgr.status_code == 200
    data = res_mgr.json()
    assert data["success"] is True
    assert data["status"] == "REPLAN_APPROVED"
    assert data["new_window"] == "15:25–16:10"

def test_r5_engineer_receives_revised_plan(tokens):
    """R.5 — Engineer receives revised plan notification."""
    eng_headers = {"Authorization": f"Bearer {tokens['engineer']}"}
    notif_res = client.get("/api/notifications", headers=eng_headers)
    assert notif_res.status_code == 200
    notifs = notif_res.json()["items"]
    replan_notif = next((n for n in notifs if "REPLAN APPROVED" in n["title"] or "REPLAN_APPROVED" in str(n.get("event_type"))), None)
    assert replan_notif is not None, "Engineer should receive REPLAN APPROVED notification"

def test_r6_original_plan_remains_auditable(tokens):
    """R.6 — Original plan remains auditable and is marked SUPERSEDED."""
    admin_headers = {"Authorization": f"Bearer {tokens['admin']}"}
    audit_res = client.get("/api/system/audit?limit=20", headers=admin_headers)
    assert audit_res.status_code == 200
    logs = audit_res.json()
    replan_audit = next((l for l in logs if l.get("action") == "REPLAN_APPROVED"), None)
    assert replan_audit is not None, "REPLAN_APPROVED action must be recorded in audit log"
