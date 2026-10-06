import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.database import engine, Base, init_db
from app.agent.orchestrator import orchestrator
from app.routers import auth, profile, projects, portfolios, runs

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("main")

# Initialize tables & schema migration immediately
init_db()

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing database tables...")
    init_db()
    logger.info("Database tables initialized successfully.")
    yield
    logger.info("Shutting down Application...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Automated Portfolio Builder Agent API (PRD v1.0 Compliant)",
    lifespan=lifespan
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers under /api prefix
app.include_router(auth.router, prefix="/api")
app.include_router(auth.direct_router, prefix="/api")
app.include_router(profile.router, prefix="/api")
app.include_router(projects.router, prefix="/api")
app.include_router(portfolios.router, prefix="/api")
app.include_router(runs.router, prefix="/api")

# Mount static deployments for live local preview
from fastapi import HTTPException
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from pathlib import Path

STATIC_DEPLOY_DIR = Path(__file__).resolve().parent.parent / "static_deployments"
DEPLOYMENTS_DIR = Path(__file__).resolve().parent.parent / "deployments"
DIST_DIR = Path(__file__).resolve().parent.parent / "dist"
STATIC_DEPLOY_DIR.mkdir(parents=True, exist_ok=True)
DEPLOYMENTS_DIR.mkdir(parents=True, exist_ok=True)
DIST_DIR.mkdir(parents=True, exist_ok=True)

@app.get("/deployed/{target_id}", response_class=HTMLResponse)
@app.get("/deployed/{target_id}/", response_class=HTMLResponse)
@app.get("/deployed/{target_id}/index.html", response_class=HTMLResponse)
def serve_deployed_portfolio_html(target_id: str):
    """
    Dedicated static preview route serving deployed portfolio HTML.
    Supports portfolio ID, target slug, or partial ID match across static_deployments/, deployments/, and dist/.
    Guarantees that the returned URL loads the full portfolio immediately.
    """
    for base_dir in [STATIC_DEPLOY_DIR, DEPLOYMENTS_DIR, DIST_DIR]:
        if not base_dir.exists():
            continue
        # 1. Exact match by target_id directory
        exact_file = base_dir / target_id / "index.html"
        if exact_file.is_file():
            return HTMLResponse(content=exact_file.read_text(encoding="utf-8"))
        
        # 2. Matching slug directory containing target_id
        for folder in base_dir.iterdir():
            if folder.is_dir() and (target_id in folder.name):
                candidate = folder / "index.html"
                if candidate.is_file():
                    return HTMLResponse(content=candidate.read_text(encoding="utf-8"))

    raise HTTPException(status_code=404, detail=f"Deployed portfolio '{target_id}' not found")

app.mount("/deployed", StaticFiles(directory=str(STATIC_DEPLOY_DIR), html=True), name="deployed")
app.mount("/deployments", StaticFiles(directory=str(DEPLOYMENTS_DIR), html=True), name="deployments")

# Also include direct auth endpoints without /api for universal compatibility
app.include_router(auth.direct_router)

@app.get("/")
def root():
    return {
        "name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "docs_url": "/docs"
    }

@app.get("/health")
def health_check():
    is_gemini = bool(settings.GEMINI_API_KEY and orchestrator.llm_client._genai_client is not None)
    return {
        "status": "healthy",
        "gemini_configured": is_gemini,
        "gemini_model": settings.GEMINI_MODEL,
        "execution_mode": "gemini" if is_gemini else "deterministic_fallback"
    }

@app.get("/api/agent/status")
def get_agent_status():
    is_gemini = bool(settings.GEMINI_API_KEY and orchestrator.llm_client._genai_client is not None)
    return {
        "status": "online",
        "gemini_configured": is_gemini,
        "gemini_model": settings.GEMINI_MODEL,
        "model_name": settings.GEMINI_MODEL,
        "execution_mode": "gemini" if is_gemini else "deterministic_fallback",
        "warning": None if is_gemini else "Google Gemini API key not detected. Agent is operating in offline deterministic mode with verified guardrails."
    }

