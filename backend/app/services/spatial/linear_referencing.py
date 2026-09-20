"""
Linear Referencing System (LRS) & Spatial Harmonization Engine
Standardizes Section, Line ID, Km/Chainage, and Track ID across all departments
(Civil/TMS, S&T/SMMS, Traction/TDMS, Bridges/BDMS, Traffic/COA).
Automatically identifies spatial overlaps and shadowing opportunities.
"""

from typing import Dict, Any, List, Optional, Tuple
import re

class LinearReferencingService:
    """
    Standardizes linear referencing across Indian Railways engineering departments.
    """

    # Default corridor chainage boundaries for demonstration
    CORRIDOR_SECTIONS = {
        1: [
            {"section_id": 1, "section_code": "C1-01", "name": "Salem Jn – Sankari Durg", "start_km": 0.0, "end_km": 34.5},
            {"section_id": 2, "section_code": "C1-02", "name": "Sankari Durg – Erode Jn", "start_km": 34.5, "end_km": 59.8},
        ],
        2: [
            {"section_id": 1, "section_code": "C2-01", "name": "Erode Jn – Uttukuli", "start_km": 0.0, "end_km": 40.0},
            {"section_id": 2, "section_code": "C2-02", "name": "Uttukuli – Tiruppur", "start_km": 40.0, "end_km": 72.5},
            {"section_id": 3, "section_code": "C2-03", "name": "Tiruppur – Somanur", "start_km": 72.5, "end_km": 110.0},
            {"section_id": 4, "section_code": "C2-04", "name": "Somanur – Coimbatore Jn", "start_km": 110.0, "end_km": 149.5},
        ],
        3: [
            {"section_id": 1, "section_code": "C3-01", "name": "Coimbatore – Podanur Jn", "start_km": 0.0, "end_km": 15.0},
            {"section_id": 2, "section_code": "C3-02", "name": "Podanur Jn – Palakkad Jn", "start_km": 15.0, "end_km": 65.0},
        ]
    }

    # Standard Track IDs
    VALID_TRACK_IDS = ["UP_MAIN", "DN_MAIN", "UP_FAST", "DN_FAST", "GOODS_LOOP", "LOOP_1", "SIDING"]

    @classmethod
    def parse_chainage(cls, raw_location: str, default_start_km: float = 40.0) -> Tuple[float, float]:
        """
        Parses free-form location text like:
        - 'KM 42.8' -> (42.8, 43.8)
        - 'KM 120/400 - 130/200' -> (120.4, 130.2)
        - 'KM 120 - 130' -> (120.0, 130.0)
        - 'Section C2-02 (KM 42.8)' -> (42.8, 43.8)
        """
        if not raw_location:
            return (default_start_km, default_start_km + 1.0)

        # 1. Explicit KM range: KM X/A - Y/B or KM X - Y
        range_match = re.search(r'KM\s*(\d+(?:[./]\d+)?)\s*(?:-|to)\s*(\d+(?:[./]\d+)?)', raw_location, re.IGNORECASE)
        if range_match:
            try:
                s = float(range_match.group(1).replace('/', '.'))
                e = float(range_match.group(2).replace('/', '.'))
                if e < s:
                    s, e = e, s
                if abs(e - s) < 0.05:
                    e = s + 1.0
                return (round(s, 3), round(e, 3))
            except ValueError:
                pass

        # 2. Explicit KM single point e.g. KM 42.8
        single_match = re.search(r'KM\s*(\d+(?:[./]\d+)?)', raw_location, re.IGNORECASE)
        if single_match:
            try:
                p = float(single_match.group(1).replace('/', '.'))
                return (round(p, 3), round(p + 1.0, 3))
            except ValueError:
                pass

        # 3. Fallback generic range match if no KM prefix found
        fallback_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:-|to)\s*(\d+(?:\.\d+)?)', raw_location, re.IGNORECASE)
        if fallback_match:
            try:
                s = float(fallback_match.group(1))
                e = float(fallback_match.group(2))
                if e < s:
                    s, e = e, s
                if abs(e - s) < 0.05:
                    e = s + 1.0
                return (round(s, 3), round(e, 3))
            except ValueError:
                pass

        return (default_start_km, default_start_km + 1.0)

    @classmethod
    def format_chainage(cls, start_km: float, end_km: float) -> str:
        s_km = int(start_km)
        s_m = int(round((start_km - s_km) * 1000))
        e_km = int(end_km)
        e_m = int(round((end_km - e_km) * 1000))
        return f"KM {s_km}/{s_m:03d} – {e_km}/{e_m:03d}"

    @classmethod
    def calculate_spatial_overlap(
        cls,
        start_a: float,
        end_a: float,
        start_b: float,
        end_b: float,
        safety_buffer_km: float = 0.5
    ) -> Dict[str, Any]:
        """
        Computes physical overlap between two linear chainage segments,
        including whether they fall within a contiguous shadowing safety buffer.
        """
        overlap_start = max(start_a, start_b)
        overlap_end = min(end_a, end_b)
        direct_overlap_km = max(0.0, overlap_end - overlap_start)

        # Proximity overlap with safety buffer
        buffered_start = max(start_a - safety_buffer_km, start_b - safety_buffer_km)
        buffered_end = min(end_a + safety_buffer_km, end_b + safety_buffer_km)
        proximity_overlap_km = max(0.0, buffered_end - buffered_start)

        is_overlapping = direct_overlap_km > 0.001
        is_shadow_candidate = proximity_overlap_km > 0.001

        return {
            "is_overlapping": is_overlapping,
            "direct_overlap_km": round(direct_overlap_km, 3),
            "is_shadow_candidate": is_shadow_candidate,
            "proximity_overlap_km": round(proximity_overlap_km, 3),
            "overlap_start_km": round(overlap_start, 3) if is_overlapping else None,
            "overlap_end_km": round(overlap_end, 3) if is_overlapping else None,
            "combined_span_km": round(max(end_a, end_b) - min(start_a, start_b), 3)
        }

    @classmethod
    def harmonize_record(cls, raw: Dict[str, Any], default_corridor_id: int = 2) -> Dict[str, Any]:
        """
        Converts any department raw record into a standardized Linear Referencing Record.
        """
        corr_id = raw.get("corridor_id") or default_corridor_id
        sec_id = raw.get("section_id") or 2
        sec_code = raw.get("section_code") or f"C{corr_id}-{sec_id:02d}"

        raw_loc = raw.get("location") or raw.get("location_name") or raw.get("chainage_str") or ""
        start_km = raw.get("start_km")
        end_km = raw.get("end_km")

        if start_km is None or end_km is None:
            parsed_s, parsed_e = cls.parse_chainage(raw_loc, default_start_km=42.0)
            start_km = start_km if start_km is not None else parsed_s
            end_km = end_km if end_km is not None else parsed_e

        line_id = raw.get("line_id") or f"MAIN_LINE_{corr_id}"
        track_id = raw.get("track_id") or ("DN_MAIN" if corr_id == 2 else "UP_MAIN")
        if track_id not in cls.VALID_TRACK_IDS:
            track_id = "DN_MAIN"

        chainage_str = cls.format_chainage(start_km, end_km)

        return {
            "id": raw.get("defect_id") or raw.get("task_id") or f"DEF-{start_km}",
            "department": raw.get("department", "Track"),
            "corridor_id": corr_id,
            "section_id": sec_id,
            "section_code": sec_code,
            "line_id": line_id,
            "track_id": track_id,
            "start_km": round(start_km, 3),
            "end_km": round(end_km, 3),
            "length_km": round(max(0.1, end_km - start_km), 3),
            "chainage_str": chainage_str,
            "defect_type": raw.get("defect_type") or raw.get("description", "Maintenance Required"),
            "severity": raw.get("severity", 5),
            "estimated_duration": raw.get("estimated_duration", 60),
            "required_block_type": raw.get("required_block_type", "FULL_BLOCK"),
            "requires_power_block": raw.get("requires_power_block", False),
            "days_overdue": raw.get("days_overdue", 0),
            "raw_payload": raw
        }

    @classmethod
    def detect_all_spatial_clusters(
        cls,
        records: List[Dict[str, Any]],
        safety_buffer_km: float = 2.0
    ) -> List[Dict[str, Any]]:
        """
        Groups cross-departmental records by corridor, track, and overlapping chainage buffer.
        """
        clusters: List[Dict[str, Any]] = []
        visited = set()

        for i, r1 in enumerate(records):
            if i in visited:
                continue

            current_cluster = [r1]
            visited.add(i)

            c_min = r1["start_km"]
            c_max = r1["end_km"]
            c_corr = r1["corridor_id"]
            c_track = r1["track_id"]

            for j, r2 in enumerate(records):
                if j in visited:
                    continue

                if r2["corridor_id"] == c_corr and r2["track_id"] == c_track:
                    overlap_info = cls.calculate_spatial_overlap(
                        c_min, c_max,
                        r2["start_km"], r2["end_km"],
                        safety_buffer_km=safety_buffer_km
                    )
                    if overlap_info["is_shadow_candidate"]:
                        current_cluster.append(r2)
                        visited.add(j)
                        c_min = min(c_min, r2["start_km"])
                        c_max = max(c_max, r2["end_km"])

            depts = list(set(r["department"] for r in current_cluster))
            clusters.append({
                "cluster_id": f"CLUST-KM-{int(c_min)}-{int(c_max)}",
                "corridor_id": c_corr,
                "track_id": c_track,
                "start_km": round(c_min, 3),
                "end_km": round(c_max, 3),
                "span_km": round(c_max - c_min, 3),
                "chainage_str": cls.format_chainage(c_min, c_max),
                "departments": depts,
                "is_multi_department": len(depts) >= 2,
                "task_count": len(current_cluster),
                "tasks": current_cluster,
                "total_separate_duration": sum(r["estimated_duration"] for r in current_cluster),
                "recommended_joint_block_duration": max(r["estimated_duration"] for r in current_cluster) + 30
            })

        return clusters
