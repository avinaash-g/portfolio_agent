#!/usr/bin/env bash
set -e

echo "============================================================"
echo "  Automated Portfolio Builder Agent - Native Launch Script"
echo "  STRICTLY NO DOCKER (Compliant with PRD Key Constraint)"
echo "============================================================"
echo ""

# 1. Check Python
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] python3 could not be found. Please install Python 3.11+."
    exit 1
fi

# 2. Check Node
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js could not be found. Please install Node.js 18+."
    exit 1
fi

# 3. Setup Backend Virtual Environment
echo "[1/4] Setting up Python virtual environment..."
if [ ! -d "backend/venv" ]; then
    echo "Creating virtual environment in backend/venv..."
    python3 -m venv backend/venv
fi

echo "[2/4] Installing backend dependencies..."
backend/venv/bin/python3 -m pip install --upgrade pip
backend/venv/bin/pip install -r backend/requirements.txt

if [ ! -f "backend/.env" ]; then
    echo "Creating backend/.env from backend/.env.example..."
    cp backend/.env.example backend/.env
fi

# 4. Setup Frontend
echo "[3/4] Installing frontend dependencies..."
cd frontend
npm install
cd ..

# 5. Trap interrupts to kill background jobs cleanly
cleanup() {
    echo ""
    echo "Shutting down servers..."
    kill "$BACKEND_PID" 2>/dev/null || true
    kill "$FRONTEND_PID" 2>/dev/null || true
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

echo "[4/4] Starting Backend (FastAPI :8000) and Frontend (Vite :5173)..."
echo ""
echo "============================================================"
echo "  Backend API:  http://localhost:8000 (Docs at /docs)"
echo "  Frontend App: http://localhost:5173"
echo "============================================================"
echo ""

# Start backend in background
backend/venv/bin/python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

# Start frontend in background
(cd frontend && npm run dev) &
FRONTEND_PID=$!

wait
