"""
BDMS — Bridge Database Management System Mock Data Provider
Simulates railway bridge asset monitoring, structural inspections, underwater scour monitoring,
bearing lubrication, expansion joint clearances, and bridge superstructure maintenance.
"""

from typing import List, Dict, Any

BDMS_DEFECTS: List[Dict[str, Any]] = [
    {
        "defect_id": "BDMS-DEF-301",
        "bridge_no": "BR-142",
        "bridge_name": "Cauvery River Major Bridge",
        "bridge_type": "Steel Girder (12 Spans x 30.5m)",
        "corridor_id": 2,
        "section_id": 2,
        "section_code": "C2-02",
        "line_id": "MAIN_LINE_2",
        "track_id": "DN_MAIN",
        "start_km": 44.200,
        "end_km": 44.600,
        "chainage_str": "KM 44/200 - 44/600",
        "department": "BDMS",
        "defect_type": "Pier Scour & Underwater Foundation Alert",
        "severity": 9,
        "rams_risk_score": 28,
        "gmt_density": 68.5,
        "estimated_duration": 180,
        "required_block_type": "FULL_BLOCK",
        "requires_power_block": True,
        "status": "URGENT",
        "days_overdue": 3,
        "description": "Underwater ultrasonic sensor indicates Pier P-4 scour depth exceeded safety margin. Immediate boulder pitching and diver inspection required.",
        "compatible_departments": ["Track", "S&T", "Traction"],
        "shadow_recommended": True
    },
    {
        "defect_id": "BDMS-DEF-302",
        "bridge_no": "BR-148",
        "bridge_name": "Bhavani River Viaduct",
        "bridge_type": "Pre-stressed Concrete Girder",
        "corridor_id": 2,
        "section_id": 2,
        "section_code": "C2-02",
        "line_id": "MAIN_LINE_2",
        "track_id": "UP_MAIN",
        "start_km": 48.100,
        "end_km": 48.350,
        "chainage_str": "KM 48/100 - 48/350",
        "department": "BDMS",
        "defect_type": "Expansion Joint Seizure & Bearing Displacement",
        "severity": 7,
        "rams_risk_score": 22,
        "gmt_density": 68.5,
        "estimated_duration": 120,
        "required_block_type": "PARTIAL_BLOCK",
        "requires_power_block": False,
        "status": "PENDING",
        "days_overdue": 1,
        "description": "Elastomeric bearing displacement on Abutment A2 exceeding permissible limits (+18mm). Jacking and bearing alignment required.",
        "compatible_departments": ["Track"],
        "shadow_recommended": True
    },
    {
        "defect_id": "BDMS-DEF-303",
        "bridge_no": "BR-088",
        "bridge_name": "Railway Over Bridge ROB-88",
        "bridge_type": "Steel Composite Truss",
        "corridor_id": 1,
        "section_id": 1,
        "section_code": "C1-01",
        "line_id": "MAIN_LINE_1",
        "track_id": "UP_FAST",
        "start_km": 22.400,
        "end_km": 22.550,
        "chainage_str": "KM 22/400 - 22/550",
        "department": "BDMS",
        "defect_type": "Superstructure Anti-Corrosion Painting & Rivet Tightening",
        "severity": 5,
        "rams_risk_score": 14,
        "gmt_density": 54.0,
        "estimated_duration": 150,
        "required_block_type": "POWER_BLOCK",
        "requires_power_block": True,
        "status": "SCHEDULED",
        "days_overdue": 0,
        "description": "Routine structural corrosion treatment and ultrasonic rivet testing over electrified 25kV catenary span.",
        "compatible_departments": ["Traction", "Track"],
        "shadow_recommended": True
    }
]

class BDMSProvider:
    """Deterministic BDMS data provider."""

    @classmethod
    def get_defects(cls) -> List[Dict[str, Any]]:
        return list(BDMS_DEFECTS)

    @classmethod
    def get_bridge_by_id(cls, bridge_no: str) -> Dict[str, Any]:
        for d in BDMS_DEFECTS:
            if d.get("bridge_no") == bridge_no:
                return d
        return BDMS_DEFECTS[0]

def get_bdms_defects() -> List[Dict[str, Any]]:
    return BDMSProvider.get_defects()
