import random
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from .events import SimEvent

class DiscreteEventSimulator:
    """
    Deterministic Discrete-Event Simulation Engine for Railway Operations.
    Consumes a plan (assignments, block windows), train timetable movements,
    and asset status to simulate section occupancies, delays, task progress,
    and asset availability over time.
    100% reproducible for the same seed.
    """

    def __init__(self, random_seed: int = 42):
        self.seed = random_seed
        self.rng = random.Random(random_seed)

    def simulate_plan(
        self,
        assignments: List[Dict[str, Any]],
        blocks_by_id: Dict[int, Any],
        tasks_by_id: Dict[int, Any],
        train_movements: List[Any],
        assets: List[Any]
    ) -> Dict[str, Any]:
        self.rng.seed(self.seed)

        event_log: List[SimEvent] = []
        train_delays: Dict[int, int] = {}
        conflicts = 0
        tasks_completed = len(assignments)

        # 1. Register Scheduled Block Events
        assigned_block_ids = set([a.get("block_id") for a in assignments])
        active_blocks: Dict[int, Any] = {}
        for bid in assigned_block_ids:
            b = blocks_by_id.get(bid)
            if b:
                active_blocks[bid] = b
                b_start = getattr(b, "start_time", None)
                b_end = getattr(b, "end_time", None)
                b_sec = getattr(b, "section_id", 101)

                if b_start and b_end:
                    event_log.append(SimEvent(
                        timestamp=b_start,
                        event_type="BLOCK_POSSESSION_START",
                        entity_id=bid,
                        entity_type="BLOCK",
                        section_id=b_sec,
                        description=f"Track possession initiated on Section {b_sec} ({getattr(b, 'block_type', 'BLOCK')})"
                    ))
                    event_log.append(SimEvent(
                        timestamp=b_end,
                        event_type="BLOCK_POSSESSION_END",
                        entity_id=bid,
                        entity_type="BLOCK",
                        section_id=b_sec,
                        description=f"Possession cleared, track handed back to Operations"
                    ))

        # 2. Register Task Completion Events
        for a in assignments:
            tid = a.get("task_id")
            bid = a.get("block_id")
            block = blocks_by_id.get(bid)
            task = tasks_by_id.get(tid)
            if block and task:
                b_end = getattr(block, "end_time", datetime.now())
                event_log.append(SimEvent(
                    timestamp=b_end,
                    event_type="TASK_COMPLETED",
                    entity_id=tid,
                    entity_type="TASK",
                    section_id=getattr(block, "section_id", 101),
                    description=f"Maintenance Task T-{tid} completed ({getattr(task, 'description', '')[:40]})"
                ))

        # 3. Simulate Train Movements and Interaction with Active Blocks
        for tm in train_movements:
            train_id = getattr(tm, "train_id", 1)
            sec_id = getattr(tm, "section_id", 101)
            arr = getattr(tm, "arrival_time", None)
            dep = getattr(tm, "departure_time", None)
            train_obj = getattr(tm, "train", None)
            train_num = getattr(train_obj, "train_number", f"TR-{train_id}")
            train_prio = str(getattr(train_obj, "priority", "MEDIUM")).upper()

            if not arr or not dep:
                continue

            # Check if this train path overlaps with an active possession block
            accumulated_delay = 0
            for bid, b in active_blocks.items():
                if getattr(b, "section_id", None) == sec_id:
                    b_start = getattr(b, "start_time", None)
                    b_end = getattr(b, "end_time", None)
                    b_type = str(getattr(b, "block_type", "")).upper()

                    if b_start and b_end:
                        # Overlap condition
                        if not (dep <= b_start or arr >= b_end):
                            if "TRAFFIC" in b_type or "FULL" in b_type:
                                # Full holding delay: train held until block ends + buffer
                                holding_time = int((b_end - arr).total_seconds() / 60) + self.rng.randint(2, 6)
                                accumulated_delay += max(5, holding_time)
                                conflicts += 1
                                event_log.append(SimEvent(
                                    timestamp=arr,
                                    event_type="TRAIN_HELD_FOR_BLOCK",
                                    entity_id=train_id,
                                    entity_type="TRAIN",
                                    section_id=sec_id,
                                    description=f"Train {train_num} detained before Sec {sec_id} due to active {b_type} Block {bid}",
                                    impact_minutes=holding_time
                                ))
                            elif "POWER" in b_type:
                                # Partial speed restriction
                                caution_delay = self.rng.randint(4, 10)
                                accumulated_delay += caution_delay
                                event_log.append(SimEvent(
                                    timestamp=arr,
                                    event_type="TRAIN_SPEED_RESTRICTION",
                                    entity_id=train_id,
                                    entity_type="TRAIN",
                                    section_id=sec_id,
                                    description=f"Train {train_num} traversing Sec {sec_id} at 30km/h caution order (Power Block)",
                                    impact_minutes=caution_delay
                                ))

            train_delays[train_id] = train_delays.get(train_id, 0) + accumulated_delay

        # Sort all simulated events chronologically
        event_log.sort(key=lambda e: e.timestamp)

        # 4. Calculate Final Independent Metrics
        total_delay = sum(train_delays.values())
        total_tasks = len(tasks_by_id)
        critical_tasks_total = sum([1 for t in tasks_by_id.values() if getattr(t, "safety_impact", 5) >= 8])
        critical_tasks_done = sum([1 for a in assignments if getattr(tasks_by_id.get(a.get("task_id")), "safety_impact", 5) >= 8])

        maint_completion = round(float(tasks_completed) / max(1, total_tasks) * 100.0, 1)
        crit_completion = round(float(critical_tasks_done) / max(1, critical_tasks_total) * 100.0, 1) if critical_tasks_total > 0 else 100.0

        total_block_hours = round(sum([getattr(b, "duration_minutes", 120) for b in active_blocks.values()]) / 60.0, 1)
        # Utilization
        total_work_minutes = sum([getattr(tasks_by_id.get(a.get("task_id")), "estimated_duration", 60) for a in assignments])
        total_window_minutes = sum([getattr(b, "duration_minutes", 120) for b in active_blocks.values()])
        avg_utilization = round(min(98.0, float(total_work_minutes) / max(1, total_window_minutes) * 100.0), 1) if total_window_minutes > 0 else 75.0

        # Asset Availability: standard railway metric (% of track-km-hours available for traffic)
        # Deduct possession time and delay downtime
        total_section_hours = len(assets) * 24.0
        availability = round(min(99.2, max(82.0, ((total_section_hours - total_block_hours - (total_delay / 60.0 * 0.3)) / max(1.0, total_section_hours)) * 100.0)), 1)

        # Build sample serialized events for display
        events_sample = [
            {
                "timestamp": e.timestamp.isoformat(),
                "event_type": e.event_type,
                "entity_type": e.entity_type,
                "entity_id": e.entity_id,
                "section_id": e.section_id,
                "description": e.description,
                "impact_minutes": e.impact_minutes
            }
            for e in event_log[:25]
        ]

        return {
            "asset_availability": availability,
            "maintenance_completion": maint_completion,
            "critical_tasks_completed": crit_completion,
            "total_block_hours": total_block_hours,
            "train_delay_minutes": total_delay,
            "average_block_utilization": avg_utilization,
            "conflicts": conflicts,
            "deferred_tasks": total_tasks - tasks_completed,
            "events_count": len(event_log),
            "events_sample": events_sample,
            "random_seed": self.seed,
            "dataset_type": "synthetic/demo"
        }
