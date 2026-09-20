"""
AI/ML Criticality & Urgency Prioritization Engine
Calculates the Composite Criticality Index (CCI) combining:
1. Defect Severity (e.g., IMR rail fracture risk vs minor geometry slackness)
2. Component RAMS/RCM risk (Reliability, Availability, Maintainability, Safety)
3. Overdue Maintenance Days
4. Line Traffic Density in Gross Million Tonnes (GMT)
"""

from typing import Dict, Any, Optional, List

# Standard Defect Severity Matrix for Indian Railways
DEFECT_SEVERITY_BENCHMARKS = {
    # Civil / Track
    "IMR": {"severity": 10, "base_pts": 30, "label": "Immediate Removal (IMR) Rail Fracture Risk"},
    "IMRW": {"severity": 9, "base_pts": 28, "label": "IMR Weld Defect (High Failure Probability)"},
    "OBS": {"severity": 7, "base_pts": 20, "label": "Observed Defect (Periodic Testing Required)"},
    "GEOMETRY_SLACK": {"severity": 4, "base_pts": 10, "label": "Minor Track Geometry Slackness"},
    "BALLAST_DEFICIENCY": {"severity": 5, "base_pts": 12, "label": "Ballast Deficiency / Cushion Loss"},
    # S&T
    "POINT_MACHINE_FAILURE": {"severity": 9, "base_pts": 28, "label": "Point Machine Lock Detector Failure"},
    "TRACK_CIRCUIT_DROP": {"severity": 8, "base_pts": 25, "label": "Track Circuit False Drop / Axle Counter Fail"},
    "SIGNAL_LAMP_DEFECT": {"severity": 4, "base_pts": 10, "label": "Aspect Lamp Warning / LED Filament"},
    # Traction / OHE
    "CATENARY_PARTING": {"severity": 10, "base_pts": 30, "label": "OHE Catenary Wire Dropper Parting Risk"},
    "CONTACT_WIRE_THIN": {"severity": 8, "base_pts": 24, "label": "Contact Wire Diameter Below Condemning Limit"},
    "INSULATOR_FLASH": {"severity": 6, "base_pts": 16, "label": "Insulator Creepage & Flashover Risk"},
    # Bridges / BDMS
    "PIER_SCOUR_CRITICAL": {"severity": 10, "base_pts": 30, "label": "Bridge Pier Scour Depth Exceeded Safety Level"},
    "BEARING_SEIZURE": {"severity": 7, "base_pts": 20, "label": "Rocker/Roller Bearing Seizure"},
}

def calculate_composite_criticality_index(
    defect_severity: int = 5,             # 1-10 scale
    defect_code: Optional[str] = None,    # e.g. "IMR", "POINT_MACHINE_FAILURE"
    rams_rcm_risk: Optional[float] = None,# 0.0 - 1.0 (or 0-100 if > 1)
    days_overdue: int = 0,                # >= 0
    gmt_density: float = 45.0,            # Gross Million Tonnes per annum (typically 10 - 85 GMT)
    safety_impact: Optional[int] = None,  # 1-10 scale
    failure_probability: float = 0.5      # 0.0 - 1.0
) -> Dict[str, Any]:
    """
    Computes the standard Indian Railways Composite Criticality Index (CCI).
    Normalized strictly to 0 - 100.
    
    Formula:
    CCI = Defect_Severity_Score (max 30)
        + RAMS_RCM_Risk_Score (max 25)
        + Overdue_Penalty_Score (max 25)
        + Traffic_Density_GMT_Score (max 20)
    """
    # 1. Defect Severity Component (0 - 30 pts)
    benchmark = DEFECT_SEVERITY_BENCHMARKS.get(defect_code.upper()) if defect_code else None
    if benchmark:
        severity_pts = benchmark["base_pts"]
        eff_severity = benchmark["severity"]
    else:
        eff_severity = max(1, min(10, defect_severity))
        severity_pts = int(round(eff_severity / 10.0 * 30.0))

    # 2. Component RAMS/RCM Risk (0 - 25 pts)
    # If explicit rams_rcm_risk provided, use it; else compute from failure_probability and safety_impact
    if rams_rcm_risk is not None:
        norm_rams = rams_rcm_risk / 100.0 if rams_rcm_risk > 1.0 else rams_rcm_risk
    else:
        # Synthesize from safety impact and failure probability
        s_factor = (safety_impact or eff_severity) / 10.0
        norm_rams = (0.6 * failure_probability) + (0.4 * s_factor)

    norm_rams = max(0.0, min(1.0, norm_rams))
    rams_pts = int(round(norm_rams * 25.0))

    # 3. Overdue Maintenance Days Factor (0 - 25 pts)
    # Progressive non-linear penalty curve:
    # 0 days = 0 pts
    # 1-2 days = 8 pts
    # 3-7 days = 16 pts
    # >7 days = up to 25 pts
    if days_overdue <= 0:
        overdue_pts = 0
    elif days_overdue == 1:
        overdue_pts = 6
    elif days_overdue <= 3:
        overdue_pts = 12
    elif days_overdue <= 7:
        overdue_pts = 18
    elif days_overdue <= 14:
        overdue_pts = 22
    else:
        overdue_pts = 25

    # 4. Line Traffic Density in Gross Million Tonnes (GMT) (0 - 20 pts)
    # Group A Trunk Routes: >50 GMT (e.g. 60-80 GMT) -> 18-20 pts
    # Group B Mainlines: 30-50 GMT -> 12-17 pts
    # Feeder & Branch Lines: <30 GMT -> 4-11 pts
    clamped_gmt = max(5.0, min(90.0, gmt_density))
    gmt_pts = int(round((clamped_gmt / 85.0) * 20.0))
    gmt_pts = max(2, min(20, gmt_pts))

    total_cci = severity_pts + rams_pts + overdue_pts + gmt_pts
    total_cci = max(1, min(100, total_cci))

    # Urgency Level mapping
    if total_cci >= 80 or eff_severity >= 9:
        urgency_level = "CRITICAL_IMMEDIATE"
        max_deferral_hours = 12
    elif total_cci >= 60 or eff_severity >= 7:
        urgency_level = "HIGH_PRIORITY"
        max_deferral_hours = 36
    elif total_cci >= 40:
        urgency_level = "MEDIUM_ROUTINE"
        max_deferral_hours = 72
    else:
        urgency_level = "LOW_MONITORED"
        max_deferral_hours = 168

    reasons: List[str] = []
    if eff_severity >= 9 or (benchmark and "IMR" in defect_code.upper()):
        reasons.append("Catastrophic failure hazard (IMR / Rail fracture / Pier scour threshold exceeded)")
    elif eff_severity >= 7:
        reasons.append(f"Significant structural or interlocking integrity risk (Severity {eff_severity}/10)")

    if rams_pts >= 18:
        reasons.append(f"High RAMS/RCM risk profile: Elevated component MTBF degradation ({int(norm_rams * 100)}%)")

    if days_overdue > 0:
        reasons.append(f"Statutory maintenance inspection overdue by {days_overdue} day{'s' if days_overdue > 1 else ''}")

    if clamped_gmt >= 50.0:
        reasons.append(f"High-density traffic corridor ({clamped_gmt} GMT) with severe cascade delay exposure")

    if not reasons:
        reasons.append("Scheduled preventive asset renewal within safe operating parameters")

    return {
        "composite_criticality_index": total_cci,
        "urgency_level": urgency_level,
        "max_deferral_hours": max_deferral_hours,
        "breakdown": {
            "defect_severity_score": severity_pts,
            "rams_rcm_risk_score": rams_pts,
            "overdue_penalty_score": overdue_pts,
            "gmt_traffic_density_score": gmt_pts
        },
        "gmt_density": clamped_gmt,
        "effective_severity": eff_severity,
        "reasons": reasons,
        "summary": f"{urgency_level} (CCI {total_cci}/100): {reasons[0]}"
    }

