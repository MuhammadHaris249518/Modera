# Modera Ai

This repository contains a simple AI moderation platform with a FastAPI backend and a Next.js frontend. It includes a MongoDB service and can be run locally via Docker Compose.

## Project Structure

- `backend/` - FastAPI application
  - `app/` - Python package with API routers, core config, services, and models
  - `requirements.txt` - Python dependencies
  - `Dockerfile` - image to run the backend
- `frontend/` - Next.js application
  - `package.json` - Node dependencies and scripts
  - `Dockerfile` - multi-stage build for production
- `docker-compose.yml` - Compose file to run/make containers for MongoDB, backend, and frontend
 - `docs/` - architecture and design documents
 - `scripts/` - helper scripts for starting and building the project
 - `CONTRIBUTING.md` - guidelines for contributors
 - `LICENSE` - project license

## Architecture Overview

- FastAPI backend exposes REST endpoints under `/api/v1/*` (auth, upload, admin, appeals).
- MongoDB stores users and uploaded metadata. Static uploads are served from `/static` mapped to the `uploads/` directory.
- Next.js frontend handles the UI and talks to the backend via `NEXT_PUBLIC_API_URL`.
- The backend seeds a default admin user on startup if `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set.

## Run locally (Docker Compose)

Build all services and bring them up:

```bash
# from repository root
docker compose build
docker compose up
```

This will start:
- MongoDB on port `27017`
- Backend on port `8000`
- Frontend on port `3000`

Open the frontend at: http://localhost:3000
The backend health endpoint: http://localhost:8000/

## Environment / Secrets

You can override defaults by setting environment variables or creating a `.env` file in the project root. Important variables:

- `MONGODB_URL` (backend) e.g. `mongodb://mongodb:27017`
- `DATABASE_NAME` (backend)
- `SECRET_KEY` (backend) - change in production
- `ADMIN_EMAIL` and `ADMIN_PASSWORD` (backend) - used to seed default admin on startup
- `NEXT_PUBLIC_API_URL` (frontend) - base URL for backend API

Note: The provided values are development defaults only. Never commit production secrets to the repository.

## Reorganize repository into `modera ai` folder

If you want to move the entire project contents into a top-level folder named `modera ai` while keeping the repository-level `.gitignore` at the root, run the provided PowerShell helper script from the repository root:

```powershell
# from repository root
powershell -ExecutionPolicy Bypass -File .\scripts\move_to_modera_ai.ps1
```

The script will create a `modera ai` folder and move most files and folders into it, excluding `.git`, `.gitignore`, and the `scripts` folder (so you can keep the helper scripts accessible).

## Development (without Docker)

Backend (Python):

```bash
# create a venv and install
python -m venv venv
venv\Scripts\activate  # windows
pip install -r backend/requirements.txt
# start server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Frontend (Next.js):

```bash
cd frontend
npm install
npm run dev
```

## Pushing to GitHub

1. Ensure you have a `.gitignore` at project root (this repo includes one that ignores virtualenvs, `.env`, `node_modules`, build artifacts).
2. Remove any large local artifacts (e.g. `backend/venv`, `frontend/node_modules`) before committing.
3. Create a repository on GitHub and push:

```bash
git init
git add .
git commit -m "Initial project import"
git branch -M main
git remote add origin <git-url>
git push -u origin main
```

Also consider adding CI (GitHub Actions) to build and lint on push. See `docs/architecture.md`.

## Notes and Important Decisions

- Admin seeding: the backend will create a default admin user at startup if `ADMIN_EMAIL`/`ADMIN_PASSWORD` are provided. This is for convenience in development and CI. In production, use a secure secret and rotate admin credentials.
- CORS: configured to allow only `FRONTEND_ORIGIN`. Override this at deploy time as needed.
- Uploads: saved to `uploads/` and served via StaticFiles. In production map this to persistent storage or S3.

## Cleaning up local artifacts

To remove local transient files (safe to run before creating a git repo):

```bash
# from repo root (Be careful: this removes local files)
rm -rf backend/venv
rm -rf frontend/node_modules
rm -rf frontend/.next
rm -rf mongodb_data
rm -rf uploads
```

## Next steps / Improvements

- Configure CI to build images and run tests on pull requests.
- Move sensitive config into a secrets manager for production.
- Add tests for key endpoints and frontend integration tests.

---

If you'd like, I can also add a `CONTRIBUTING.md` and GitHub Actions CI workflow to build/test the project automatically.
