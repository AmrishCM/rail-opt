import pytest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def get_token_for(username: str) -> str:
    res = client.post("/api/auth/login", json={
        "username": username,
        "password": "RailOpt@2026"
    })
    assert res.status_code == 200, f"Login failed for {username}: {res.text}"
    return res.json()["access_token"]

def test_critical_security_acceptance_engineer_cannot_approve():
    """
    Section 51 Acceptance Test 1:
    POST /api/plans/{id}/approve
    Authorization: Bearer <engineer-token>
    Expected: 403 Forbidden
    """
    token = get_token_for("engineer@railopt.demo")

    # Direct call to /api/plans/{id}/approve
    res = client.post(
        "/api/plans/101/approve",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 403, f"Expected 403 Forbidden, got {res.status_code}: {res.text}"
    assert "Access denied" in res.json()["detail"]

def test_critical_security_acceptance_engineer_cannot_access_users():
    """
    Section 51 Acceptance Test 2:
    GET /api/users
    Authorization: Bearer <engineer-token>
    Expected: 403 Forbidden
    """
    token = get_token_for("engineer@railopt.demo")

    res = client.get(
        "/api/users",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 403, f"Expected 403 Forbidden, got {res.status_code}: {res.text}"
    assert "Access denied" in res.json()["detail"]

def test_critical_security_acceptance_viewer_cannot_update_settings():
    """
    Section 51 Acceptance Test 3:
    POST /api/system/settings
    Authorization: Bearer <viewer-token>
    Expected: 403 Forbidden
    """
    token = get_token_for("viewer@railopt.demo")

    res = client.post(
        "/api/system/settings",
        json={"solver_timeout_seconds": 30},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 403, f"Expected 403 Forbidden, got {res.status_code}: {res.text}"
    assert "Access denied" in res.json()["detail"]

def test_manager_can_approve_plan():
    """
    Manager has planning:approve permission and can approve plans.
    """
    token = get_token_for("manager@railopt.demo")

    res = client.post(
        "/api/plans/101/approve",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    assert res.json()["status"] == "APPROVED"

def test_admin_can_manage_users_and_settings():
    """
    System Administrator has full access to users and system settings.
    """
    token = get_token_for("admin@railopt.demo")

    # 1. Admin can list users
    res_list = client.get("/api/users", headers={"Authorization": f"Bearer {token}"})
    assert res_list.status_code == 200
    users = res_list.json()
    assert len(users) >= 8

    # 2. Admin can create a new user (Section 46 Acceptance Test)
    import uuid
    uid = uuid.uuid4().hex[:6]
    new_emp_id = f"EMP-TEST-{uid}"
    res_create = client.post(
        "/api/users",
        json={
            "employee_id": new_emp_id,
            "full_name": f"Test Engineer {uid}",
            "email": f"test_{uid}@railopt.demo",
            "password": "RailOpt@2026",
            "role": "MAINTENANCE_ENGINEER",
            "department": "Engineering/Track",
            "section_code": "C2"
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res_create.status_code in [200, 201]
    assert res_create.json()["employee_id"] == new_emp_id

    # 3. Admin can update system settings
    res_set = client.post(
        "/api/system/settings",
        json={"solver_timeout_seconds": 20},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res_set.status_code == 200
    assert res_set.json()["status"] == "SUCCESS"

def test_auth_refresh_token_and_logout_flow():
    """
    Tests JWT access token, refresh token issuance, token refresh, and logout revocation.
    """
    # 1. Login
    login_res = client.post("/api/auth/login", json={
        "username": "engineer@railopt.demo",
        "password": "RailOpt@2026"
    })
    assert login_res.status_code == 200
    login_data = login_res.json()
    access_token = login_data["access_token"]
    refresh_token = login_data["refresh_token"]
    assert access_token
    assert refresh_token

    # 2. Get me with access token
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {access_token}"})
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "engineer@railopt.demo"
    assert me_res.json()["last_login"] is not None

    # 3. Refresh token
    ref_res = client.post("/api/auth/refresh", json={"refresh_token": refresh_token})
    assert ref_res.status_code == 200
    new_tokens = ref_res.json()
    new_access = new_tokens["access_token"]
    new_refresh = new_tokens["refresh_token"]
    assert new_access
    assert new_refresh != refresh_token

    # 4. Old refresh token should now be revoked (rotation)
    old_ref_res = client.post("/api/auth/refresh", json={"refresh_token": refresh_token})
    assert old_ref_res.status_code == 401

    # 5. Logout
    logout_res = client.post(
        "/api/auth/logout",
        json={"refresh_token": new_refresh},
        headers={"Authorization": f"Bearer {new_access}"}
    )
    assert logout_res.status_code == 200
    assert logout_res.json()["status"] == "SUCCESS"

    # 6. Used refresh token should now be revoked
    revoked_res = client.post("/api/auth/refresh", json={"refresh_token": new_refresh})
    assert revoked_res.status_code == 401
