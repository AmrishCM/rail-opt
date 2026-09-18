from pydantic import BaseModel, ConfigDict
from typing import Optional, Dict, Any, List
from datetime import datetime

class CriticalityBreakdown(BaseModel):
    safety_impact: int
    failure_probability_score: int
    asset_criticality_score: int
    overdue_factor: int
    defect_severity: int
    operational_impact: int
    total_score: int
    formula: str = "safety(30) + failure_prob(25) + asset_crit(20) + overdue(10) + severity(10) + op_impact(5)"

class MaintenanceTaskBase(BaseModel):
    asset_id: Optional[int] = None
    department: str
    task_type: str = "CORRECTIVE"
    defect_type: Optional[str] = None
    description: str
    severity: int = 5  # 1-10
    location_name: Optional[str] = None
    photo_evidence: Optional[str] = None
    additional_notes: Optional[str] = None
    idempotency_key: Optional[str] = None
    detected_at: Optional[datetime] = None
    due_date: Optional[datetime] = None
    estimated_duration: int = 90  # minutes
    required_resources: Optional[str] = None
    required_block_type: Optional[str] = "TRAFFIC_BLOCK"
    safety_impact: int = 5  # 1-10
    failure_probability: Optional[float] = 0.2
    overdue_days: int = 0
    dependencies: Optional[str] = None

class MaintenanceTaskCreate(MaintenanceTaskBase):
    issue: Optional[str] = None
    location: Optional[str] = None
    photo: Optional[str] = None

class MaintenanceTaskResponse(MaintenanceTaskBase):
    task_id: int
    priority_score: Optional[int] = 50
    status: str
    asset_location: Optional[str] = None
    corridor_id: Optional[int] = None
    corridor_name: Optional[str] = None
    breakdown: Optional[CriticalityBreakdown] = None

    model_config = ConfigDict(from_attributes=True)
