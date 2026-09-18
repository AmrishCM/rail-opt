"""
Issue State Machine — Enforces valid workflow transitions for maintenance issues.
Every state change creates an audit event.
"""
from datetime import datetime
from typing import Optional, Tuple


# Valid state transitions map
VALID_TRANSITIONS = {
    "REPORTED":           ["AI_PLANNING"],
    "AI_PLANNING":        ["PLAN_READY"],
    "PLAN_READY":         ["MANAGER_REVIEW"],
    "MANAGER_REVIEW":     ["APPROVED", "REJECTED"],
    "APPROVED":           ["ASSIGNED"],
    "ASSIGNED":           ["IN_PROGRESS"],
    "IN_PROGRESS":        ["REPLAN_REQUESTED", "RESOLVED", "COMPLETED"],
    "REPLAN_REQUESTED":   ["AI_REPLANNING"],
    "AI_REPLANNING":      ["MANAGER_REVIEW"],
    "REPLANNED":          ["IN_PROGRESS"],
    "REJECTED":           ["AI_PLANNING", "CLOSED"],
    "RESOLVED":           ["VERIFIED"],
    "VERIFIED":           ["CLOSED"],
    "COMPLETED":          ["VERIFIED", "CLOSED"],
    "CLOSED":             [],
    # Legacy compatibility — allow transitions from old statuses
    "NEW":                ["REPORTED", "AI_PLANNING", "ACKNOWLEDGED"],
    "ACKNOWLEDGED":       ["AI_PLANNING", "UNDER_REVIEW"],
    "UNDER_REVIEW":       ["AI_PLANNING", "PLAN_REQUIRED"],
    "PLAN_REQUIRED":      ["AI_PLANNING"],
    "PLAN_CREATED":       ["PLAN_READY", "MANAGER_REVIEW"],
    "SCHEDULED":          ["ASSIGNED", "IN_PROGRESS"],
}

# Human-readable stage labels for the workflow map
WORKFLOW_STAGES = [
    {"key": "REPORTED",          "label": "Reported",           "order": 1},
    {"key": "AI_PLANNING",       "label": "AI Planning",        "order": 2},
    {"key": "PLAN_READY",        "label": "Plan Ready",         "order": 3},
    {"key": "MANAGER_REVIEW",    "label": "Manager Review",     "order": 4},
    {"key": "APPROVED",          "label": "Approved",           "order": 5},
    {"key": "ASSIGNED",          "label": "Assigned",           "order": 6},
    {"key": "IN_PROGRESS",       "label": "In Progress",        "order": 7},
    {"key": "RESOLVED",          "label": "Resolved",           "order": 8},
    {"key": "VERIFIED",          "label": "Verified",           "order": 9},
    {"key": "CLOSED",            "label": "Closed",             "order": 10},
]

# Replan sub-workflow stages (shown as an inline branch)
REPLAN_STAGES = [
    {"key": "REPLAN_REQUESTED",  "label": "Replan Requested",   "order": 7.1},
    {"key": "AI_REPLANNING",     "label": "AI Replanning",      "order": 7.2},
    {"key": "MANAGER_REVIEW",    "label": "Manager Review (V2)","order": 7.3},
    {"key": "REPLANNED",         "label": "Replanned",          "order": 7.4},
]


def can_transition(current_status: str, target_status: str) -> bool:
    """Check if a state transition is valid."""
    current = current_status.upper().strip()
    target = target_status.upper().strip()
    allowed = VALID_TRANSITIONS.get(current, [])
    return target in allowed


def validate_transition(current_status: str, target_status: str) -> Tuple[bool, str]:
    """Validate a state transition and return (is_valid, error_message)."""
    current = current_status.upper().strip()
    target = target_status.upper().strip()

    if current == target:
        return True, ""

    allowed = VALID_TRANSITIONS.get(current, [])
    if target in allowed:
        return True, ""

    return False, f"Invalid transition: {current} → {target}. Allowed: {', '.join(allowed) if allowed else 'none (terminal state)'}"


def get_workflow_stages():
    """Return the main workflow stages for UI rendering."""
    return WORKFLOW_STAGES


def get_replan_stages():
    """Return replan sub-workflow stages."""
    return REPLAN_STAGES


def get_stage_status(current_status: str, stage_key: str) -> str:
    """
    Determine the visual status of a workflow stage given the current issue status.
    Returns: 'completed', 'current', 'future', or 'skipped'
    """
    current = current_status.upper().strip()
    stage = stage_key.upper().strip()

    # Get the order of each stage
    stage_orders = {s["key"]: s["order"] for s in WORKFLOW_STAGES}
    current_order = stage_orders.get(current, 0)
    check_order = stage_orders.get(stage, 0)

    if current == stage:
        return "current"
    elif check_order < current_order:
        return "completed"
    elif current in ("REJECTED",) and stage not in ("REPORTED", "AI_PLANNING", "PLAN_READY", "MANAGER_REVIEW"):
        return "skipped"
    else:
        return "future"


def create_audit_entry(
    action: str,
    entity_type: str,
    entity_id: str,
    user_id: str,
    details: str,
    timestamp: Optional[datetime] = None
) -> dict:
    """Create a standardized audit log entry dict."""
    return {
        "action": action,
        "entity_type": entity_type,
        "entity_id": entity_id,
        "user_id": user_id,
        "details": details,
        "timestamp": (timestamp or datetime.now()).isoformat(),
    }
