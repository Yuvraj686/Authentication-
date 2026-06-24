from pymongo import MongoClient
import mongomock
from .config import settings

is_mock_db = False

try:
    timeout_ms = 5000 if "srv" in settings.mongodb_uri else 2000
    client = MongoClient(settings.mongodb_uri, serverSelectionTimeoutMS=timeout_ms)
    client.server_info()
    db = client[settings.mongodb_database_name]
    print("Successfully connected to real MongoDB instance.")
except Exception as e:
    print(f"MongoDB connection failed: {e}. Falling back to in-memory mongomock.")
    client = mongomock.MongoClient()
    db = client[settings.mongodb_database_name]
    is_mock_db = True

try:
    db.users.create_index("email", unique=True)
except Exception:
    pass

try:
    db.messages.create_index("receiver_id")
    db.messages.create_index("sender_id")
except Exception:
    pass

try:
    db.groups.create_index("member_ids")
    db.group_messages.create_index("group_id")
except Exception:
    pass

def get_db():
    return db
