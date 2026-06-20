# Architecture Overview

This document explains the high-level architecture of the AI Moderation Platform.

## Components

- Backend (FastAPI)
  - Exposes REST endpoints under `/api/v1/*` (auth, upload, admin, appeals).
  - Connects to MongoDB for data persistence.
  - Serves static uploads from the `uploads/` directory under `/static`.

- Frontend (Next.js)
  - React-based UI using Tailwind/shadcn components.
  - Communicates with backend using REST endpoints.

- Data store
  - MongoDB container managed via Docker Compose.

## Folder Layout (recommended)

- `/backend` — FastAPI app, Python dependencies, Dockerfile
- `/frontend` — Next.js app, Node dependencies, Dockerfile
- `/infra` — Optional: Docker Compose, deployment manifests
- `/docs` — Design and architecture documents
- `/scripts` — Helper scripts for local development and deployment

## Networking

- Local Docker Compose maps ports:
  - Backend: `8000`
  - Frontend: `3000`
  - MongoDB: `27017`

## Notes

- Secrets and environment variables should be provided via a `.env` file or your deployment secrets manager. Do not commit secrets to source control.
