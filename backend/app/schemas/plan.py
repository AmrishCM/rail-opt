from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime

class PlanAssignmentResponse(BaseModel):
    assignment_id: int
    plan_id: int
    task_id: int
    block_id: int
    resource_id: Optional[int] = None
    assigned_start_time: datetime
    assigned_end_time: datetime
    status: str
    efficiency_score: Optional[float] = None
    notes: Optional[str] = None
    task_description: Optional[str] = None
    department: Optional[str] = None
    corridor_name: Optional[str] = None
    section_name: Optional[str] = None
    block_type: Optional[str] = None
    priority_score: Optional[int] = None
    safety_impact: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)

class MaintenancePlanResponse(BaseModel):
    plan_id: int
    plan_name: str
    plan_type: str
    status: str
    horizon_start: datetime
    horizon_end: datetime
    corridor_ids: Optional[str] = None
    departments: Optional[str] = None
    total_score: Optional[float] = None
    asset_availability: Optional[float] = None
    train_impact_minutes: Optional[int] = None
    maintenance_completion_percent: Optional[float] = None
    block_utilization_percent: Optional[float] = None
    coordination_score: Optional[float] = None
    notes: Optional[str] = None
    assignments: List[PlanAssignmentResponse] = []
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
