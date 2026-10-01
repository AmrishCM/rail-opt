from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

class TrainMovementResponse(BaseModel):
    movement_id: int
    train_id: int
    corridor_id: int
    section_id: int
    arrival_time: datetime
    departure_time: datetime
    scheduled_duration: Optional[int] = None
    delay_minutes: int = 0
    forecast_status: str = "ON_TIME"
    train_number: Optional[str] = None
    train_type: Optional[str] = None
    priority: Optional[str] = "MEDIUM"
    station_code: Optional[str] = None
    chainage_km: Optional[float] = None
    platform_no: Optional[str] = None
    data_source: Optional[str] = "Aligned with OGD Platform India (data.gov.in)"

    model_config = ConfigDict(from_attributes=True)

class TrainResponse(BaseModel):
    train_id: int
    train_number: str
    train_type: str
    priority: str
    origin_station_code: Optional[str] = None
    destination_station_code: Optional[str] = None
    ogd_train_id: Optional[str] = None
    data_source: Optional[str] = "Aligned with OGD Platform India (data.gov.in)"
    max_speed: Optional[int] = 130
    capacity: Optional[int] = 1200
    current_status: str = "AVAILABLE"
    movements: List[TrainMovementResponse] = []

    model_config = ConfigDict(from_attributes=True)
