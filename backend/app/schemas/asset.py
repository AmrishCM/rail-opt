from pydantic import BaseModel, ConfigDict
from typing import Optional, Dict, Any
from datetime import datetime

class AssetBase(BaseModel):
    asset_type: str
    department: str
    corridor_id: Optional[int] = None
    location: str
    criticality: int = 50  # 1-100
    installation_date: Optional[datetime] = None
    operating_status: str = "OPERATIONAL"
    last_maintenance_date: Optional[datetime] = None
    next_due_date: Optional[datetime] = None
    meta_data: Optional[str] = None

class AssetCreate(AssetBase):
    pass

class AssetResponse(AssetBase):
    asset_id: int
    corridor_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
