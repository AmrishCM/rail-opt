from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any

class SectionResponse(BaseModel):
    section_id: int
    corridor_id: int
    name: str
    section_number: int
    start_km: float
    end_km: float
    length_km: float
    max_speed: Optional[int] = 130
    gradient: Optional[float] = 0.0
    maintenance_complexity: int = 2

    model_config = ConfigDict(from_attributes=True)

class CorridorResponse(BaseModel):
    corridor_id: int
    name: str
    start_station: str
    end_station: str
    traffic_level: int
    route_capacity: Optional[int] = 14
    sections: List[SectionResponse] = []
    assets_count: Optional[int] = 0
    active_tasks_count: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)
