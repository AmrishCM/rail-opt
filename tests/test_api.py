import pytest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_api_health():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"

def test_api_corridors():
    res = client.get("/api/corridors")
    assert res.status_code == 200
    corridors = res.json()
    assert len(corridors) > 0
    assert "sections" in corridors[0]

def test_api_tasks():
    res = client.get("/api/tasks")
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert len(data["items"]) > 0
    assert "breakdown" in data["items"][0]

def test_api_optimize_and_simulation_flow():
    # 1. Optimize
    opt_res = client.post("/api/optimize", json={"include_low_priority": True, "max_solve_time_seconds": 5})
    assert opt_res.status_code == 200
    opt_data = opt_res.json()
    assert opt_data["status"] in ["OPTIMAL", "FEASIBLE"]
    plan_id = opt_data["plan_id"]

    # 2. Simulate
    sim_res = client.post("/api/simulation/run", json={"plan_id": plan_id, "random_seed": 42})
    assert sim_res.status_code == 200
    sim_data = sim_res.json()
    assert "comparison" in sim_data
    assert "improvements" in sim_data["comparison"]

    # 3. Replan
    replan_res = client.post("/api/replan", json={
        "plan_id": plan_id,
        "event": {
            "type": "NEW_CRITICAL_DEFECT",
            "section_id": 2,
            "description": "Urgent Point Machine Failure"
        }
    })
    assert replan_res.status_code == 200
    replan_data = replan_res.json()
    assert "changed_assignments" in replan_data
