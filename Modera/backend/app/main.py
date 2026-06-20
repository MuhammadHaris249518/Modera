"""Application entrypoint for the moderation API.

This module sets up the FastAPI app, registers middleware and routers,
and performs required startup/shutdown tasks such as connecting to
MongoDB and seeding a default admin user when the app starts.

Important decisions:
- CORS is intentionally restricted to the configured frontend origin
  to make local development safe while enabling later deployment
  environments to use environment overrides.
- Admin seeding is performed at startup and is idempotent: it won't
  overwrite an existing admin but will ensure admin role/active state.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from app.api import auth, upload, admin
from app.api.appeals import router as appeals_router
from app.core.database import connect_to_mongo, close_mongo_connection, seed_admin_user
from app.core.config import settings


app = FastAPI(title="AI Content Moderation API")


# CORS: restrict allowed origins to the configured frontend origin.
# Modify `FRONTEND_ORIGIN` in `app/core/config.py` or via environment
# variables for deployments.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_db_client():
    # Establish DB connection and seed the admin user on startup.
    # Seeding is idempotent: it will not recreate the admin if present.
    await connect_to_mongo()
    await seed_admin_user()


@app.on_event("shutdown")
async def shutdown_db_client():
    # Close DB connections cleanly on shutdown.
    await close_mongo_connection()


# Register API routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(upload.router, prefix="/api/v1/upload", tags=["Upload"])
app.include_router(appeals_router, prefix="/api/v1/appeals", tags=["Appeals"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["Admin"])


# Ensure uploads directory exists for StaticFiles to mount. We keep uploads
# outside of package data so they are easy to map to host volumes in Docker.
os.makedirs("uploads", exist_ok=True)
app.mount("/static", StaticFiles(directory="uploads"), name="static")


@app.get("/")
def read_root():
    return {"status": "ok", "message": "Moderation API is running"}
