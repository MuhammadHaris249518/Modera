# PowerShell helper to build and run Docker Compose on Windows
param()

Write-Host "Building images..."
docker compose build

Write-Host "Bringing up services..."
docker compose up
