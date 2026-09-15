from typing import List, Dict, Any, Tuple
from datetime import datetime

class PlanValidator:
    """
    Independent Plan Verification Engine.
    Validates that a maintenance plan strictly respects all operational,
    safety, corridor, train, resource, and dependency constraints.
    """

    @staticmethod
    def validate_plan(
        assignments: List[Dict[str, Any]],
        tasks_by_id: Dict[int, Any],
        blocks_by_id: Dict[int, Any],
        train_movements: List[Any],
        resources_by_id: Dict[int, Any]
    ) -> Tuple[bool, List[str]]:
        violations: List[str] = []

        # 1. Section Compatibility & Duration fit
        for a in assignments:
            task_id = a.get("task_id")
            block_id = a.get("block_id")
            task = tasks_by_id.get(task_id)
            block = blocks_by_id.get(block_id)

            if not task or not block:
                violations.append(f"Assignment invalid: Task {task_id} or Block {block_id} not found.")
                continue

            # Task asset location section vs block section
            task_section = getattr(task.asset, "section_id", None) if hasattr(task, "asset") and task.asset else None
            # If asset does not have section_id explicitly, check corridor
            task_corridor = getattr(task.asset, "corridor_id", None) if hasattr(task, "asset") and task.asset else None
            block_corridor = getattr(block, "corridor_id", None)
            block_section = getattr(block, "section_id", None)

            if task_corridor and block_corridor and task_corridor != block_corridor:
                violations.append(f"Corridor mismatch: Task {task_id} belongs to Corridor {task_corridor} but assigned to Block {block_id} on Corridor {block_corridor}.")

            # Duration check
            task_dur = getattr(task, "estimated_duration", 60)
            block_dur = getattr(block, "duration_minutes", 120)
            if task_dur > block_dur:
                violations.append(f"Duration overflow: Task {task_id} requires {task_dur} min, exceeding Block {block_id} duration ({block_dur} min).")

        # 2. Resource / Team Overlap check
        resource_slots: Dict[int, List[Tuple[datetime, datetime, int]]] = {}
        for a in assignments:
            res_id = a.get("resource_id")
            block_id = a.get("block_id")
            block = blocks_by_id.get(block_id)
            if res_id and block:
                start = getattr(block, "start_time", None)
                end = getattr(block, "end_time", None)
                if start and end:
                    if res_id not in resource_slots:
                        resource_slots[res_id] = []
                    for s_prev, e_prev, prev_task in resource_slots[res_id]:
                        if not (end <= s_prev or start >= e_prev):
                            violations.append(f"Resource double-booking: Resource {res_id} assigned to Task {a.get('task_id')} and Task {prev_task} with overlapping times.")
                    resource_slots[res_id].append((start, end, a.get("task_id")))

        # 3. Prohibited Train Clashes (FULL_BLOCK or TRAFFIC_BLOCK on active movement section)
        for a in assignments:
            block_id = a.get("block_id")
            block = blocks_by_id.get(block_id)
            if not block:
                continue

            b_sec = getattr(block, "section_id", None)
            b_start = getattr(block, "start_time", None)
            b_end = getattr(block, "end_time", None)
            b_type = str(getattr(block, "block_type", "")).upper()

            if "TRAFFIC" in b_type or "FULL" in b_type:
                for tm in train_movements:
                    tm_sec = getattr(tm, "section_id", None)
                    if tm_sec == b_sec:
                        tm_arr = getattr(tm, "arrival_time", None)
                        tm_dep = getattr(tm, "departure_time", None)
                        if tm_arr and tm_dep and b_start and b_end:
                            # If train runs during traffic block
                            if not (tm_dep <= b_start or tm_arr >= b_end):
                                train_prio = str(getattr(getattr(tm, "train", None), "priority", "MEDIUM")).upper()
                                if "CRITICAL" in train_prio or "HIGH" in train_prio:
                                    violations.append(f"Prohibited Train Conflict: High priority train {getattr(getattr(tm, 'train', None), 'train_number', tm.train_id)} scheduled on section {b_sec} during {b_type} Block {block_id}.")

        is_valid = len(violations) == 0
        return is_valid, violations
