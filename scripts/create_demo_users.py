#!/usr/bin/env python3
"""
Create Demo Users Script for RailOpt-AI
Seeds the 8 RBAC roles and demo user accounts.
"""

import os
import sys

script_dir = os.path.dirname(os.path.abspath(__file__))
project_dir = os.path.abspath(os.path.join(script_dir, ".."))
backend_dir = os.path.join(project_dir, "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.db.session import engine, SessionLocal, Base
from app.services.ingestion.seeder import seed_database
import app.models

def main():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db, days=7, reset=False)
        print("Demo users verified and seeded.")
    finally:
        db.close()

if __name__ == "__main__":
    main()
