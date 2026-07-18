@echo off
echo ======================================
echo   Couple Scheduler - Starting Up
echo ======================================

:: Change to project root
cd /d "%~dp0"

:: Create virtual environment if it doesn't exist
if not exist ".venv" (
    echo Creating Python virtual environment...
    python -m venv .venv
)

:: Install backend dependencies
echo Installing backend dependencies...
call .venv\Scripts\pip install -r backend\requirements.txt -q

:: Install frontend dependencies
cd frontend
if not exist "node_modules" (
    echo Installing frontend dependencies...
    call npm.cmd install --legacy-peer-deps
)
cd ..

:: Start the backend (FastAPI + Telegram Bot)
echo.
echo Starting Backend (FastAPI + Telegram Bot)...
start "Couple Scheduler Backend" cmd /k "call .venv\Scripts\python -m backend.main"

:: Start the frontend (Vite Dev Server)
echo Starting Frontend (Vite)...
cd frontend
start "Couple Scheduler Frontend" cmd /k "call npm.cmd run dev"
cd ..

echo.
echo ======================================
echo   Services started!
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:8080
echo ======================================
pause
