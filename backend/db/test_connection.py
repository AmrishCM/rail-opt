from sqlalchemy import text
from .session import engine, SessionLocal

def test_connection():
    """Test database connection"""
    try:
        # Test engine connection
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            print("✓ Database engine connection successful")

        # Test session creation
        db = SessionLocal()
        try:
            result = db.execute(text("SELECT 1"))
            print("✓ Database session creation successful")
        finally:
            db.close()

        print("✓ All database connection tests passed")
        return True
    except Exception as e:
        print(f"✗ Database connection failed: {e}")
        return False

if __name__ == "__main__":
    test_connection()