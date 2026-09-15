from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class SimulationRequest(BaseModel):
    plan_id: int
    random_seed: int = 42
    run_baseline_comparison: bool = True

class SimulationMetrics(BaseModel):
    asset_availability: float
    maintenance_completion: float
    critical_tasks_completed: float
    total_block_hours: float
    train_delay_minutes: int
    average_block_utilization: float
    conflicts: int
    deferred_tasks: int
    coordination_events: int = 0
    dataset_type: str = "synthetic/demo"

class ComparisonMetrics(BaseModel):
    baseline: SimulationMetrics
    ai_plan: SimulationMetrics
    improvements: Dict[str, Any]

class SimulationResponse(BaseModel):
    simulation_id: int
    plan_id: int
    status: str
    metrics: SimulationMetrics
    comparison: Optional[ComparisonMetrics] = None
    events_sample: List[Dict[str, Any]] = []
    dataset_type: str = "synthetic/demo"
