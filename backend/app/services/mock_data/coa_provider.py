"""
COA — Control Office Application Mock Data Provider
Deterministic railway traffic data: master timetable, goods train forecast,
sectional capacity, alternative routes, and corridor block availability.
"""

MASTER_TIMETABLE = [
    {
        "train_number": "12671",
        "train_name": "Nilagiri Express",
        "train_type": "EXPRESS",
        "priority": "HIGH",
        "section": "C1",
        "direction": "UP",
        "arrival": "09:35",
        "departure": "09:40",
        "station": "Salem Jn",
        "scheduled_speed_kmh": 110,
    },
    {
        "train_number": "12672",
        "train_name": "Nilagiri Express (Return)",
        "train_type": "EXPRESS",
        "priority": "HIGH",
        "section": "C1",
        "direction": "DOWN",
        "arrival": "16:20",
        "departure": "16:25",
        "station": "Salem Jn",
        "scheduled_speed_kmh": 110,
    },
    {
        "train_number": "12675",
        "train_name": "Kovai Express",
        "train_type": "EXPRESS",
        "priority": "HIGH",
        "section": "C1",
        "direction": "UP",
        "arrival": "11:10",
        "departure": "11:15",
        "station": "Salem Jn",
        "scheduled_speed_kmh": 100,
    },
    {
        "train_number": "12676",
        "train_name": "Kovai Express (Return)",
        "train_type": "EXPRESS",
        "priority": "HIGH",
        "section": "C1",
        "direction": "DOWN",
        "arrival": "14:45",
        "departure": "14:52",
        "station": "Salem Jn",
        "scheduled_speed_kmh": 100,
    },
    {
        "train_number": "16525",
        "train_name": "Island Express",
        "train_type": "EXPRESS",
        "priority": "MEDIUM",
        "section": "C2",
        "direction": "UP",
        "arrival": "08:20",
        "departure": "08:25",
        "station": "Erode Jn",
        "scheduled_speed_kmh": 90,
    },
    {
        "train_number": "16526",
        "train_name": "Island Express (Return)",
        "train_type": "EXPRESS",
        "priority": "MEDIUM",
        "section": "C2",
        "direction": "DOWN",
        "arrival": "17:40",
        "departure": "17:45",
        "station": "Erode Jn",
        "scheduled_speed_kmh": 90,
    },
    {
        "train_number": "56713",
        "train_name": "Salem–Erode Passenger",
        "train_type": "PASSENGER",
        "priority": "MEDIUM",
        "section": "C2",
        "direction": "UP",
        "arrival": "10:05",
        "departure": "10:10",
        "station": "Erode Jn",
        "scheduled_speed_kmh": 60,
    },
    {
        "train_number": "56714",
        "train_name": "Erode–Salem Passenger",
        "train_type": "PASSENGER",
        "priority": "MEDIUM",
        "section": "C2",
        "direction": "DOWN",
        "arrival": "13:15",
        "departure": "13:20",
        "station": "Salem Jn",
        "scheduled_speed_kmh": 60,
    },
    {
        "train_number": "22207",
        "train_name": "Chennai–Madurai SF",
        "train_type": "EXPRESS",
        "priority": "HIGH",
        "section": "C3",
        "direction": "UP",
        "arrival": "12:30",
        "departure": "12:35",
        "station": "Karur Jn",
        "scheduled_speed_kmh": 100,
    },
    {
        "train_number": "22208",
        "train_name": "Madurai–Chennai SF (Return)",
        "train_type": "EXPRESS",
        "priority": "HIGH",
        "section": "C3",
        "direction": "DOWN",
        "arrival": "15:10",
        "departure": "15:15",
        "station": "Karur Jn",
        "scheduled_speed_kmh": 100,
    },
    {
        "train_number": "56841",
        "train_name": "Karur–Dindigul Passenger",
        "train_type": "PASSENGER",
        "priority": "LOW",
        "section": "C4",
        "direction": "UP",
        "arrival": "07:45",
        "departure": "07:50",
        "station": "Dindigul Jn",
        "scheduled_speed_kmh": 50,
    },
    {
        "train_number": "56842",
        "train_name": "Dindigul–Karur Passenger",
        "train_type": "PASSENGER",
        "priority": "LOW",
        "section": "C4",
        "direction": "DOWN",
        "arrival": "18:30",
        "departure": "18:35",
        "station": "Karur Jn",
        "scheduled_speed_kmh": 50,
    },
]

GOODS_TRAIN_FORECAST = [
    {
        "rake_id": "BCNA-40218",
        "commodity": "Coal",
        "expected_pathing_time": "06:30",
        "section": "C1",
        "direction": "UP",
        "crew_change_point": "Salem Jn",
        "priority": "MEDIUM",
        "estimated_transit_minutes": 45,
    },
    {
        "rake_id": "BOXN-31547",
        "commodity": "Iron Ore",
        "expected_pathing_time": "13:00",
        "section": "C1",
        "direction": "DOWN",
        "crew_change_point": "Erode Jn",
        "priority": "MEDIUM",
        "estimated_transit_minutes": 50,
    },
    {
        "rake_id": "BTPN-22104",
        "commodity": "Petroleum",
        "expected_pathing_time": "19:00",
        "section": "C2",
        "direction": "UP",
        "crew_change_point": "Salem Jn",
        "priority": "HIGH",
        "estimated_transit_minutes": 40,
    },
    {
        "rake_id": "BCNA-40219",
        "commodity": "Cement",
        "expected_pathing_time": "22:00",
        "section": "C3",
        "direction": "DOWN",
        "crew_change_point": "Karur Jn",
        "priority": "LOW",
        "estimated_transit_minutes": 55,
    },
]

