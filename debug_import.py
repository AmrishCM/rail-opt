#!/usr/bin/env python3
import sys, os
print("Current dir:", os.getcwd())
print("Sys path:", sys.path[:3])

# Try the exact import from the script
try:
    from backend.db.session import Base
    print("SUCCESS: Imported Base from backend.db.session")
    print("Base:", Base)
except Exception as e:
    print("FAILED: Could not import from backend.db.session")
    print("Error:", e)
    import traceback
    traceback.print_exc()

    # Let's see what's in backend/db
    print("\nChecking backend/db contents:")
    if os.path.exists('backend/db'):
        print(os.listdir('backend/db'))
    else:
        print("backend/db does not exist")

    # Check if session.py exists
    print("\nChecking if session.py exists:")
    if os.path.exists('backend/db/session.py'):
        print("session.py exists")
        # Try to read it
        with open('backend/db/session.py', 'r') as f:
            content = f.read()
            print("First 10 lines:")
            print('\n'.join(content.split('\n')[:10]))
    else:
        print("session.py does NOT exist")