from dataclasses import dataclass
from datetime import datetime
from typing import Optional, Dict, Any

@dataclass
class SimEvent:
    timestamp: datetime
    event_type: str  # BLOCK_START, BLOCK_END, TRAIN_ENTER_SECTION, TRAIN_EXIT_SECTION, TRAIN_DELAY, TASK_COMPLETED
    entity_id: int
    entity_type: str  # BLOCK, TRAIN, TASK, ASSET
    section_id: int
    description: str
    impact_minutes: int = 0
    meta_data: Optional[Dict[str, Any]] = None
