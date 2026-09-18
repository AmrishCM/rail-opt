import pytest
from app.services.state_machine import (
    can_transition,
    validate_transition,
    get_workflow_stages,
    get_replan_stages,
    get_stage_status
)
from app.services.mock_data import (
    get_tms_defects,
    get_smms_defects,
    get_tdms_defects,
    get_train_timetable,
    get_available_resources
)


def test_state_machine_valid_transitions():
    assert can_transition("REPORTED", "AI_PLANNING") is True
    assert can_transition("AI_PLANNING", "PLAN_READY") is True
    assert can_transition("PLAN_READY", "MANAGER_REVIEW") is True
    assert can_transition("MANAGER_REVIEW", "APPROVED") is True
    assert can_transition("APPROVED", "ASSIGNED") is True
    assert can_transition("ASSIGNED", "IN_PROGRESS") is True
    assert can_transition("IN_PROGRESS", "REPLAN_REQUESTED") is True
    assert can_transition("IN_PROGRESS", "RESOLVED") is True
    assert can_transition("REPLAN_REQUESTED", "AI_REPLANNING") is True
    assert can_transition("AI_REPLANNING", "MANAGER_REVIEW") is True
    assert can_transition("REPLANNED", "IN_PROGRESS") is True
    assert can_transition("RESOLVED", "VERIFIED") is True
    assert can_transition("VERIFIED", "CLOSED") is True


def test_state_machine_invalid_transitions():
    valid, msg = validate_transition("REPORTED", "CLOSED")
    assert valid is False
    assert "Invalid transition" in msg

    valid, msg = validate_transition("CLOSED", "IN_PROGRESS")
    assert valid is False


def test_workflow_stages_structure():
    stages = get_workflow_stages()
    assert len(stages) == 10
    stage_keys = [s["key"] for s in stages]
    assert stage_keys == [
        "REPORTED", "AI_PLANNING", "PLAN_READY", "MANAGER_REVIEW",
        "APPROVED", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "VERIFIED", "CLOSED"
    ]

    replan_stages = get_replan_stages()
    assert len(replan_stages) == 4


def test_get_stage_status():
    assert get_stage_status("REPORTED", "REPORTED") == "current"
    assert get_stage_status("ASSIGNED", "REPORTED") == "completed"
    assert get_stage_status("REPORTED", "CLOSED") == "future"


def test_deterministic_mock_data_providers():
    tms = get_tms_defects()
    assert len(tms) >= 4
    assert any(d["defect_id"] == "TMS-DEF-1042" for d in tms)

    smms = get_smms_defects()
    assert len(smms) >= 4
    assert any(d["equipment_id"] == "SMMS-AXC-018" for d in smms)

    tdms = get_tdms_defects()
    assert len(tdms) >= 4
    assert any(d["defect_id"] == "TDMS-OHE-004" for d in tdms)

    coa = get_train_timetable()
    assert len(coa) >= 6
    assert any(t["train_number"] == "12671" for t in coa)

    res = get_available_resources()
    assert len(res) >= 10
