from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class ScenarioEvent(BaseModel):
    type: str  # NEW_CRITICAL_DEFECT, CANCEL_BLOCK, TRAIN_SURGE, CREW_UNAVAILABLE
    asset_id: Optional[int] = None
    section_id: Optional[int] = None
    corridor_id: Optional[int] = None
    block_id: Optional[int] = None
    time: Optional[str] = None
    severity: Optional[str] = "CRITICAL"
    description: Optional[str] = None

class ScenarioRequest(BaseModel):
    name: str
    description: Optional[str] = None
    base_plan_id: int
    event: ScenarioEvent

class ReplanRequest(BaseModel):
    plan_id: int
    event: ScenarioEvent
    current_time: Optional[str] = None

class AssignmentDiff(BaseModel):
    task_id: int
    task_description: str
    change_type: str  # MOVED_EARLIER, MOVED_LATER, NEWLY_SCHEDULED, DEFERRED, COMBINED
    old_block_id: Optional[int] = None
    new_block_id: Optional[int] = None
    old_time: Optional[str] = None
    new_time: Optional[str] = None
    reason: str

class ReplanResponse(BaseModel):
    scenario_id: Optional[int] = None
    old_plan_id: int
    new_plan_id: int
    status: str
    changed_assignments: List[AssignmentDiff]
    impact: Dict[str, Any]
    reason_summary: List[str]
    dataset_type: str = "synthetic/demo"
