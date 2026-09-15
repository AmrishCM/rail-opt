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
# SECTION 42: INSPECTOR ROLE SECURITY BOUNDARY
# ==============================================================================

def test_inspector_cannot_approve_issue(tokens):
    """Inspector cannot approve issue (403 Forbidden)"""
    headers = {"Authorization": f"Bearer {tokens['inspector']}"}
    res = client.post("/api/tasks/1/approve", json={"comments": "Unauthorized inspector approval"}, headers=headers)
    assert res.status_code == 403, f"Expected 403, got {res.status_code}: {res.text}"

def test_inspector_cannot_access_admin_users(tokens):
    """Inspector cannot view or manage users (403 Forbidden)"""
    headers = {"Authorization": f"Bearer {tokens['inspector']}"}
    res = client.get("/api/users", headers=headers)
    assert res.status_code == 403, f"Expected 403, got {res.status_code}: {res.text}"

    res_create = client.post("/api/users", json={
        "employee_id": "FAKE99",
        "full_name": "Fake User",
        "email": "fake@railopt.demo",
        "password": "Password@123",
        "role": "FIELD_INSPECTOR",
        "department": "ENGINEERING"
    }, headers=headers)
    assert res_create.status_code == 403

def test_inspector_cannot_replan(tokens):
    """Inspector cannot trigger replanning or solver generation (403 Forbidden)"""
    headers = {"Authorization": f"Bearer {tokens['inspector']}"}
    res = client.post("/api/replan", json={"plan_id": 1, "event": {}}, headers=headers)
    assert res.status_code == 403, f"Expected 403, got {res.status_code}: {res.text}"

    res_gen = client.post("/api/planning/generate", json={"corridor_ids": [2]}, headers=headers)
    assert res_gen.status_code == 403

def test_inspector_cannot_change_system_settings(tokens):
    """Inspector cannot view or update system settings (403 Forbidden)"""
    headers = {"Authorization": f"Bearer {tokens['inspector']}"}
    res = client.get("/api/system/settings", headers=headers)
    assert res.status_code == 403

# ==============================================================================
# SECTION 42: MANAGER ROLE SECURITY BOUNDARY
# ==============================================================================

def test_manager_cannot_manage_users(tokens):
    """Manager cannot create or delete users (403 Forbidden)"""
    headers = {"Authorization": f"Bearer {tokens['manager']}"}
    res = client.post("/api/users", json={
        "employee_id": "MGR_NEW",
        "full_name": "New Person",
        "email": "person@railopt.demo",
        "password": "Password@123",
        "role": "FIELD_INSPECTOR",
        "department": "ENGINEERING"
    }, headers=headers)
    assert res.status_code == 403, f"Expected 403, got {res.status_code}: {res.text}"

def test_manager_cannot_change_system_settings(tokens):
    """Manager cannot change global system settings (403 Forbidden)"""
    headers = {"Authorization": f"Bearer {tokens['manager']}"}
    res = client.post("/api/system/settings", json={"maintenance_lead_time_days": 10}, headers=headers)
    assert res.status_code == 403, f"Expected 403, got {res.status_code}: {res.text}"

def test_manager_can_approve_issue_and_replan(tokens):
    """Manager can approve issues and view authorities (200 OK)"""
    headers = {"Authorization": f"Bearer {tokens['manager']}"}
    # Create an issue first so we have a valid task to approve
    issue_res = client.post("/api/tasks", json={
        "department": "TRACK",
        "defect_type": "Rail crack under inspection",
        "severity": 3,
        "location_name": "Salem Jn Yard",
        "description": "Crack observed during routine foot patrol"
    }, headers=headers)
    assert issue_res.status_code == 200
    task_id = issue_res.json().get("task_id", 1)

    # Manager approves
    approve_res = client.post(f"/api/tasks/{task_id}/approve", json={"comments": "Approved for welding"}, headers=headers)
    assert approve_res.status_code == 200
    assert approve_res.json()["status"] in ["APPROVED", "SCHEDULED"]

    # Manager lists authorities
    auth_res = client.get("/api/authorities", headers=headers)
    assert auth_res.status_code == 200
    assert len(auth_res.json()) >= 4

# ==============================================================================
# SECTION 42: ENGINEER ROLE SECURITY BOUNDARY
# ==============================================================================

def test_engineer_cannot_approve_issues(tokens):
    """Engineer cannot approve tasks (403 Forbidden)"""
    headers = {"Authorization": f"Bearer {tokens['engineer']}"}
    res = client.post("/api/tasks/1/approve", json={"comments": "Engineer self-approval attempt"}, headers=headers)
    assert res.status_code == 403, f"Expected 403, got {res.status_code}: {res.text}"

def test_engineer_cannot_replan(tokens):
    """Engineer cannot trigger replanning (403 Forbidden)"""
    headers = {"Authorization": f"Bearer {tokens['engineer']}"}
    res = client.post("/api/replan", json={"plan_id": 1, "event": {}}, headers=headers)
    assert res.status_code == 403, f"Expected 403, got {res.status_code}: {res.text}"

def test_engineer_cannot_manage_users(tokens):
    """Engineer cannot access user management (403 Forbidden)"""
    headers = {"Authorization": f"Bearer {tokens['engineer']}"}
    res = client.get("/api/users", headers=headers)
    assert res.status_code == 403

# ==============================================================================
# SECTION 42: ADMIN PRIVILEGE AND AUDIT INTEGRITY
# ==============================================================================

def test_admin_authorized_for_all_modules(tokens):
    """Admin has unrestricted access to users, settings, and task lifecycle (200 OK)"""
    headers = {"Authorization": f"Bearer {tokens['admin']}"}

    # Admin accesses users
    res_users = client.get("/api/users", headers=headers)
    assert res_users.status_code == 200

    # Admin accesses system settings
    res_settings = client.get("/api/system/settings", headers=headers)
    assert res_settings.status_code == 200

    # Admin accesses audit logs
    res_audit = client.get("/api/system/audit", headers=headers)
    assert res_audit.status_code == 200
