import pytest
import sys
import os
from datetime import datetime, timedelta

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.simulation.engine import DiscreteEventSimulator

class DummyAsset:
    corridor_id = 1
    section_id = 101

class DummyTask:
    def __init__(self, task_id):
        self.task_id = task_id
        self.estimated_duration = 60
        self.safety_impact = 8
        self.description = f"Task {task_id}"
        self.asset = DummyAsset()

class DummyBlock:
    def __init__(self, block_id):
        self.block_id = block_id
        self.section_id = 101
        self.start_time = datetime(2026, 9, 12, 2, 0)
        self.end_time = datetime(2026, 9, 12, 4, 0)
        self.duration_minutes = 120
        self.block_type = "TRAFFIC_BLOCK"

def test_simulation_determinism():
    sim1 = DiscreteEventSimulator(random_seed=42)
    sim2 = DiscreteEventSimulator(random_seed=42)

    tasks_map = {1: DummyTask(1)}
    blocks_map = {1: DummyBlock(1)}
    assignments = [{"task_id": 1, "block_id": 1}]

    res1 = sim1.simulate_plan(assignments, blocks_map, tasks_map, [], [DummyAsset()])
    res2 = sim2.simulate_plan(assignments, blocks_map, tasks_map, [], [DummyAsset()])

    assert res1["asset_availability"] == res2["asset_availability"]
    assert res1["train_delay_minutes"] == res2["train_delay_minutes"]
    assert res1["events_count"] == res2["events_count"]
