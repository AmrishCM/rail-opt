#!/usr/bin/env python3
"""
SIH 2026 Deterministic Seed Script for RailOpt-AI
Seeds the complete realistic railway environment:
- 8 Demo Users & RBAC Permissions
- 3 Corridors & 10 Sections
- 30 Assets across Track, S&T, Traction, Telecom
- 22 Maintenance Tasks with realistic Indian Railways defects
- 8 Trains & 7 Movements
- 14 Block Windows (including Key 10:30-12:00, 14:00-16:30, 22:00-01:00 on Section C2-02)
- 1 Pre-Approved Plan (#101) with Assigned Tasks for Inspector
"""

import os
import sys

script_dir = os.path.dirname(os.path.abspath(__file__))
project_dir = os.path.abspath(os.path.join(script_dir, ".."))
backend_dir = os.path.join(project_dir, "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)
if project_dir not in sys.path:
    sys.path.insert(0, project_dir)

from app.db.session import engine, SessionLocal, Base
from app.services.ingestion.seeder import seed_database
import app.models

def main():
    print("=" * 70)
    print("RailOpt-AI — Intelligent Railway Maintenance Block Planning System")
    print("SIH 2026 Deterministic Database Seeder")
    print("=" * 70)

    # Re-create all tables fresh
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        print("[*] Recreating database and seeding deterministic demo dataset...")
        summary = seed_database(db, days=7, reset=False)
        print("[+] Seed successful!")
        for k, v in summary.items():
            print(f"    - {k}: {v}")
        print("-" * 70)
        print("Demo Accounts Created (Password for all: RailOpt@2026):")
        print("  1. admin@railopt.demo     (System Administrator)")
        print("  2. manager@railopt.demo   (Operations Manager, Corridor C2)")
        print("  3. engineer@railopt.demo  (Maintenance Engineer, Engineering)")
        print("  4. track@railopt.demo     (Track Supervisor)")
        print("  5. signal@railopt.demo    (S&T Engineer)")
        print("  6. traction@railopt.demo  (Traction Foreman)")
        print("  7. inspector@railopt.demo (Field Inspector, Section C2-02)")
        print("  8. viewer@railopt.demo    (Auditor / Safety Viewer)")
        print("=" * 70)
    finally:
        db.close()

if __name__ == "__main__":
    main()
