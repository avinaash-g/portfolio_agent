@echo off
setlocal enabledelayedexpansion

echo ============================================================
echo   Automated Portfolio Builder Agent - Native Launch Script
echo   STRICTLY NO DOCKER (Compliant with PRD Key Constraint)
echo ============================================================
echo.

:: 1. Check Python
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python is not installed or not in PATH. Please install Python 3.11+.
    pause
    exit /b 1
)

:: 2. Check Node
node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed or not in PATH. Please install Node.js 18+.
    pause
    exit /b 1
)

:: 3. Setup Backend Virtual Environment
echo [1/4] Setting up Python backend virtual environment...
if not exist "backend\venv" (
    echo Creating virtual environment in backend\venv...
    python -m venv backend\venv
)

echo [2/4] Installing backend dependencies...
call backend\venv\Scripts\python -m pip install --upgrade pip
call backend\venv\Scripts\pip install -r backend\requirements.txt

if not exist "backend\.env" (
    echo Creating backend\.env from backend\.env.example...
    copy backend\.env.example backend\.env
)

:: 4. Setup Frontend
echo [3/4] Installing frontend dependencies...
cd frontend
call npm install
cd ..

:: 5. Launch Both Servers Concurrently
echo [4/4] Starting Backend (FastAPI :8000) and Frontend (Vite :5173)...
echo.
echo ============================================================
echo   Backend URL:  http://localhost:8000 (API Docs: /docs)
echo   Frontend URL: http://localhost:5173
echo ============================================================
echo.

:: Start backend in a separate native window
start "Portfolio Agent - Backend API" cmd /k "backend\venv\Scripts\python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

:: Start frontend in this window
cd frontend
call npm run dev

pause
