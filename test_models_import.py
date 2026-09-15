#!/usr/bin/env python3
import sys, os
sys.path.insert(0, os.getcwd())

print("Testing imports from backend.app.models...")

modules_to_test = [
    'Asset', 'AssetType',
    'Corridor', 'Section',
    'MaintenanceTask', 'TaskStatus', 'TaskType',
    'Train', 'TrainMovement', 'TrainType', 'TrainPriority',
    'BlockWindow', 'BlockType', 'BlockStatus',
    'Resource', 'Department', 'SkillLevel',
    'MaintenancePlan', 'PlanAssignment', 'PlanStatus', 'PlanType',
    'SimulationRun', 'SimulationEvent', 'SimulationStatus'
]

# Test importing the module first
try:
    import backend.app.models
    print("SUCCESS: Imported backend.app.models")
except Exception as e:
    print("FAILED: Could not import backend.app.models")
    print("Error:", e)
    import traceback
    traceback.print_exc()
    exit(1)

# Test importing each item
for module_name in modules_to_test:
    try:
        exec(f"from backend.app.models import {module_name}")
        print(f"  SUCCESS: Imported {module_name}")
    except Exception as e:
        print(f"  FAILED: Could not import {module_name}")
        print(f"    Error: {e}")