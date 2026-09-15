from datetime import datetime, timedelta


def build_demo_payload():
    return {
        "overview": {
            "dashboard": {
                "active_corridors": 3,
                "maintenance_backlog": 28,
                "critical_tasks": 5,
                "current_block_hours": 6.2,
                "asset_availability": 94.2,
                "train_impact_minutes": 38,
                "ai_plan_score": 87,
            },
            "dataset_type": "synthetic/demo",
            "generated_at": datetime.utcnow().isoformat(),
        },
        "corridor_timeline": [
            {"label": "08:00", "train_101": 1, "track_block": 1, "signal_block": 1},
            {"label": "10:00", "train_101": 1, "track_block": 0, "signal_block": 1},
            {"label": "12:00", "train_101": 0, "track_block": 1, "signal_block": 1},
        ],
        "comparison": {
            "baseline": {"asset_availability": 91.2, "block_hours": 8.7, "train_delay_minutes": 72, "completed_tasks": 18, "conflicts": 5, "utilization": 63},
            "ai_plan": {"asset_availability": 96.4, "block_hours": 6.1, "train_delay_minutes": 38, "completed_tasks": 24, "conflicts": 0, "utilization": 87},
            "dataset_type": "synthetic/demo",
        },
    }
