from typing import List, Dict, Any

class MultiDepartmentBundler:
    """
    Detects cross-department coordination opportunities:
    Track (Engineering) + S&T (Signalling) + Traction Distribution (Electrical).
    Computes genuine possession minutes and train delay savings.
    """

    @staticmethod
    def evaluate_coordination(assignments: List[Dict[str, Any]], blocks_by_id: Dict[int, Any]) -> Dict[str, Any]:
        block_dept_map: Dict[int, Dict[str, List[Dict[str, Any]]]] = {}

        for a in assignments:
            b_id = a.get("block_id")
            dept = a.get("department", "OTHER")
            if b_id not in block_dept_map:
                block_dept_map[b_id] = {}
            block_dept_map[b_id].setdefault(dept, []).append(a)

        combined_events = []
        total_separate_minutes = 0
        total_combined_minutes = 0
        total_saved_minutes = 0

        for b_id, depts in block_dept_map.items():
            if len(depts) >= 2:
                block = blocks_by_id.get(b_id)
                actual_block_dur = getattr(block, "duration_minutes", 120) if block else 120

                # Sum separate task durations
                all_tasks = [task for task_list in depts.values() for task in task_list]
                separate_time = sum([t.get("duration_minutes", 60) for t in all_tasks])

                saved = max(0, separate_time - actual_block_dur)
                total_separate_minutes += separate_time
                total_combined_minutes += actual_block_dur
                total_saved_minutes += saved

                combined_events.append({
                    "block_id": b_id,
                    "departments": list(depts.keys()),
                    "tasks_count": len(all_tasks),
                    "separate_minutes": separate_time,
                    "combined_minutes": actual_block_dur,
                    "saved_minutes": saved,
                    "utilization_boost": round(min(98.0, float(separate_time) / actual_block_dur * 100.0), 1)
                })

        return {
            "combined_events_count": len(combined_events),
            "combined_blocks": combined_events,
            "total_separate_minutes": total_separate_minutes,
            "total_combined_minutes": total_combined_minutes,
            "total_saved_minutes": total_saved_minutes,
            "total_saved_hours": round(total_saved_minutes / 60.0, 1),
            "dataset_type": "synthetic/demo"
        }