SECTIONAL_CAPACITY = {
    "C1": {"max_trains_per_hour": 6, "current_utilization_percent": 72, "alternative_routes": ["C2 via Erode Loop"]},
    "C2": {"max_trains_per_hour": 5, "current_utilization_percent": 58, "alternative_routes": ["C1 via Salem Bypass"]},
    "C3": {"max_trains_per_hour": 4, "current_utilization_percent": 45, "alternative_routes": []},
    "C4": {"max_trains_per_hour": 3, "current_utilization_percent": 30, "alternative_routes": ["C3 via Karur"]},
}

CORRIDOR_AVAILABILITY = {
    "C1": {
        "available_windows": [
            {"start": "14:00", "end": "15:30", "type": "FULL_BLOCK", "reason": "Low traffic window"},
            {"start": "22:00", "end": "05:00", "type": "FULL_BLOCK", "reason": "Night block"},
        ],
        "restricted_periods": [
            {"start": "09:00", "end": "11:30", "reason": "Peak passenger movement"},
            {"start": "16:00", "end": "17:00", "reason": "Evening express corridor"},
        ],
    },
    "C2": {
        "available_windows": [
            {"start": "11:00", "end": "13:00", "type": "FULL_BLOCK", "reason": "Mid-day gap"},
            {"start": "21:00", "end": "05:00", "type": "FULL_BLOCK", "reason": "Night block"},
        ],
        "restricted_periods": [
            {"start": "08:00", "end": "10:30", "reason": "Morning traffic"},
            {"start": "17:00", "end": "18:00", "reason": "Evening express"},
        ],
    },
    "C3": {
        "available_windows": [
            {"start": "09:00", "end": "12:00", "type": "FULL_BLOCK", "reason": "Morning maintenance window"},
            {"start": "22:00", "end": "05:00", "type": "FULL_BLOCK", "reason": "Night block"},
        ],
        "restricted_periods": [
            {"start": "12:00", "end": "13:00", "reason": "SF Express passage"},
            {"start": "15:00", "end": "16:00", "reason": "Return SF Express"},
        ],
    },
    "C4": {
        "available_windows": [
            {"start": "08:00", "end": "18:00", "type": "PARTIAL_BLOCK", "reason": "Low utilization corridor"},
            {"start": "20:00", "end": "06:00", "type": "FULL_BLOCK", "reason": "Night block"},
        ],
        "restricted_periods": [
            {"start": "07:30", "end": "08:00", "reason": "Morning passenger"},
            {"start": "18:15", "end": "18:45", "reason": "Evening passenger"},
        ],
    },
}


class COAProvider:
    """Deterministic COA data provider."""

    @staticmethod
    def get_timetable():
        return MASTER_TIMETABLE

    @staticmethod
    def get_timetable_for_section(section: str):
        return [t for t in MASTER_TIMETABLE if t["section"] == section]

    @staticmethod
    def get_freight_forecast():
        return GOODS_TRAIN_FORECAST

    @staticmethod
    def get_freight_for_section(section: str):
        return [f for f in GOODS_TRAIN_FORECAST if f["section"] == section]

    @staticmethod
    def get_sectional_capacity():
        return SECTIONAL_CAPACITY

    @staticmethod
    def get_corridor_availability():
        return CORRIDOR_AVAILABILITY

    @staticmethod
    def get_corridor_availability_for_section(section: str):
        return CORRIDOR_AVAILABILITY.get(section, {})

    @staticmethod
    def check_train_conflict(section: str, block_start: str, block_end: str):
        """Check if a proposed maintenance block conflicts with any scheduled train."""
        conflicts = []
        for train in MASTER_TIMETABLE:
            if train["section"] != section:
                continue
            t_arr = train["arrival"]
            t_dep = train["departure"]
            # Simple string comparison (HH:MM format)
            if not (block_end <= t_arr or block_start >= t_dep):
                conflicts.append({
                    "train_number": train["train_number"],
                    "train_name": train["train_name"],
                    "arrival": t_arr,
                    "departure": t_dep,
                    "priority": train["priority"],
                    "status": "CONFLICT",
                })
        return conflicts

    @staticmethod
    def get_all():
        return {
            "timetable": MASTER_TIMETABLE,
            "freight_forecast": GOODS_TRAIN_FORECAST,
            "sectional_capacity": SECTIONAL_CAPACITY,
            "corridor_availability": CORRIDOR_AVAILABILITY,
        }


def get_train_timetable():
    return COAProvider.get_timetable()

def get_freight_forecast():
    return COAProvider.get_freight_forecast()

def get_corridor_availability():
    return COAProvider.get_corridor_availability()
