"""
TDMS — Traction Distribution Management System Mock Data Provider
Deterministic OHE/electrical defect data simulating integration with a real TDMS.
Power isolation constraints are modeled as operational constraints affecting larger sections.
"""

TDMS_DEFECTS = [
    {
        "defect_id": "TDMS-OHE-004",
        "asset_type": "Contact Wire",
        "department": "TDMS",
        "mast_number": "M-124/18",
        "location": "C1 / KM 124.800",
        "section": "C1",
        "defect_classification": "Contact Wire Wear",
        "switching_station": "SS-Salem-North",
        "substation": "TSS-Salem",
        "feeding_post_jurisdiction": "FP-Salem-01",
        "power_block_required": True,
        "power_isolation_section": "C1 / KM 123.000–126.000",
        "estimated_isolation_minutes": 75,
        "asset_availability": "Available for maintenance",
        "detection_date": "2026-09-18",
        "sla_due_date": "2026-09-19",
        "severity": 7,
        "safety_impact": 8,
        "estimated_duration_minutes": 75,
        "required_block_type": "POWER_BLOCK",
        "maintenance_requirement": "Contact wire measurement, re-tensioning, and clamp replacement",
    },
    {
        "defect_id": "TDMS-OHE-005",
        "asset_type": "Insulator",
        "department": "TDMS",
        "mast_number": "M-88/04",
        "location": "C2 / KM 88.400",
        "section": "C2",
        "defect_classification": "Insulator Flashover",
        "switching_station": "SS-Erode-West",
        "substation": "TSS-Erode",
        "feeding_post_jurisdiction": "FP-Erode-02",
        "power_block_required": True,
        "power_isolation_section": "C2 / KM 87.000–90.000",
        "estimated_isolation_minutes": 60,
        "asset_availability": "Available for maintenance",
        "detection_date": "2026-09-17",
        "sla_due_date": "2026-09-20",
        "severity": 6,
        "safety_impact": 7,
        "estimated_duration_minutes": 60,
        "required_block_type": "POWER_BLOCK",
        "maintenance_requirement": "Insulator replacement and creepage distance verification",
    },
    {
        "defect_id": "TDMS-OHE-006",
        "asset_type": "Cantilever Assembly",
        "department": "TDMS",
        "mast_number": "M-56/12",
        "location": "C3 / KM 56.800",
        "section": "C3",
        "defect_classification": "Cantilever Misalignment",
        "switching_station": "SS-Karur",
        "substation": "TSS-Karur",
        "feeding_post_jurisdiction": "FP-Karur-01",
        "power_block_required": True,
        "power_isolation_section": "C3 / KM 55.000–58.000",
        "estimated_isolation_minutes": 90,
        "asset_availability": "Available for maintenance",
        "detection_date": "2026-09-16",
        "sla_due_date": "2026-09-21",
        "severity": 5,
        "safety_impact": 5,
        "estimated_duration_minutes": 90,
        "required_block_type": "POWER_BLOCK",
        "maintenance_requirement": "Cantilever arm re-alignment and dropper wire adjustment",
    },
    {
        "defect_id": "TDMS-OHE-007",
        "asset_type": "Mast/Structure",
        "department": "TDMS",
        "mast_number": "M-142/06",
        "location": "C4 / KM 142.200",
        "section": "C4",
        "defect_classification": "Bird Nest Removal",
        "switching_station": "SS-Junction-South",
        "substation": "TSS-Junction",
        "feeding_post_jurisdiction": "FP-Junction-01",
        "power_block_required": True,
        "power_isolation_section": "C4 / KM 141.000–143.000",
        "estimated_isolation_minutes": 30,
        "asset_availability": "Available for maintenance",
        "detection_date": "2026-09-15",
        "sla_due_date": "2026-09-22",
        "severity": 3,
        "safety_impact": 4,
        "estimated_duration_minutes": 30,
        "required_block_type": "POWER_BLOCK",
        "maintenance_requirement": "Bird nest removal from OHE structure and insulator cleaning",
    },
]


class TDMSProvider:
    """Deterministic TDMS data provider."""

    @staticmethod
    def get_defects():
        return TDMS_DEFECTS

    @staticmethod
    def get_all():
        return {"defects": TDMS_DEFECTS}

    @staticmethod
    def get_defect_by_id(defect_id: str):
        for d in TDMS_DEFECTS:
            if d["defect_id"] == defect_id:
                return d
        return None

    @staticmethod
    def get_power_isolation_for_section(section: str):
        """Returns all power isolation constraints affecting a given section."""
        return [d for d in TDMS_DEFECTS if d["section"] == section and d["power_block_required"]]


def get_tdms_defects():
    return TDMSProvider.get_defects()
