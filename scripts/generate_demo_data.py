#!/usr/bin/env python3
"""
Synthetic Data Generator for RailOpt-AI
Generates realistic but fictional data for demonstration purposes.
Clearly labels all data as synthetic/demo - not actual Indian Railways data.
"""

import argparse
import json
import os
import sys
from datetime import datetime, timedelta

# Add backend directory to sys.path
script_dir = os.path.dirname(os.path.abspath(__file__))
project_dir = os.path.abspath(os.path.join(script_dir, ".."))
backend_dir = os.path.join(project_dir, "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)
if project_dir not in sys.path:
    sys.path.insert(0, project_dir)

from app.db.session import engine, SessionLocal, Base
from app.services.ingestion.seeder import seed_database
from app.models import (
    Asset, Corridor, Section, MaintenanceTask, Train,
    TrainMovement, BlockWindow, Resource, Department
)

def parse_arguments():
    parser = argparse.ArgumentParser(description='Generate synthetic demo data for RailOpt-AI')
    parser.add_argument('--days', type=int, default=7, help='Number of days of data to generate')
    parser.add_argument('--no-db', action='store_true', help='Do not insert into database, only generate files')
    parser.add_argument('--reset', action='store_true', default=True, help='Reset existing tables before seeding')
    return parser.parse_args()

def export_json(db, output_path):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    corridors = db.query(Corridor).all()
    tasks = db.query(MaintenanceTask).all()
    blocks = db.query(BlockWindow).all()
    trains = db.query(Train).all()
    assets = db.query(Asset).all()

    payload = {
        "metadata": {
            "generated_at": datetime.now().isoformat(),
            "demo": True,
            "description": "Synthetic demo data for RailOpt-AI - NOT actual Indian Railways data",
            "dataset_type": "synthetic/demo"
        },
        "corridors_count": len(corridors),
        "assets_count": len(assets),
        "tasks_count": len(tasks),
        "blocks_count": len(blocks),
        "trains_count": len(trains)
    }

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)
    print(f"Exported summary JSON to {output_path}")

def main():
    args = parse_arguments()
    print("=" * 65)
    print("RailOpt-AI Synthetic Data Generator (SIH 2026)")
    print("IMPORTANT: Clearly labeled SYNTHETIC/DEMO data only")
    print("NOT actual Indian Railways operational data")
    print("=" * 65)

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if not args.no_db:
            print(f"Seeding database for horizon {args.days} days...")
            result = seed_database(db, days=args.days, reset=args.reset)
            print("Successfully populated database:")
            for k, v in result.items():
                print(f"  - {k}: {v}")

        # Export demo JSON
        json_path = os.path.join(project_dir, "data", "demo", "railopt_demo_data.json")
        export_json(db, json_path)

        print("=" * 65)
        print("Data generation completed successfully!")
        print("=" * 65)
    finally:
        db.close()

if __name__ == "__main__":
    main()