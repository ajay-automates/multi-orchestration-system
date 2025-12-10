@echo off
echo ========================================
echo Multi-Orchestration System - Phase 1
echo ========================================
echo.

echo Checking Docker...
docker --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not installed or not running
    echo Please install Docker Desktop and try again
    pause
    exit /b 1
)

echo Docker is installed ✓
echo.

echo Checking Docker Compose...
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker Compose is not installed
    pause
    exit /b 1
)

echo Docker Compose is installed ✓
echo.

echo Creating .env file if it doesn't exist...
if not exist .env (
    copy .env.example .env
    echo .env file created ✓
) else (
    echo .env file already exists ✓
)
echo.

echo ========================================
echo Starting all services...
echo ========================================
echo This will start:
echo   - PostgreSQL + TimescaleDB
echo   - Redis
echo   - Orchestration Hub
echo   - Dashboard
echo   - Email Blast Project
echo   - Chatbot Project
echo   - Social Media Project
echo.
echo Please wait, this may take a few minutes on first run...
echo.

docker-compose up --build

echo.
echo ========================================
echo Services stopped
echo ========================================
pause
