from pydantic import BaseModel
from typing import Optional, Any, Dict, List
from datetime import datetime

class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int = 1
    page_size: int = 50
    dataset_type: str = "synthetic/demo"
