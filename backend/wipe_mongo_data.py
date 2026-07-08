import os
import sys

from pymongo import MongoClient


mongo_url = os.environ.get("WIPE_MONGO_URL", "")
db_name = os.environ.get("WIPE_DB_NAME", "")
confirm = os.environ.get("WIPE_CONFIRM", "")

if confirm != "DELETE_EDITCOL_DATA":
    raise SystemExit("Refusing to wipe data without WIPE_CONFIRM=DELETE_EDITCOL_DATA.")

if not mongo_url:
    raise SystemExit("WIPE_MONGO_URL is required.")

if not db_name:
    raise SystemExit("WIPE_DB_NAME is required.")

if db_name in {"admin", "local", "config"}:
    raise SystemExit(f"Refusing to wipe protected database: {db_name}")

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

client = MongoClient(mongo_url, serverSelectionTimeoutMS=10000)
client.admin.command("ping")

db = client[db_name]
existing = set(db.list_collection_names())

print(f"Wiping database: {db_name}")
total = 0
for name in collections:
    if name not in existing:
        print(f"{name}: collection missing, skipped")
        continue

    result = db[name].delete_many({})
    total += result.deleted_count
    print(f"{name}: deleted {result.deleted_count}")

remaining = {
    name: db[name].count_documents({})
    for name in collections
    if name in set(db.list_collection_names())
}

print(f"Total deleted: {total}")
print("Remaining tracked documents:")
for name, count in remaining.items():
    print(f"{name}: {count}")

if any(remaining.values()):
    sys.exit(2)

print("Done. All tracked collections are empty.")
