"""
Unified Data Ingestion & Spatial Harmonization Pipeline
Connects to simulated REST API connectors for:
- TMS (Track Management System)
- SMMS (Signalling & Interlocking Management System)
- TDMS (Traction Distribution Management System)
- COA (Control Office Application)
- BDMS (Bridge Database Management System)
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import random

from ..mock_data.tms_provider import get_tms_defects
from ..mock_data.smms_provider import get_smms_defects
from ..mock_data.tdms_provider import get_tdms_defects
from ..mock_data.coa_provider import get_train_timetable, get_freight_forecast
from ..mock_data.bdms_provider import get_bdms_defects
from ..spatial.linear_referencing import LinearReferencingService

class UnifiedIngestionService:
    """
    Central pipeline orchestrator for railway departmental data ingestion and spatial harmonization.
    """

    # Simulated Connector Metadata
    CONNECTORS_CONFIG = {
        "TMS": {
            "name": "Track Management System (TMS)",
            "department": "Civil / Permanent Way",
            "protocol": "REST API (JSON / OData)",
            "endpoint": "https://tms.railnet.gov.in/api/v2/defects/active",
            "auth_type": "mTLS + OAuth2 Token",
            "poll_interval_seconds": 60,
            "status": "ONLINE",
            "latency_ms": 42
        },
        "SMMS": {
            "name": "Signalling Maintenance Management System (SMMS)",
            "department": "Signal & Telecommunication",
            "protocol": "REST API (JSON / Webhook)",
            "endpoint": "https://smms.railnet.gov.in/api/v1/interlocking/alerts",
            "auth_type": "OAuth2 Bearer",
            "poll_interval_seconds": 30,
            "status": "ONLINE",
            "latency_ms": 38
        },
        "TDMS": {
            "name": "Traction Distribution Management System (TDMS)",
            "department": "Electrical / OHE Catenary",
            "protocol": "REST API (JSON)",
            "endpoint": "https://tdms.railnet.gov.in/api/v1/ohe/defects",
            "auth_type": "API Key + Certificate",
            "poll_interval_seconds": 60,
            "status": "ONLINE",
            "latency_ms": 45
        },
        "COA": {
            "name": "Control Office Application (COA)",
            "department": "Operating / Train Control",
            "protocol": "REST API / Kafka Real-time Stream",
            "endpoint": "https://coa.cris.org.in/api/v3/movement/timetables",
            "auth_type": "CRIS Enterprise Token",
            "poll_interval_seconds": 15,
            "status": "ONLINE",
            "latency_ms": 28
        },
        "BDMS": {
            "name": "Bridge Database Management System (BDMS)",
            "department": "Civil / Bridges & Structures",
            "protocol": "REST API (JSON)",
            "endpoint": "https://bdms.railnet.gov.in/api/v1/bridges/inspections",
            "auth_type": "OAuth2 Bearer",
            "poll_interval_seconds": 120,
            "status": "ONLINE",
            "latency_ms": 50
        }
    }

    _last_sync_time: Optional[datetime] = None

    @classmethod
    def get_connector_status(cls) -> List[Dict[str, Any]]:
        """Returns connection health telemetry for all 5 enterprise railway connectors."""
        now = datetime.now()
        results = []
        for code, meta in cls.CONNECTORS_CONFIG.items():
            results.append({
                "code": code,
                "name": meta["name"],
                "department": meta["department"],
                "protocol": meta["protocol"],
                "endpoint": meta["endpoint"],
                "auth_type": meta["auth_type"],
                "status": meta["status"],
                "latency_ms": meta["latency_ms"],
                "last_sync": (cls._last_sync_time or now).isoformat(),
                "records_available": cls._count_records_for(code)
            })
        return results

    @classmethod
    def _count_records_for(cls, code: str) -> int:
        if code == "TMS":
            return len(get_tms_defects())
        elif code == "SMMS":
            return len(get_smms_defects())
        elif code == "TDMS":
            return len(get_tdms_defects())
        elif code == "COA":
            return len(get_train_timetable()) + len(get_freight_forecast())
        elif code == "BDMS":
            return len(get_bdms_defects())
        return 0

    @classmethod
    def ingest_and_harmonize(cls, corridor_id: int = 2) -> Dict[str, Any]:
        """
        Executes unified ingestion across TMS, SMMS, TDMS, COA, BDMS and standardizes
        linear referencing (Section, Line ID, Km/Chainage, Track ID).
        """
        cls._last_sync_time = datetime.now()

        raw_records: List[Dict[str, Any]] = []

        # 1. Ingest from TMS
        for d in get_tms_defects():
            d_copy = dict(d)
            d_copy["department"] = "Track"
            # Assign chainage KM in C2-02 if missing
            if "start_km" not in d_copy:
                d_copy["start_km"] = 42.500
                d_copy["end_km"] = 43.800
                d_copy["line_id"] = "MAIN_LINE_2"
                d_copy["track_id"] = "DN_MAIN"
            raw_records.append(d_copy)

        # 2. Ingest from SMMS
        for d in get_smms_defects():
            d_copy = dict(d)
            d_copy["department"] = "S&T"
            if "start_km" not in d_copy:
                d_copy["start_km"] = 43.000
                d_copy["end_km"] = 43.400
                d_copy["line_id"] = "MAIN_LINE_2"
                d_copy["track_id"] = "DN_MAIN"
            raw_records.append(d_copy)

        # 3. Ingest from TDMS
        for d in get_tdms_defects():
            d_copy = dict(d)
            d_copy["department"] = "Traction"
            if "start_km" not in d_copy:
                d_copy["start_km"] = 42.000
                d_copy["end_km"] = 45.000
                d_copy["line_id"] = "MAIN_LINE_2"
                d_copy["track_id"] = "DN_MAIN"
            raw_records.append(d_copy)

        # 4. Ingest from BDMS
        for d in get_bdms_defects():
            d_copy = dict(d)
            d_copy["department"] = "Bridges"
            raw_records.append(d_copy)

        # 5. Standardize Linear Referencing
        harmonized_defects: List[Dict[str, Any]] = []
        for r in raw_records:
            h = LinearReferencingService.harmonize_record(r, default_corridor_id=corridor_id)
            harmonized_defects.append(h)

        # 6. Detect Spatial Clusters (Shadowing candidates)
        spatial_clusters = LinearReferencingService.detect_all_spatial_clusters(
            harmonized_defects,
            safety_buffer_km=2.0
        )

        return {
            "sync_timestamp": cls._last_sync_time.isoformat(),
            "total_ingested": len(harmonized_defects),
            "department_counts": {
                "Track (TMS)": len([d for d in harmonized_defects if d["department"] == "Track"]),
                "S&T (SMMS)": len([d for d in harmonized_defects if d["department"] == "S&T"]),
                "Traction (TDMS)": len([d for d in harmonized_defects if d["department"] == "Traction"]),
                "Bridges (BDMS)": len([d for d in harmonized_defects if d["department"] == "Bridges"]),
            },
            "harmonized_defects": harmonized_defects,
            "spatial_clusters": spatial_clusters,
            "shadow_opportunities_detected": len([c for c in spatial_clusters if c["is_multi_department"]])
        }

    @classmethod
    def get_live_train_delay_stream(cls) -> List[Dict[str, Any]]:
        """
        Simulates live COA telemetry stream: train running status, delay minutes, and dynamic ETA.
        """
        base_timetable = get_train_timetable()
        live_stream = []

        delays = {
            "12671": {"delay_min": 14, "status": "RUNNING_LATE", "last_station": "Sankari Durg (Passing)"},
            "12672": {"delay_min": 0, "status": "ON_TIME", "last_station": "Erode Jn (Platform 2)"},
            "12675": {"delay_min": 25, "status": "DELAYED", "last_station": "Salem Jn (Departed)"},
            "16525": {"delay_min": 5, "status": "MINOR_DELAY", "last_station": "Tiruppur (Arrived)"},
            "20643": {"delay_min": 0, "status": "PRIORITY_PASS", "last_station": "Coimbatore Jn (Approaching)"}
        }

        for t in base_timetable:
            t_num = str(t.get("train_number"))
            delay_info = delays.get(t_num, {"delay_min": 0, "status": "ON_TIME", "last_station": t.get("station", "Enroute")})

            live_stream.append({
                "train_number": t_num,
                "train_name": t.get("train_name"),
                "train_type": t.get("train_type"),
                "priority": t.get("priority"),
                "scheduled_arrival": t.get("arrival"),
                "scheduled_departure": t.get("departure"),
                "current_delay_minutes": delay_info["delay_min"],
                "live_status": delay_info["status"],
                "last_reported_location": delay_info["last_station"],
                "projected_block_window_impact": "LOW" if delay_info["delay_min"] < 15 else "HIGH"
            })

        return live_stream

    @classmethod
    def get_goods_train_forecast(cls) -> List[Dict[str, Any]]:
        """
        Returns dynamic goods train forecasts from COA.
        """
        return list(get_freight_forecast())
