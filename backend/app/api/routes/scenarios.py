from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from ...db.session import get_db
from ...models.scenario import Scenario
from ...schemas.scenario import ScenarioRequest

router = APIRouter()

PRESET_SCENARIOS = [
    {
        "id": "scenario_signal_failure",
        "name": "Critical Signal Interlocking Failure",
        "category": "CRITICAL_DEFECT",
        "description": "Sudden signal aspect failure reported on Corridor C1 Section S2. Requires immediate S&T track possession.",
        "event": {
            "type": "NEW_CRITICAL_DEFECT",
            "section_id": 2,
            "corridor_id": 1,
            "department": "S&T/Signalling",
            "severity": "CRITICAL",
            "description": "Urgent Signal Interlocking Failure"
        }
    },
    {
        "id": "scenario_block_cancelled",
        "name": "Block Window Cancelled by Operating Control",
        "category": "CANCEL_BLOCK",
        "description": "Window #17 cancelled due to unexpected freight surge. Scheduled tasks must be dynamically relocated.",
        "event": {
            "type": "CANCEL_BLOCK",
            "block_id": 17,
            "description": "Block Window 17 cancelled"
        }
    },
    {
        "id": "scenario_special_train",
        "name": "VIP Special Express Introduced",
        "category": "TRAIN_SURGE",
        "description": "Priority Vande Bharat Special introduced into Northern Trunk timetable, restricting daytime possession slots.",
        "event": {
            "type": "TRAIN_SURGE",
            "corridor_id": 1,
            "description": "Vande Bharat Special introduced"
        }
    },
    {
        "id": "scenario_crew_shortage",
        "name": "Traction Distribution Crew Shortage",
        "category": "CREW_UNAVAILABLE",
        "description": "Overhead equipment maintenance team diverted to emergency repairs on adjoining division.",
        "event": {
            "type": "CREW_UNAVAILABLE",
            "department": "Traction Distribution",
            "description": "TRD workforce reduced"
        }
    }
]

@router.get("")
def list_preset_scenarios():
    return {
        "presets": PRESET_SCENARIOS,
        "dataset_type": "synthetic/demo"
    }

@router.post("")
def create_scenario(request: ScenarioRequest, db: Session = Depends(get_db)):
    sc = Scenario(
        name=request.name,
        description=request.description,
        event_type=request.event.type,
        base_plan_id=request.base_plan_id,
        parameters=request.event.model_dump_json()
    )
    db.add(sc)
    db.commit()
    db.refresh(sc)
    return {
        "scenario_id": sc.scenario_id,
        "name": sc.name,
        "status": "CREATED",
        "message": "Scenario recorded. Ready to trigger dynamic re-optimization."
    }
