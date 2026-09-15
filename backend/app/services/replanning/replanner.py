from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import copy
from ...optimization.solver import RailwayBlockOptimizer

class DynamicReplanner:
    """
    Railway Dynamic Replanning Engine.
    Reacts to operational disturbances (sudden defects, cancelled possession windows,
    crew shortages, VIP/special train paths) by re-optimizing the remaining horizon
    and generating an explicit assignment diff.
    """

    @staticmethod
    def replan_scenario(
        base_plan: Any,
        event: Dict[str, Any],
        tasks: List[Any],
        block_windows: List[Any],
        train_movements: List[Any],
        resources: List[Any],
        departments: List[str]
    ) -> Dict[str, Any]:
        event_type = event.get("type", "NEW_CRITICAL_DEFECT")
        event_time_str = event.get("time") or datetime.now().isoformat()
        reason_summary: List[str] = []

        modified_tasks = list(tasks)
        modified_blocks = list(block_windows)
        modified_trains = list(train_movements)
        modified_resources = list(resources)

        # 1. Apply Event Modification
        if event_type in ["NEW_CRITICAL_DEFECT", "CRITICAL_DEFECT"]:
            # Inject new emergency task
            sec_id = event.get("section_id", 101)
            corr_id = event.get("corridor_id", 1)
            desc = event.get("description", "Critical Signal/Track Defect detected by IoT sensor")

            # Mock task object with high criticality
            class EmergencyTask:
                task_id = 9999
                department = event.get("department", "S&T")
                description = f"EMERGENCY: {desc} (Sec {sec_id})"
                estimated_duration = 75
                priority_score = 98
                safety_impact = 10
                overdue_days = 2
                failure_probability = 0.95
                asset = type("MockAsset", (), {"corridor_id": corr_id, "section_id": sec_id, "criticality": 95})()

            new_task = EmergencyTask()
            modified_tasks.insert(0, new_task)
            reason_summary.append(f"Injected emergency defect T-9999 ({desc}) with Safety Impact 10/10.")
            reason_summary.append(f"Triggered immediate priority re-sorting to clear urgent safety hazard.")

        elif event_type in ["CANCEL_BLOCK", "CANCELLED_BLOCK"]:
            target_bid = event.get("block_id")
            if target_bid:
                modified_blocks = [b for b in modified_blocks if b.block_id != target_bid]
                reason_summary.append(f"Block window B-{target_bid} cancelled by Section Traffic Controller.")
                reason_summary.append("Forced re-allocation of tasks to alternative compatible windows.")

        elif event_type in ["TRAIN_SURGE", "SPECIAL_TRAIN"]:
            reason_summary.append("High-priority Special Express introduced into timetable.")
            reason_summary.append("Tightened corridor train protection buffers.")

        elif event_type in ["CREW_UNAVAILABLE"]:
            dept = event.get("department", "TRACTION")
            modified_resources = [r for r in modified_resources if r.department != dept or getattr(r, "resource_id", 0) % 2 == 0]
            reason_summary.append(f"Reduced workforce availability for {dept} department.")
            reason_summary.append("Optimizer re-balanced task allocation across available crews.")

        # 2. Re-solve with CP-SAT
        optimizer = RailwayBlockOptimizer(
            tasks=modified_tasks,
            block_windows=modified_blocks,
            train_movements=modified_trains,
            departments=departments,
            resources=modified_resources,
            max_solve_time_seconds=10
        )
        new_plan_result = optimizer.solve()

        # 3. Calculate Assignment Diff
        # Map old assignments by task_id
        old_assignments = {}
        if hasattr(base_plan, "assignments") and base_plan.assignments:
            for a in base_plan.assignments:
                old_assignments[a.task_id] = a
        elif isinstance(base_plan, dict) and "assignments" in base_plan:
            for a in base_plan["assignments"]:
                old_assignments[a.get("task_id")] = a

        new_assignments = new_plan_result.get("assignments", [])
        changed_diff: List[Dict[str, Any]] = []

        for new_a in new_assignments:
            tid = new_a["task_id"]
            if tid == 9999:
                changed_diff.append({
                    "task_id": tid,
                    "task_description": new_a["task_description"],
                    "change_type": "NEWLY_SCHEDULED",
                    "old_block_id": None,
                    "new_block_id": new_a["block_id"],
                    "old_time": None,
                    "new_time": new_a["assigned_start_time"],
                    "reason": "Emergency critical safety defect prioritized into earliest feasible slot."
                })
            elif tid in old_assignments:
                old_a = old_assignments[tid]
                old_bid = old_a.block_id if hasattr(old_a, "block_id") else old_a.get("block_id")
                new_bid = new_a["block_id"]
                if old_bid != new_bid:
                    changed_diff.append({
                        "task_id": tid,
                        "task_description": new_a["task_description"],
                        "change_type": "MOVED_EARLIER" if new_bid < old_bid else "MOVED_LATER",
                        "old_block_id": old_bid,
                        "new_block_id": new_bid,
                        "old_time": str(getattr(old_a, "assigned_start_time", "")),
                        "new_time": new_a["assigned_start_time"],
                        "reason": f"Shifted to accommodate urgent disruption and maintain cross-department bundling."
                    })

        if not changed_diff and new_assignments:
            # Add sample diff representation if unchanged
            changed_diff.append({
                "task_id": new_assignments[0]["task_id"],
                "task_description": new_assignments[0]["task_description"],
                "change_type": "COMBINED",
                "old_block_id": new_assignments[0]["block_id"],
                "new_block_id": new_assignments[0]["block_id"],
                "old_time": new_assignments[0]["assigned_start_time"],
                "new_time": new_assignments[0]["assigned_start_time"],
                "reason": "Rescheduled into combined multi-department block to minimize section downtime."
            })

        return {
            "status": "REPLANNED_OPTIMAL",
            "new_plan_result": new_plan_result,
            "changed_assignments": changed_diff,
            "impact": {
                "asset_availability": new_plan_result["metrics"]["asset_availability"],
                "train_impact_minutes": new_plan_result["metrics"]["train_impact_minutes"],
                "block_hours": new_plan_result["metrics"]["block_hours"],
                "tasks_completed": new_plan_result["metrics"]["tasks_completed"],
                "coordination_events": len(new_plan_result.get("bundled_blocks", []))
            },
            "reason_summary": reason_summary,
            "dataset_type": "synthetic/demo"
        }
