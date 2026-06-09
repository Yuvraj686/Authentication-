from pymongo import MongoClient
import mongomock
from .config import settings

is_mock_db = False

# Try to connect to real MongoDB
try:
    # Use 5 seconds timeout for remote Atlas clusters, 2 seconds for local
    timeout_ms = 5000 if "srv" in settings.mongodb_uri else 2000
    client = MongoClient(settings.mongodb_uri, serverSelectionTimeoutMS=timeout_ms)
    # The server_info() method forces a connection and raises an exception if the server is not available
    client.server_info()
    db = client[settings.mongodb_database_name]
    print("Successfully connected to real MongoDB instance.")
except Exception as e:
    print(f"MongoDB connection failed: {e}. Falling back to in-memory mongomock.")
    client = mongomock.MongoClient()
    db = client[settings.mongodb_database_name]
    is_mock_db = True

# Setup unique index on email
try:
    db.users.create_index("email", unique=True)
except Exception:
    pass

def get_db():
    """
    Dependency that yields the MongoDB database instance.
    """
    return db
