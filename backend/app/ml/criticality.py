from typing import Dict, Any, Optional

def calculate_task_criticality(
    safety_impact: int,               # 1-10 scale
    failure_probability: float,       # 0.0 - 1.0
    asset_criticality: int,           # 1-100 scale
    overdue_days: int,                # days >= 0
    defect_severity: int,             # 1-10 scale
    corridor_traffic_level: int = 3   # 1-5 scale
) -> Dict[str, Any]:
    """
    Transparent, explainable ML/Operations criticality scoring formula.
    Normalized strictly to 0 - 100.
    
    Components:
    - Safety Impact: up to 30 pts (safety_impact / 10 * 30)
    - Failure Probability: up to 25 pts (failure_probability * 25)
    - Asset Criticality: up to 20 pts (asset_criticality / 100 * 20)
    - Overdue Factor: up to 10 pts (min(10, overdue_days * 1.5))
    - Defect Severity: up to 10 pts (defect_severity / 10 * 10)
    - Operational Impact: up to 5 pts (corridor_traffic_level / 5 * 5)
    """
    safety_pts = int(round(min(10, max(1, safety_impact)) / 10.0 * 30.0))
    fail_prob_pts = int(round(min(1.0, max(0.0, failure_probability)) * 25.0))
    asset_crit_pts = int(round(min(100, max(1, asset_criticality)) / 100.0 * 20.0))
    overdue_pts = int(round(min(10.0, max(0, overdue_days) * 1.5)))
    severity_pts = int(round(min(10, max(1, defect_severity)) / 10.0 * 10.0))
    op_pts = int(round(min(5, max(1, corridor_traffic_level)) / 5.0 * 5.0))

    total = safety_pts + fail_prob_pts + asset_crit_pts + overdue_pts + severity_pts + op_pts
    total = max(1, min(100, total))

    return {
        "safety_impact": safety_pts,
        "failure_probability_score": fail_prob_pts,
        "asset_criticality_score": asset_crit_pts,
        "overdue_factor": overdue_pts,
        "defect_severity": severity_pts,
        "operational_impact": op_pts,
        "total_score": total,
        "formula": "safety(30) + failure_prob(25) + asset_crit(20) + overdue(10) + severity(10) + op_impact(5)"
    }

def get_explainable_priority(
    safety_impact: int,
    failure_probability: float = 0.5,
    asset_criticality: int = 70,
    overdue_days: int = 0,
    defect_severity: int = 5,
    corridor_traffic_level: int = 3,
    train_conflict_detected: bool = False
) -> Dict[str, Any]:
    """
    Returns explainable railway maintenance priority:
    CRITICAL, HIGH, MEDIUM, LOW with transparent, documented reasons.
    """
    metrics = calculate_task_criticality(
        safety_impact=safety_impact,
        failure_probability=failure_probability,
        asset_criticality=asset_criticality,
        overdue_days=overdue_days,
        defect_severity=defect_severity,
        corridor_traffic_level=corridor_traffic_level
    )
    score = metrics["total_score"]

    reasons = []
    if safety_impact >= 8:
        reasons.append(f"High safety impact (Severity {safety_impact}/10)")
    elif safety_impact >= 6:
        reasons.append(f"Elevated safety risk (Severity {safety_impact}/10)")

    if failure_probability >= 0.7:
        reasons.append(f"Active asset degradation / high failure probability ({int(failure_probability * 100)}%)")
    elif failure_probability >= 0.4:
        reasons.append("Progressive mechanical/electrical wear detected")

    if overdue_days > 0:
        reasons.append(f"Maintenance overdue by {overdue_days} day{'s' if overdue_days > 1 else ''}")

    if defect_severity >= 8:
        reasons.append("Track or signalling structural integrity threshold exceeded")

    if corridor_traffic_level >= 4:
        reasons.append("Heavy passenger corridor with potential cascade operation disruption")

    if train_conflict_detected:
        reasons.append("Direct timetable overlap with scheduled train movement")

    if not reasons:
        reasons.append("Routine preventive maintenance inspection")

    # Priority determination
    if score >= 75 or safety_impact >= 8 or defect_severity >= 9:
        level = "CRITICAL"
    elif score >= 55 or safety_impact >= 6 or defect_severity >= 6:
        level = "HIGH"
    elif score >= 35:
        level = "MEDIUM"
    else:
        level = "LOW"

    return {
        "priority_level": level,
        "score": score,
        "reasons": reasons,
        "summary": f"{level}: {reasons[0]}" if reasons else level,
        "metrics": metrics
    }

