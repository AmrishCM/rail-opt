import pytest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.ml.criticality import calculate_task_criticality
from app.ml.failure_prediction import predict_asset_failure

def test_criticality_bounds_and_structure():
    res = calculate_task_criticality(
        safety_impact=10,
        failure_probability=0.9,
        asset_criticality=95,
        overdue_days=7,
        defect_severity=9,
        corridor_traffic_level=5
    )
    assert 1 <= res["total_score"] <= 100
    assert "safety_impact" in res
    assert "failure_probability_score" in res
    assert "asset_criticality_score" in res
    assert "overdue_factor" in res
    assert "defect_severity" in res
    assert "operational_impact" in res
    assert res["safety_impact"] == 30

def test_criticality_low_priority():
    res = calculate_task_criticality(
        safety_impact=2,
        failure_probability=0.1,
        asset_criticality=30,
        overdue_days=0,
        defect_severity=2,
        corridor_traffic_level=1
    )
    assert res["total_score"] < 40
    assert res["overdue_factor"] == 0

def test_ml_failure_prediction():
    prob = predict_asset_failure(
        age_years=12.0,
        days_since_maint=180,
        past_defects=5,
        traffic_level=5,
        load_ratio=0.9,
        env_stress=8.0
    )
    assert 0.01 <= prob <= 0.99
