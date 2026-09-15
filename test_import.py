import sys, os
print("Current directory:", os.getcwd())
print("Sys path:", sys.path[:3])

# Try the import
try:
    from backend.db.session import Base
    print("SUCCESS: Imported from backend.db.session")
except Exception as e:
    print("FAILED backend.db.session:", e)
    # Try to see what's in backend/db
    if os.path.exists('backend/db'):
        print("backend/db contents:", os.listdir('backend/db'))
    else:
        print("backend/db does not exist")

# Check if there's a backend/app/db
if os.path.exists('backend/app/db'):
    print("backend/app/db contents:", os.listdir('backend/app/db'))
    
    # Try importing from there
    try:
        from backend.app.db.session import Base
        print("SUCCESS: Imported from backend.app.db.session")
    except Exception as e2:
        print("FAILED backend.app.db.session:", e2)
