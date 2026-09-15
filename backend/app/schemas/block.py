from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

class BlockWindowResponse(BaseModel):
    block_id: int
    corridor_id: int
    section_id: int
    corridor_name: Optional[str] = None
    section_name: Optional[str] = None
    start_time: datetime
    end_time: datetime
    duration_minutes: int
    block_type: str
    traffic_level: int = 1
    eligible_departments: Optional[str] = None
    status: str
    assigned_tasks_count: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)
