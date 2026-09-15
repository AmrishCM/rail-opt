import pytest
import sys
import os
from datetime import datetime, timedelta

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.optimization.solver import RailwayBlockOptimizer
from app.optimization.validators import PlanValidator

class DummyAsset:
    corridor_id = 1
    section_id = 101
    criticality = 80

class DummyTask:
    def __init__(self, task_id, dept, dur=60, prio=70, safety=8):
        self.task_id = task_id
        self.department = dept
        self.estimated_duration = dur
        self.priority_score = prio
        self.safety_impact = safety
        self.description = f"Task {task_id}"
        self.asset = DummyAsset()

class DummyBlock:
    def __init__(self, block_id, dur=120):
        self.block_id = block_id
        self.corridor_id = 1
        self.section_id = 101
        self.start_time = datetime.now()
        self.end_time = self.start_time + timedelta(minutes=dur)
        self.duration_minutes = dur
        self.block_type = "COMBINED_BLOCK"
        self.eligible_departments = "Engineering/Track,S&T/Signalling,Traction Distribution"

class DummyResource:
    department = "Engineering/Track"
    team_size = 2

def test_cpsat_optimizer_basic_solve():
    tasks = [
        DummyTask(1, "Engineering/Track", 60, 90, 9),
        DummyTask(2, "S&T/Signalling", 60, 85, 8),
        DummyTask(3, "Traction Distribution", 45, 75, 7)
    ]
    blocks = [DummyBlock(1, 150), DummyBlock(2, 120)]
    optimizer = RailwayBlockOptimizer(
        tasks=tasks,
        block_windows=blocks,
        train_movements=[],
        departments=["Engineering/Track", "S&T/Signalling", "Traction Distribution"],
        resources=[DummyResource()]
    )
    result = optimizer.solve()

    assert result["status"] in ["OPTIMAL", "FEASIBLE"]
    assert len(result["assignments"]) > 0
    assert "metrics" in result
    assert "solver_stats" in result
    assert result["metrics"]["asset_availability"] > 80.0

def test_plan_validator_catches_violations():
    tasks_map = {
        1: DummyTask(1, "Engineering/Track", dur=180) # 180 min exceeds 120 min block
    }
    blocks_map = {
        1: DummyBlock(1, dur=120)
    }
    assignments = [{"task_id": 1, "block_id": 1}]

    is_valid, violations = PlanValidator.validate_plan(
        assignments=assignments,
        tasks_by_id=tasks_map,
        blocks_by_id=blocks_map,
        train_movements=[],
        resources_by_id={}
    )
    assert not is_valid
    assert len(violations) > 0
    assert "Duration overflow" in violations[0]
