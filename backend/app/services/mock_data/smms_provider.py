"""
SMMS — Signalling Maintenance & Management System Mock Data Provider
Deterministic signalling equipment data simulating integration with a real SMMS.
"""

SMMS_DEFECTS = [
    {
        "equipment_id": "SMMS-AXC-018",
        "asset_type": "Axle Counter",
        "department": "SMMS",
        "location": "C2 / KM 90.400",
        "section": "C2",
        "error_code": "AXC-ERR-04",
        "telemetry_alarm": "Detection Failure",
        "detection_date": "2026-09-18",
        "sla_due_date": "2026-09-18",
        "testing_schedule": "Immediate",
        "estimated_disconnection_minutes": 45,
        "asset_availability": "Available for maintenance",
        "severity": 8,
        "safety_impact": 9,
        "estimated_duration_minutes": 60,
        "required_block_type": "SIGNALLING_BLOCK",
        "maintenance_requirement": "Axle counter reset, sensor replacement and track clear verification",
    },
    {
        "equipment_id": "SMMS-PM-042",
        "asset_type": "Point Machine",
        "department": "SMMS",
        "location": "C1 / KM 126.100",
        "section": "C1",
        "error_code": "PM-ERR-02",
        "telemetry_alarm": "Incomplete Stroke",
        "detection_date": "2026-09-17",
        "sla_due_date": "2026-09-19",
        "testing_schedule": "Within 24 hours",
        "estimated_disconnection_minutes": 30,
        "asset_availability": "Available for maintenance",
        "severity": 7,
        "safety_impact": 8,
        "estimated_duration_minutes": 45,
        "required_block_type": "SIGNALLING_BLOCK",
        "maintenance_requirement": "Point machine motor replacement and stroke adjustment",
    },
    {
        "equipment_id": "SMMS-ILC-007",
        "asset_type": "Interlocking Circuit",
        "department": "SMMS",
        "location": "C3 / KM 58.200",
        "section": "C3",
        "error_code": "ILC-ERR-01",
        "telemetry_alarm": "Relay Failure",
        "detection_date": "2026-09-16",
        "sla_due_date": "2026-09-20",
        "testing_schedule": "Scheduled test window",
        "estimated_disconnection_minutes": 90,
        "asset_availability": "Available for maintenance",
        "severity": 6,
        "safety_impact": 7,
        "estimated_duration_minutes": 90,
        "required_block_type": "SIGNALLING_BLOCK",
        "maintenance_requirement": "Relay replacement and interlocking circuit verification",
    },
    {
        "equipment_id": "SMMS-SL-015",
        "asset_type": "Signal Lamp",
        "department": "SMMS",
        "location": "C2 / KM 92.600",
        "section": "C2",
        "error_code": "SL-ERR-03",
        "telemetry_alarm": "Lamp Dim / Aspect Failure",
        "detection_date": "2026-09-17",
        "sla_due_date": "2026-09-19",
        "testing_schedule": "Within 48 hours",
        "estimated_disconnection_minutes": 15,
        "asset_availability": "Available for maintenance",
        "severity": 5,
        "safety_impact": 6,
        "estimated_duration_minutes": 30,
        "required_block_type": "PARTIAL_BLOCK",
        "maintenance_requirement": "Signal lamp replacement and aspect verification",
    },
]


class SMMSProvider:
    """Deterministic SMMS data provider."""

    @staticmethod
    def get_defects():
        return SMMS_DEFECTS

    @staticmethod
    def get_all():
        return {"defects": SMMS_DEFECTS}

    @staticmethod
    def get_defect_by_id(equipment_id: str):
        for d in SMMS_DEFECTS:
            if d["equipment_id"] == equipment_id:
                return d
        return None


def get_smms_defects():
    return SMMSProvider.get_defects()
