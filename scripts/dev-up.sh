#!/usr/bin/env bash
# Helper to build and run the project with Docker Compose (Linux / macOS)
set -euo pipefail

echo "Building images..."
docker compose build

echo "Bringing up services..."
docker compose up
