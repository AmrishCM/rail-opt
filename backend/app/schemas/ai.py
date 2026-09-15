from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class AssistantQueryRequest(BaseModel):
    query: str
    plan_id: Optional[int] = None
    corridor_id: Optional[int] = None

class AssistantQueryResponse(BaseModel):
    response: str
    intent: str
    tool_called: Optional[str] = None
    structured_data: Optional[Dict[str, Any]] = None
    citations: List[str] = []
    dataset_type: str = "synthetic/demo"

class ExplainAssignmentRequest(BaseModel):
    plan_id: int
    task_id: Optional[int] = None
    block_id: Optional[int] = None

class ExplainAssignmentResponse(BaseModel):
    subject: str
    selected_block_id: Optional[int] = None
    reasons: List[str]
    alternatives_rejected: List[Dict[str, str]]
    solver_diagnostics: Dict[str, Any]
