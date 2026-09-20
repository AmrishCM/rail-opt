import pytest
from app.ml.criticality import calculate_composite_criticality_index, get_explainable_priority
from app.ml.failure_prediction import predict_disruption_risk, predict_asset_failure

def test_composite_criticality_index_calculation():
    # Test high-severity IMR rail fracture
    res = calculate_composite_criticality_index(
        defect_severity=10,
        defect_code="IMR",
        rams_rcm_risk=0.90,
        days_overdue=4,
        gmt_density=75.0,
        safety_impact=10
    )
    assert res["composite_criticality_index"] >= 80
    assert res["urgency_level"] == "CRITICAL_IMMEDIATE"
    assert res["max_deferral_hours"] <= 24
    assert res["breakdown"]["defect_severity_score"] == 30
    assert res["breakdown"]["rams_rcm_risk_score"] >= 20
    assert res["breakdown"]["gmt_traffic_density_score"] >= 16

def test_composite_criticality_index_routine_defect():
    # Test routine geometry slack on low traffic line
    res = calculate_composite_criticality_index(
        defect_severity=3,
        defect_code="GEOMETRY_SLACK",
        rams_rcm_risk=0.20,
        days_overdue=0,
        gmt_density=18.0,
        safety_impact=3
    )
    assert res["composite_criticality_index"] <= 45
    assert res["urgency_level"] in ["LOW_MONITORED", "MEDIUM_ROUTINE"]
    assert res["breakdown"]["overdue_penalty_score"] == 0

def test_explainable_priority_backward_compatibility():
    prio = get_explainable_priority(
        safety_impact=9,
        failure_probability=0.85,
        asset_criticality=85,
        overdue_days=3,
        defect_severity=9,
        corridor_traffic_level=4
    )
    assert prio["priority_level"] == "CRITICAL"
    assert prio["score"] >= 75
    assert len(prio["reasons"]) > 0

def test_predict_disruption_risk():
    disruption = predict_disruption_risk(
        severity=9,
        cci_score=88,
        gmt_density=72.0,
        days_overdue=3,
        trains_per_hour=7.0
    )
    scenarios = disruption["deferral_scenarios"]
    assert "defer_24h" in scenarios
    assert "defer_48h" in scenarios
    assert "defer_168h" in scenarios

    # Probability increases with longer deferral
    assert scenarios["defer_168h"]["disruption_probability"] >= scenarios["defer_24h"]["disruption_probability"]
    assert scenarios["defer_24h"]["expected_train_delay_minutes"] > 0
    assert disruption["recommendation"] == "EXECUTE_IMMEDIATE_BLOCK"

def test_asset_failure_prediction():
    prob = predict_asset_failure(
        age_years=12.0,
        days_since_maint=180,
        past_defects=5,
        traffic_level=4,
        load_ratio=0.85
    )
    assert 0.01 <= prob <= 0.99
