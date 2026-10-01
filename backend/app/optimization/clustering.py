"""
Shadowing & Combined Maintenance Clustering Engine
Identifies spatial and temporal overlaps across railway departments
(Track/Permanent Way, Signalling & Interlocking, Traction/OHE, and Bridges).
Automatically clubs adjacent/co-located tasks into joint maintenance possession windows.
"""

from typing import List, Dict, Any, Tuple
from ..services.spatial.linear_referencing import LinearReferencingService

class MaintenanceClusteringEngine:
    """
    Railway Multi-Department Shadowing & Bundling Optimizer.
    """

    @classmethod
    def identify_shadow_clusters(
        cls,
        tasks: List[Any],
        shadow_buffer_km: float = 2.5
    ) -> List[Dict[str, Any]]:
        """
        Scans tasks across engineering departments and identifies:
        - Primary Possession Anchor (usually Track/Civil or Bridge demanding full traffic block)
        - Shadowing Tasks (S&T, Traction, Bridge tasks located within shadow_buffer_km)
        """
        # Normalize tasks to standardized spatial objects
        spatial_tasks = []
        for t in tasks:
            is_d = isinstance(t, dict)
            t_id = getattr(t, "task_id", None) or (t.get("task_id") or t.get("id") if is_d else None)
            dept = getattr(t, "department", None) or (t.get("department", "Track") if is_d else "Track")
            corr_id = getattr(t, "corridor_id", None) or (t.get("corridor_id") if is_d else None) or (getattr(getattr(t, "asset", None), "corridor_id", 2) if hasattr(t, "asset") else 2)
            sec_id = getattr(t, "section_id", None) or (t.get("section_id") if is_d else None) or 2
            dur = getattr(t, "estimated_duration", None) or (t.get("estimated_duration", 60) if is_d else 60)
            desc = getattr(t, "description", None) or (t.get("description", "") if is_d else "")
            prio = getattr(t, "priority_score", None) or (t.get("priority_score", 50) if is_d else 50)
            loc = getattr(t, "location_name", None) or (t.get("location_name") if is_d else None) or getattr(getattr(t, "asset", None), "location", "")

            s_km, e_km = LinearReferencingService.parse_chainage(loc or "", default_start_km=42.0)

            spatial_tasks.append({
                "task_id": t_id,
                "task_ref": getattr(t, "reference_no", None) or f"TASK-{t_id}",
                "department": dept,
                "corridor_id": corr_id,
                "section_id": sec_id,
                "start_km": s_km,
                "end_km": e_km,
                "duration_minutes": dur,
                "description": desc,
                "priority_score": prio,
                "raw_task": t
            })

        # Find Anchor tasks (Civil/Track or Bridges with highest duration / impact)
        clusters = []
        assigned_task_ids = set()

        # Sort tasks by duration and severity descending to select natural cluster anchors
        sorted_tasks = sorted(
            spatial_tasks,
            key=lambda x: (1 if x["department"] in ["Track", "Engineering", "Bridges", "BDMS"] else 0, x["duration_minutes"]),
            reverse=True
        )

        for anchor in sorted_tasks:
            a_id = anchor["task_id"]
            if a_id in assigned_task_ids:
                continue

            cluster_tasks = [anchor]
            assigned_task_ids.add(a_id)

            a_corr = anchor["corridor_id"]
            a_s = anchor["start_km"]
            a_e = anchor["end_km"]

            for other in sorted_tasks:
                o_id = other["task_id"]
                if o_id in assigned_task_ids or other["corridor_id"] != a_corr:
                    continue

                # Check if other task is within shadow buffer
                overlap_info = LinearReferencingService.calculate_spatial_overlap(
                    a_s, a_e,
                    other["start_km"], other["end_km"],
                    safety_buffer_km=shadow_buffer_km
                )

                if overlap_info["is_shadow_candidate"]:
                    cluster_tasks.append(other)
                    assigned_task_ids.add(o_id)
                    a_s = min(a_s, other["start_km"])
                    a_e = max(a_e, other["end_km"])

            depts = list(set(ct["department"] for ct in cluster_tasks))
            separate_durs = [ct["duration_minutes"] for ct in cluster_tasks]
            total_separate = sum(separate_durs)

            # Combined duration: maximum single task duration + 20-30 min safety buffer for multi-crew clearance
            joint_duration = max(separate_durs) + (25 if len(cluster_tasks) > 1 else 0)
            saved_downtime = max(0, total_separate - joint_duration)

            clusters.append({
                "cluster_id": f"SHADOW-C{a_corr}-{int(a_s)}-{int(a_e)}",
                "corridor_id": a_corr,
                "section_id": anchor["section_id"],
                "anchor_task_id": a_id,
                "anchor_department": anchor["department"],
                "start_km": a_s,
                "end_km": a_e,
                "chainage_str": LinearReferencingService.format_chainage(a_s, a_e),
                "tasks_count": len(cluster_tasks),
                "departments": depts,
                "is_multi_department": len(depts) >= 2,
                "tasks": cluster_tasks,
                "separate_duration_minutes": total_separate,
                "joint_possession_minutes": joint_duration,
                "saved_downtime_minutes": saved_downtime,
                "efficiency_gain_percent": round((saved_downtime / max(1, total_separate)) * 100, 1)
            })

        return clusters
