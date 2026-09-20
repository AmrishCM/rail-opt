import pytest
from app.services.planning.strategic_planner import StrategicPlanner
from app.api.routes.authorities import (
    list_section_officers,
    submit_section_officer_concurrence,
    grant_possession_by_chief_controller,
    get_plan_concurrence_status,
    ConcurrenceRequest
)

def test_strategic_26_week_rolling_program():
    prog = StrategicPlanner.generate_26_week_rolling_program(corridor_id=2)
    assert prog["horizon"] == "26_WEEK_ROLLING"
    assert prog["total_weeks"] == 26
    assert len(prog["schedule"]) == 26

    # Verify presence of key mechanized machinery
    machine_types = [s["machine_type"] for s in prog["schedule"]]
    assert any("Tamping" in m for m in machine_types)
    assert any("Ballast" in m for m in machine_types)
    assert any("Relaying" in m for m in machine_types)
    assert any("Wire Renewal" in m for m in machine_types)

    kpis = prog["kpis"]
    assert kpis["total_machine_block_hours"] > 50
    assert kpis["total_tamping_packed_km"] > 0
    assert kpis["total_ballast_cleaned_km"] > 0

def test_tactical_micro_tuning_against_delays():
    blocks = [
        {"block_id": 1, "corridor_id": 2, "section_id": 2, "start_time": "14:00", "end_time": "16:00"}
    ]
    delayed_trains = [
        {"train_number": "12671", "current_delay_minutes": 20, "priority": "HIGH"}
    ]
    freight = []

    res = StrategicPlanner.tactical_micro_tune(blocks, delayed_trains, freight)
    assert res["micro_tuning_status"] == "OPTIMIZED"
    assert res["adjustments_made"] >= 1
    assert res["tuned_blocks"][0]["micro_tuned"] is True
    assert res["tuned_blocks"][0]["shift_minutes"] > 0

def test_section_officers_list():
    officers = list_section_officers()
    roles = [o["role"] for o in officers]
    assert "SR_DEN" in roles
    assert "SR_DSTE" in roles
    assert "SR_DEE" in roles
    assert "CHIEF_CONTROLLER" in roles

def test_digital_concurrence_and_chief_controller_grant():
    test_plan_id = 902

    # 1. Sr. DEN concurs
    r1 = submit_section_officer_concurrence(
        ConcurrenceRequest(
            plan_id=test_plan_id,
            officer_role="SR_DEN",
            officer_name="Er. Arunachalam (Sr. DEN)",
            decision="CONCURRED",
            comments="Permanent Way & Track Safety verified."
        ),
        user=None,
        db=None
    )
    assert r1["concurrence_status"]["civil_den"]["status"] == "CONCURRED"

    # 2. Sr. DSTE concurs
    r2 = submit_section_officer_concurrence(
        ConcurrenceRequest(
            plan_id=test_plan_id,
            officer_role="SR_DSTE",
            officer_name="Er. Meenakshi (Sr. DSTE)",
            decision="CONCURRED",
            comments="Interlocking safety cleared."
        ),
        user=None,
        db=None
    )
    assert r2["concurrence_status"]["signal_dste"]["status"] == "CONCURRED"

    # 3. Sr. DEE concurs
    r3 = submit_section_officer_concurrence(
        ConcurrenceRequest(
            plan_id=test_plan_id,
            officer_role="SR_DEE",
            officer_name="Er. Venkatesh (Sr. DEE)",
            decision="CONCURRED",
            comments="25kV OHE isolation plan approved."
        ),
        user=None,
        db=None
    )
    assert r3["concurrence_status"]["electrical_dee"]["status"] == "CONCURRED"
    assert r3["concurrence_status"]["all_concurred"] is True

    # 4. Chief Controller grants possession
    grant_res = grant_possession_by_chief_controller(
        plan_id=test_plan_id,
        user=None,
        db=None
    )
    assert grant_res["status"] == "POSSESSION_GRANTED"

    # 5. Verify final status query
    final_status = get_plan_concurrence_status(test_plan_id)
    assert final_status["possession_granted"] is True
    assert final_status["all_concurred"] is True
