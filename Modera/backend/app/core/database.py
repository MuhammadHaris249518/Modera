
"""MongoDB connection helpers and a small seeding utility.

This module exposes a `get_db()` accessor used by dependency injection and
provides `connect_to_mongo()`/`close_mongo_connection()` lifecycle helpers
called from the FastAPI startup/shutdown events.

The `seed_admin_user()` helper creates a default admin account when the
application boots in development. It intentionally imports password hashing
function locally to avoid circular imports at module import time.
"""

from datetime import datetime

from motor.motor_asyncio import AsyncIOMotorClient

from .config import settings
from app.models.user import RoleEnum


class DataBase:
    client: AsyncIOMotorClient = None
    db = None


db = DataBase()


async def connect_to_mongo():
    # Use the configured MongoDB URL; in Docker compose this points to the
    # `mongodb` service. Keep connection setup lightweight and non-blocking.
    db.client = AsyncIOMotorClient(settings.MONGODB_URL)
    db.db = db.client[settings.DATABASE_NAME]
    print("Connected to MongoDB")


async def close_mongo_connection():
    # Close the underlying client on shutdown to release resources.
    db.client.close()
    print("Closed MongoDB connection")


async def seed_admin_user():
    # Import hashing function here to avoid circular import with security module
    # which itself depends on the DB helpers indirectly.
    from .security import get_password_hash

    if not settings.ADMIN_EMAIL or not settings.ADMIN_PASSWORD:
        return

    # If a user exists with the admin email, ensure they have admin role
    # and are active; otherwise insert a new admin user. This operation is
    # intentionally idempotent for safe restarts.
    existing_user = await db.db.users.find_one({"email": settings.ADMIN_EMAIL})
    if existing_user:
        if existing_user.get("role") != RoleEnum.ADMIN.value:
            await db.db.users.update_one(
                {"_id": existing_user["_id"]},
                {"$set": {"role": RoleEnum.ADMIN.value, "is_active": True}},
            )
            print(f"Updated existing user {settings.ADMIN_EMAIL} to ADMIN role")
        return

    hashed_password = get_password_hash(settings.ADMIN_PASSWORD)
    admin_user = {
        "email": settings.ADMIN_EMAIL,
        "password_hash": hashed_password,
        "role": RoleEnum.ADMIN.value,
        "is_active": True,
        "created_at": datetime.utcnow(),
    }
    await db.db.users.insert_one(admin_user)
    print(f"Seeded admin user: {settings.ADMIN_EMAIL}")


def get_db():
    # Simple accessor used by FastAPI dependencies (`Depends(get_db)`).
    return db.db
