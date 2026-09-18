"""
TMS — Track Management System Mock Data Provider
Deterministic defect data simulating integration with a real TMS.
"""

TMS_DEFECTS = [
    {
        "defect_id": "TMS-DEF-1042",
        "defect_type": "Rail Fracture",
        "department": "TMS",
        "detection_date": "2026-09-18",
        "sla_due_date": "2026-09-18",
        "speed_restriction_kmh": 30,
        "location": "C1 / KM 124.600",
        "section": "C1",
        "line_type": "Up Main",
        "km_start": 124.580,
        "km_end": 124.620,
        "maintenance_requirement": "Emergency rail replacement and thermit welding",
        "asset_status": "Defective",
        "severity": 9,
        "safety_impact": 9,
        "estimated_duration_minutes": 90,
        "required_block_type": "FULL_BLOCK",
    },
    {
        "defect_id": "TMS-DEF-1043",
        "defect_type": "IMR Weld Defect",
        "department": "TMS",
        "detection_date": "2026-09-17",
        "sla_due_date": "2026-09-19",
        "speed_restriction_kmh": 50,
        "location": "C2 / KM 88.200",
        "section": "C2",
        "line_type": "Down Main",
        "km_start": 88.180,
        "km_end": 88.230,
        "maintenance_requirement": "Weld grinding and ultrasonic testing",
        "asset_status": "Defective",
        "severity": 7,
        "safety_impact": 7,
        "estimated_duration_minutes": 60,
        "required_block_type": "FULL_BLOCK",
    },
    {
        "defect_id": "TMS-DEF-1044",
        "defect_type": "Ballast Washout",
        "department": "TMS",
        "detection_date": "2026-09-16",
        "sla_due_date": "2026-09-20",
        "speed_restriction_kmh": 40,
        "location": "C3 / KM 56.400",
        "section": "C3",
        "line_type": "Up Main",
        "km_start": 56.350,
        "km_end": 56.500,
        "maintenance_requirement": "Ballast replenishment and tamping",
        "asset_status": "Degraded",
        "severity": 6,
        "safety_impact": 5,
        "estimated_duration_minutes": 120,
        "required_block_type": "FULL_BLOCK",
    },
    {
        "defect_id": "TMS-DEF-1045",
        "defect_type": "Slack Gauge",
        "department": "TMS",
        "detection_date": "2026-09-15",
        "sla_due_date": "2026-09-21",
        "speed_restriction_kmh": 60,
        "location": "C1 / KM 131.800",
        "section": "C1",
        "line_type": "Down Main",
        "km_start": 131.780,
        "km_end": 131.850,
        "maintenance_requirement": "Gauge correction with gauge tie plates",
        "asset_status": "Defective",
        "severity": 5,
        "safety_impact": 6,
        "estimated_duration_minutes": 45,
        "required_block_type": "PARTIAL_BLOCK",
    },
]

TMS_OVERDUE_MAINTENANCE = [
    {
        "task_id": "TMS-OD-201",
        "task_type": "Overdue Track Tamping",
        "department": "TMS",
        "section": "C2",
        "location": "C2 / KM 85.000–87.000",
        "km_start": 85.0,
        "km_end": 87.0,
        "last_tamping_date": "2026-06-12",
        "due_date": "2026-09-12",
        "overdue_days": 6,
        "estimated_duration_minutes": 180,
        "required_block_type": "FULL_BLOCK",
        "severity": 6,
        "safety_impact": 5,
    },
    {
        "task_id": "TMS-OD-202",
        "task_type": "Track Renewal Section",
        "department": "TMS",
        "section": "C4",
        "location": "C4 / KM 142.000–143.500",
        "km_start": 142.0,
        "km_end": 143.5,
        "last_renewal_date": "2019-03-20",
        "due_date": "2026-09-01",
        "overdue_days": 17,
        "estimated_duration_minutes": 480,
        "required_block_type": "FULL_BLOCK",
        "severity": 7,
        "safety_impact": 7,
    },
]


class TMSProvider:
    """Deterministic TMS data provider."""

    @staticmethod
    def get_defects():
        return TMS_DEFECTS

    @staticmethod
    def get_overdue_maintenance():
        return TMS_OVERDUE_MAINTENANCE

    @staticmethod
    def get_all():
        return {
            "defects": TMS_DEFECTS,
            "overdue_maintenance": TMS_OVERDUE_MAINTENANCE,
        }

    @staticmethod
    def get_defect_by_id(defect_id: str):
        for d in TMS_DEFECTS:
            if d["defect_id"] == defect_id:
                return d
        return None


def get_tms_defects():
    return TMSProvider.get_defects()
