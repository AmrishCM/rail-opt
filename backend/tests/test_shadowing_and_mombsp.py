import pytest
from datetime import datetime, timedelta
from app.optimization.clustering import MaintenanceClusteringEngine
from app.optimization.solver import RailwayBlockOptimizer

class MockAsset:
    def __init__(self, corridor_id=2, location="KM 43.5", criticality=80):
        self.corridor_id = corridor_id
        self.location = location
        self.criticality = criticality

class MockTask:
    def __init__(self, task_id, dept, duration=60, location="KM 43.5", priority=75, safety=7):
        self.task_id = task_id
        self.department = dept
        self.estimated_duration = duration
        self.location_name = location
        self.priority_score = priority
        self.safety_impact = safety
        self.description = f"Repair {dept} at {location}"
        self.asset = MockAsset(location=location)

class MockBlock:
    def __init__(self, block_id, corridor_id=2, section_id=2, start_hour=14, duration=150):
        self.block_id = block_id
        self.corridor_id = corridor_id
        self.section_id = section_id
        base = datetime(2026, 9, 15, start_hour, 0)
        self.start_time = base
        self.end_time = base + timedelta(minutes=duration)
        self.duration_minutes = duration
        self.block_type = "COMBINED_BLOCK"
        self.eligible_departments = None

class MockResource:
    def __init__(self, dept, team_size=3):
        self.department = dept
        self.team_size = team_size

def test_shadow_clustering_identifies_overlapping_departments():
    # Co-located tasks on Km 43.0 - 44.5
    tasks = [
        MockTask(1, "Track", duration=120, location="KM 42.5 - 44.0"),
        MockTask(2, "S&T", duration=60, location="KM 43.0 - 43.5"),
        MockTask(3, "Traction", duration=90, location="KM 42.0 - 45.0"),
        MockTask(4, "Track", duration=90, location="KM 110.0 - 112.0") # Far away, different cluster
    ]

    clusters = MaintenanceClusteringEngine.identify_shadow_clusters(tasks, shadow_buffer_km=2.0)
    assert len(clusters) >= 2

    # Find the main cluster around KM 42-45
    main_cluster = next((c for c in clusters if c["tasks_count"] >= 3), None)
    assert main_cluster is not None
    assert main_cluster["is_multi_department"] is True
    assert set(main_cluster["departments"]) == {"Track", "S&T", "Traction"}
    assert main_cluster["saved_downtime_minutes"] > 0
    assert main_cluster["efficiency_gain_percent"] > 25.0

def test_mombsp_solver_generates_shadowed_assignments():
    tasks = [
        MockTask(101, "Track", duration=90, location="KM 42.5 - 44.0", priority=85, safety=8),
        MockTask(102, "S&T", duration=60, location="KM 43.0 - 43.5", priority=80, safety=7),
        MockTask(103, "Traction", duration=75, location="KM 42.0 - 44.5", priority=75, safety=6)
    ]
    blocks = [
        MockBlock(501, corridor_id=2, section_id=2, start_hour=14, duration=150)
    ]
    trains = []
    resources = [
        MockResource("Track", 2),
        MockResource("S&T", 2),
        MockResource("Traction", 2)
    ]

    optimizer = RailwayBlockOptimizer(
        tasks=tasks,
        block_windows=blocks,
        train_movements=trains,
        departments=["Track", "S&T", "Traction"],
        resources=resources,
        objective_weights={
          "weight_asset_availability": 0.30,
          "weight_train_impact": 0.20,
          "weight_maintenance_priority": 0.25,
          "weight_coordination": 0.25,
          "weight_block_efficiency": 0.0
        },
        max_solve_time_seconds=5
    )

    sol = optimizer.solve()
    assert sol["status"] in ["OPTIMAL", "FEASIBLE"]
    assert sol["metrics"]["tasks_completed"] == 3
    assert len(sol["bundled_blocks"]) >= 1
    assert sol["metrics"]["saved_downtime_hours"] > 0
