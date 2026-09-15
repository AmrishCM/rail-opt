from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class ObjectiveWeights(BaseModel):
    weight_asset_availability: float = 0.30
    weight_train_impact: float = 0.25
    weight_maintenance_priority: float = 0.20
    weight_coordination: float = 0.15
    weight_block_efficiency: float = 0.10

class OptimizeRequest(BaseModel):
    horizon_start: Optional[str] = None
    horizon_end: Optional[str] = None
    corridor_ids: Optional[List[int]] = None
    departments: Optional[List[str]] = None
    objective_weights: Optional[Dict[str, float]] = None
    include_low_priority: bool = True
    max_solve_time_seconds: int = 15

class SolverStats(BaseModel):
    tasks_considered: int
    block_windows: int
    hard_constraints: int
    candidate_assignments: int
    final_assignments: int
    solver_status: str
    solve_time_seconds: float
    branches: Optional[int] = 0
    wall_time: Optional[float] = 0.0

class BundledBlockInfo(BaseModel):
    block_id: int
    corridor_id: int
    section_id: int
    section_name: str
    block_type: str
    start_time: str
    end_time: str
    duration_minutes: int
    departments: List[str]
    tasks_count: int
    separate_duration_minutes: int
    saved_minutes: int
    utilization_percent: float

class OptimizeResponse(BaseModel):
    run_id: str
    plan_id: int
    status: str
    objective_score: float
    assignments: List[Dict[str, Any]]
    deferred_tasks: List[Dict[str, Any]]
    bundled_blocks: List[BundledBlockInfo] = []
    metrics: Dict[str, Any]
    solver_stats: SolverStats
    dataset_type: str = "synthetic/demo"
