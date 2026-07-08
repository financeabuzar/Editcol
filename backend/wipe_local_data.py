import os
from pathlib import Path

from dotenv import load_dotenv
from pymongo import MongoClient


ROOT = Path(__file__).resolve().parent
load_dotenv(ROOT / ".env")

mongo_url = os.environ.get("MONGO_URL", "")
db_name = os.environ.get("DB_NAME", "")

if not db_name:
    raise SystemExit("DB_NAME is not configured.")

if "localhost" not in mongo_url and "127.0.0.1" not in mongo_url:
    raise SystemExit(f"Refusing to wipe non-local MongoDB URL: {mongo_url}")

client = MongoClient(mongo_url, serverSelectionTimeoutMS=5000)
db = client[db_name]

collections = [
    "users",
    "editors",
    "client_profiles",
    "projects",
    "applications",
    "conversations",
    "messages",
    "reviews",
    "reports",
    "blocks",
    "login_attempts",
    "otp_codes",
    "password_reset_tokens",
]

print(f"Wiping local database: {db_name}")
for name in collections:
    result = db[name].delete_many({})
    print(f"{name}: deleted {result.deleted_count}")

print("Done.")
