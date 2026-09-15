import pytest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_login_demo_users():
    # 1. Test Engineer Login
    res = client.post("/api/auth/login", json={
        "username": "engineer@railopt.demo",
        "password": "RailOpt@2026"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["role"] == "MAINTENANCE_ENGINEER"
    assert "maintenance:create" in data["user"]["permissions"]
    assert "plan:approve" not in data["user"]["permissions"]

    # 2. Test Manager Login
    res_mgr = client.post("/api/auth/login", json={
        "username": "manager@railopt.demo",
        "password": "RailOpt@2026"
    })
    assert res_mgr.status_code == 200
    mgr_data = res_mgr.json()
    assert mgr_data["user"]["role"] == "OPERATIONS_MANAGER"
    assert "plan:approve" in mgr_data["user"]["permissions"]

    # 3. Test Invalid Password
    res_inv = client.post("/api/auth/login", json={
        "username": "engineer@railopt.demo",
        "password": "WrongPassword"
    })
    assert res_inv.status_code == 401

def test_rbac_engineer_cannot_approve_plan():
    # Engineer logs in
    login_res = client.post("/api/auth/login", json={
        "username": "engineer@railopt.demo",
        "password": "RailOpt@2026"
    })
    token = login_res.json()["access_token"]

    # Engineer attempts to approve plan 101 -> MUST BE FORBIDDEN (403)
    res = client.post(
        "/api/planning/101/approve",
        json={"comments": "Engineer attempting unauthorized approval"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 403
    assert "Access denied" in res.json()["detail"]

def test_rbac_manager_can_approve_plan():
    # Manager logs in
    login_res = client.post("/api/auth/login", json={
        "username": "manager@railopt.demo",
        "password": "RailOpt@2026"
    })
    token = login_res.json()["access_token"]

    # Manager approves plan 101 -> MUST SUCCEED (200)
    res = client.post(
        "/api/planning/101/approve",
        json={"comments": "Manager authorized possession"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    assert res.json()["status"] == "APPROVED"

def test_demo_users_endpoint():
    res = client.get("/api/auth/demo-users")
    assert res.status_code == 200
    users = res.json()
    assert len(users) >= 8
    roles = [u["role"] for u in users]
    assert "SYSTEM_ADMIN" in roles
    assert "OPERATIONS_MANAGER" in roles
    assert "MAINTENANCE_ENGINEER" in roles
    assert "FIELD_INSPECTOR" in roles
