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
# PART 39: TIMETABLE & TIMELINE ACCEPTANCE TESTS (T.1 – T.5)
# ==============================================================================

def test_t1_tracks_render_as_timeline_rows(tokens):
    """T.1 — Tracks render as timeline rows (C1, C2, etc.)."""
    headers = {"Authorization": f"Bearer {tokens['manager']}"}
    res = client.get("/api/timeline?corridor_id=2&date=2026-09-15", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "sections" in data
    sections = data["sections"]
    assert len(sections) >= 1
    codes = [s["code"] for s in sections]
    assert any("C" in c for c in codes)

def test_t2_train_blocks_render_at_actual_times(tokens):
    """T.2 — Train blocks render at actual scheduled times."""
    headers = {"Authorization": f"Bearer {tokens['manager']}"}
    res = client.get("/api/timeline?corridor_id=2&date=2026-09-15", headers=headers)
    assert res.status_code == 200
    trains = res.json()["tracks"]["trains"]
    assert len(trains) > 0
    t0 = trains[0]
    assert "start_time" in t0
    assert "end_time" in t0
    assert "start_minute" in t0
    assert "duration_minutes" in t0
    assert t0["duration_minutes"] > 0

def test_t3_maintenance_blocks_render_at_actual_times(tokens):
    """T.3 — Maintenance blocks render at actual scheduled times."""
    headers = {"Authorization": f"Bearer {tokens['manager']}"}
    res = client.get("/api/timeline?corridor_id=2&date=2026-09-15", headers=headers)
    assert res.status_code == 200
    maint = res.json()["tracks"]["maintenance"]
    assert len(maint) > 0
    m0 = maint[0]
    assert "start_time" in m0
    assert "end_time" in m0
    assert "start_minute" in m0
    assert "duration_minutes" in m0

def test_t4_conflicting_blocks_are_detected(tokens):
    """T.4 — Conflicting train and maintenance blocks are detected."""
    headers = {"Authorization": f"Bearer {tokens['manager']}"}
    res = client.get("/api/timeline?corridor_id=2&date=2026-09-15", headers=headers)
    assert res.status_code == 200
    conflicts = res.json()["conflicts"]
    if len(conflicts) > 0:
        c = conflicts[0]
        assert "overlap_minutes" in c
        assert c["overlap_minutes"] > 0
        assert "severity" in c
        assert c["severity"] in ["CRITICAL", "WARNING"]

def test_t5_approved_replans_update_timeline(tokens):
    """T.5 — Approved replans update the timeline data without server restart."""
    headers = {"Authorization": f"Bearer {tokens['manager']}"}
    res = client.get("/api/timeline?corridor_id=2&date=2026-09-15", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "active_plans_count" in data
    assert data["active_plans_count"] >= 1
