from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ...db.session import get_db
from ...schemas.ai import AssistantQueryRequest, AssistantQueryResponse, ExplainAssignmentRequest, ExplainAssignmentResponse
from ...ai.assistant import OperationsAssistant
from ...ai.explanation import OptimizationExplainer
from ...models.plan import MaintenancePlan
from ...models.block_window import BlockWindow
from ...models.maintenance_task import MaintenanceTask

router = APIRouter()

@router.post("/query", response_model=AssistantQueryResponse)
async def query_assistant(request: AssistantQueryRequest, db: Session = Depends(get_db)):
    result = await OperationsAssistant.process_query(
        query=request.query,
        plan_id=request.plan_id,
        corridor_id=request.corridor_id
    )
    return result

@router.post("/explain", response_model=ExplainAssignmentResponse)
def explain_assignment(request: ExplainAssignmentRequest, db: Session = Depends(get_db)):
    plan = db.query(MaintenancePlan).filter(MaintenancePlan.plan_id == request.plan_id).first()
    blocks = {b.block_id: b for b in db.query(BlockWindow).all()}
    tasks = {t.task_id: t for t in db.query(MaintenanceTask).all()}

    assignments = []
    if plan:
        for a in plan.assignments:
            assignments.append({
                "task_id": a.task_id,
                "block_id": a.block_id
            })

    target_block = request.block_id or (assignments[0]["block_id"] if assignments else 1)

    result = OptimizationExplainer.explain_block_selection(
        block_id=target_block,
        assignments=assignments,
        blocks_by_id=blocks,
        tasks_by_id=tasks
    )
    return result