# Backward compatibility wrapper
def calculate_task_criticality(
    safety_impact: int,
    failure_probability: float,
    asset_criticality: int,
    overdue_days: int,
    defect_severity: int,
    corridor_traffic_level: int = 3
) -> Dict[str, Any]:
    safety_pts = int(round(min(10, max(1, safety_impact)) / 10.0 * 30.0))
    fail_prob_pts = int(round(min(1.0, max(0.0, failure_probability)) * 25.0))
    asset_crit_pts = int(round(min(100, max(1, asset_criticality)) / 100.0 * 20.0))
    overdue_pts = int(round(min(10.0, max(0, overdue_days) * 1.5)))
    severity_pts = int(round(min(10, max(1, defect_severity)) / 10.0 * 10.0))
    op_pts = int(round(min(5, max(1, corridor_traffic_level)) / 5.0 * 5.0))

    total = safety_pts + fail_prob_pts + asset_crit_pts + overdue_pts + severity_pts + op_pts
    total = max(1, min(100, total))

    gmt = 15.0 * corridor_traffic_level
    cci_res = calculate_composite_criticality_index(
        defect_severity=defect_severity,
        rams_rcm_risk=failure_probability,
        days_overdue=overdue_days,
        gmt_density=gmt,
        safety_impact=safety_impact,
        failure_probability=failure_probability
    )

    return {
        "safety_impact": safety_pts,
        "failure_probability_score": fail_prob_pts,
        "asset_criticality_score": asset_crit_pts,
        "overdue_factor": overdue_pts,
        "defect_severity": severity_pts,
        "operational_impact": op_pts,
        "total_score": total,
        "composite_criticality_index": cci_res["composite_criticality_index"],
        "formula": "safety(30) + failure_prob(25) + asset_crit(20) + overdue(10) + severity(10) + op_impact(5)",
        "cci_details": cci_res
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
    metrics = calculate_task_criticality(
        safety_impact=safety_impact,
        failure_probability=failure_probability,
        asset_criticality=asset_criticality,
        overdue_days=overdue_days,
        defect_severity=defect_severity,
        corridor_traffic_level=corridor_traffic_level
    )
    score = metrics["total_score"]

    if score >= 75 or safety_impact >= 8 or defect_severity >= 9:
        level = "CRITICAL"
    elif score >= 55 or safety_impact >= 6 or defect_severity >= 6:
        level = "HIGH"
    elif score >= 35:
        level = "MEDIUM"
    else:
        level = "LOW"

    reasons = metrics["cci_details"]["reasons"]
    if train_conflict_detected:
        reasons.append("Direct timetable overlap with scheduled train movement")

    return {
        "priority_level": level,
        "score": score,
        "composite_criticality_index": score,
        "reasons": reasons,
        "summary": f"{level}: {reasons[0]}" if reasons else level,
        "metrics": metrics,
        "urgency_level": metrics["cci_details"]["urgency_level"]
    }
