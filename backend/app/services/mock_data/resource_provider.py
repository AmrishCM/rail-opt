"""
Resource Provider — Deterministic mock data for maintenance resources.
Categories: Track equipment, Signalling equipment, OHE equipment,
Maintenance vehicles, Engineering teams, Specialized tools.
"""

RESOURCES = [
    # Track Equipment
    {
        "asset_id": "RES-TM-07",
        "type": "Tamping Machine",
        "category": "Track Equipment",
        "department": "TMS",
        "location": "Salem Depot",
        "status": "AVAILABLE",
        "available_from": "2026-09-18 06:00",
        "current_assignment": None,
        "compatible_departments": ["TMS"],
    },
    {
        "asset_id": "RES-IV-03",
        "type": "Inspection Vehicle",
        "category": "Track Equipment",
        "department": "TMS",
        "location": "Erode Depot",
        "status": "AVAILABLE",
        "available_from": "2026-09-18 06:00",
        "current_assignment": None,
        "compatible_departments": ["TMS", "SMMS"],
    },
    {
        "asset_id": "RES-RGC-01",
        "type": "Rail Grinding Car",
        "category": "Track Equipment",
        "department": "TMS",
        "location": "Salem Depot",
        "status": "MAINTENANCE",
        "available_from": "2026-09-20 06:00",
        "current_assignment": "Under preventive maintenance",
        "compatible_departments": ["TMS"],
    },
    # Signalling Equipment
    {
        "asset_id": "RES-SIG-TST-02",
        "type": "Signal Testing Kit",
        "category": "Signalling Equipment",
        "department": "SMMS",
        "location": "Erode S&T Workshop",
        "status": "AVAILABLE",
        "available_from": "2026-09-18 06:00",
        "current_assignment": None,
        "compatible_departments": ["SMMS"],
    },
    {
        "asset_id": "RES-AXC-KIT-01",
        "type": "Axle Counter Calibration Kit",
        "category": "Signalling Equipment",
        "department": "SMMS",
        "location": "Salem S&T Lab",
        "status": "AVAILABLE",
        "available_from": "2026-09-18 06:00",
        "current_assignment": None,
        "compatible_departments": ["SMMS"],
    },
    # OHE / Electrical Equipment
    {
        "asset_id": "RES-OHE-TW-01",
        "type": "Tower Wagon",
        "category": "OHE Equipment",
        "department": "TDMS",
        "location": "Salem OHE Depot",
        "status": "AVAILABLE",
        "available_from": "2026-09-18 06:00",
        "current_assignment": None,
        "compatible_departments": ["TDMS"],
    },
    {
        "asset_id": "RES-OHE-TW-02",
        "type": "Tower Wagon",
        "category": "OHE Equipment",
        "department": "TDMS",
        "location": "Erode OHE Depot",
        "status": "IN_USE",
        "available_from": "2026-09-18 16:00",
        "current_assignment": "TDMS-OHE-004",
        "compatible_departments": ["TDMS"],
    },
    # Maintenance Vehicles
    {
        "asset_id": "RES-LORRY-04",
        "type": "Material Lorry",
        "category": "Maintenance Vehicle",
        "department": "TMS",
        "location": "Salem Yard",
        "status": "AVAILABLE",
        "available_from": "2026-09-18 06:00",
        "current_assignment": None,
        "compatible_departments": ["TMS", "SMMS", "TDMS"],
    },
    # Engineering Teams
    {
        "asset_id": "TEAM-TMS-04",
        "type": "Track Maintenance Gang",
        "category": "Engineering Team",
        "department": "TMS",
        "location": "Salem Section",
        "status": "AVAILABLE",
        "available_from": "2026-09-18 06:00",
        "current_assignment": None,
        "team_size": 8,
        "skill_level": "EXPERT",
        "compatible_departments": ["TMS"],
    },
    {
        "asset_id": "TEAM-TMS-05",
        "type": "Track Maintenance Gang",
        "category": "Engineering Team",
        "department": "TMS",
        "location": "Erode Section",
        "status": "AVAILABLE",
        "available_from": "2026-09-18 06:00",
        "current_assignment": None,
        "team_size": 6,
        "skill_level": "ADVANCED",
        "compatible_departments": ["TMS"],
    },
    {
        "asset_id": "TEAM-SMMS-02",
        "type": "Signal Maintenance Team",
        "category": "Engineering Team",
        "department": "SMMS",
        "location": "Erode S&T Section",
        "status": "AVAILABLE",
        "available_from": "2026-09-18 06:00",
        "current_assignment": None,
        "team_size": 4,
        "skill_level": "EXPERT",
        "compatible_departments": ["SMMS"],
    },
    {
        "asset_id": "TEAM-TDMS-01",
        "type": "OHE Maintenance Team",
        "category": "Engineering Team",
        "department": "TDMS",
        "location": "Salem OHE Section",
        "status": "AVAILABLE",
        "available_from": "2026-09-18 06:00",
        "current_assignment": None,
        "team_size": 5,
        "skill_level": "EXPERT",
        "compatible_departments": ["TDMS"],
    },
    # Specialized Tools
    {
        "asset_id": "RES-WELD-01",
        "type": "Thermit Welding Kit",
        "category": "Specialized Tool",
        "department": "TMS",
        "location": "Salem Depot",
        "status": "AVAILABLE",
        "available_from": "2026-09-18 06:00",
        "current_assignment": None,
        "compatible_departments": ["TMS"],
    },
    {
        "asset_id": "RES-ULTRA-02",
        "type": "Ultrasonic Flaw Detector",
        "category": "Specialized Tool",
        "department": "TMS",
        "location": "Salem Lab",
        "status": "AVAILABLE",
        "available_from": "2026-09-18 06:00",
        "current_assignment": None,
        "compatible_departments": ["TMS", "SMMS"],
    },
]


class ResourceProvider:
    """Deterministic resource availability provider."""

    @staticmethod
    def get_all():
        return RESOURCES

    @staticmethod
    def get_by_department(department: str):
        return [r for r in RESOURCES if department in r.get("compatible_departments", [])]

    @staticmethod
    def get_available():
        return [r for r in RESOURCES if r["status"] == "AVAILABLE"]

    @staticmethod
    def get_available_for_department(department: str):
        return [r for r in RESOURCES if r["status"] == "AVAILABLE" and department in r.get("compatible_departments", [])]

    @staticmethod
    def get_by_category(category: str):
        return [r for r in RESOURCES if r["category"] == category]

    @staticmethod
    def get_engineering_teams():
        return [r for r in RESOURCES if r["category"] == "Engineering Team"]

    @staticmethod
    def get_by_id(asset_id: str):
        for r in RESOURCES:
            if r["asset_id"] == asset_id:
                return r
        return None


def get_available_resources():
    return ResourceProvider.get_available()
