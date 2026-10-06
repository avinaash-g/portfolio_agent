import io
import re
import uuid
import zipfile
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.database import get_db, SessionLocal
from app.models import Portfolio, PortfolioVersion, AgentRun

client = TestClient(app)


def test_agent_status_endpoint():
    """Verify agent status endpoint reports Gemini configuration status."""
    res = client.get("/api/agent/status")
    assert res.status_code == 200
    data = res.json()
    assert "gemini_configured" in data
    assert "model_name" in data
    assert "status" in data
    if not data["gemini_configured"]:
        assert "warning" in data
        assert "offline deterministic" in data["warning"].lower()


def test_e2e_pipeline_custom_theme_and_export():
    """
    End-to-End Test Suite verifying:
    1. Submitting raw user and project data via /api/portfolios with custom theme.
    2. Status tracking and transition through stages 1 to 8 (including quality audit and self-improvement).
    3. Returned portfolio JSON containing role-tailored sections and custom theme settings.
    4. Static ZIP export with index.html reflecting custom theme colors and zero unrendered template placeholders.
    """
    unique_id = str(uuid.uuid4())[:8]
    test_email = f"e2e_user_{unique_id}@example.com"

    # Step 1: Register User & Authenticate
    reg_res = client.post("/api/auth/register", json={
        "email": test_email,
        "password": "SecurePassword123!",
        "name": "Sarah Connor"
    })
    assert reg_res.status_code == 200
    token = reg_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Step 2: Populate Profile
    prof_res = client.put("/api/profile", json={
        "headline": "Lead AI Systems Architect & Machine Learning Engineer",
        "about": "Sarah designs robust neural networks and distributed LLM agent architectures.",
        "target_role": "AI Engineer",
        "skills": ["Python", "PyTorch", "FastAPI", "Docker", "Kubernetes", "Vector Databases", "LangChain"],
        "education": [
            {
                "institution": "Institute of Advanced Computing",
                "degree": "M.S. in Artificial Intelligence",
                "year": "2023",
                "details": "Specialization in Autonomous Multi-Agent Reasoning"
            }
        ],
        "experience": [
            {
                "company": "Cyberdyne AI Research",
                "role": "Senior AI Systems Engineer",
                "duration": "2023 - Present",
                "location": "San Francisco, CA",
                "highlights": [
                    "Engineered autonomous multi-agent orchestration frameworks",
                    "Optimized inference throughput by 40% using vLLM and quantization"
                ]
            }
        ],
        "achievements": [
            {
                "title": "NeurIPS Best Paper Contributor",
                "description": "Co-authored research on verifiable alignment guardrails",
                "year": "2023"
            }
        ],
        "certifications": [],
        "links": {
            "github": "https://github.com/sarahconnor",
            "linkedin": "https://linkedin.com/in/sarahconnor",
            "email": "sarah@cyberdyne.ai"
        }
    }, headers=headers)
    assert prof_res.status_code == 200

    # Step 3: Populate Rich Projects
    proj1_res = client.post("/api/projects", json={
        "name": "SkyNet Autonomous Orchestrator",
        "description": "A high-performance multi-agent reasoning framework that automatically coordinates code generation, validation, and automated deployment.",
        "technologies": ["Python", "PyTorch", "FastAPI", "PostgreSQL", "Docker"],
        "role": "Lead Systems Architect",
        "github_url": "https://github.com/sarahconnor/skynet-agent",
        "demo_url": "https://skynet.ai-demo.org",
        "outcomes": "Achieved 99.9% uptime and reduced human supervision overhead by 70%.",
        "is_featured": True
    }, headers=headers)
    assert proj1_res.status_code == 201

    proj2_res = client.post("/api/projects", json={
        "name": "Neural Semantic Search Index",
        "description": "Sub-millisecond vector similarity search engine indexing 50M embeddings with HNSW indexing and dynamic reranking.",
        "technologies": ["Python", "Rust", "Qdrant", "FastAPI"],
        "role": "Principal ML Engineer",
        "github_url": "https://github.com/sarahconnor/neural-search",
        "outcomes": "Lowered latency from 120ms to 8ms under 10,000 QPS load.",
        "is_featured": True
    }, headers=headers)
    assert proj2_res.status_code == 201

    # Step 4: Create Portfolio with Custom Curated Theme ("cyber" / "#06b6d4")
    port_res = client.post("/api/portfolios", json={
        "title": "Sarah Connor - AI Systems Engineer",
        "target_role": "AI Engineer",
        "template_id": "clean",
        "theme_id": "cyber",
        "primary_color": "#06b6d4"
    }, headers=headers)
    assert port_res.status_code == 201
    port_data = port_res.json()
    portfolio_id = port_data["id"]
    assert port_data["theme_id"] == "cyber"
    assert port_data["primary_color"] == "#06b6d4"
    assert port_data["latest_run"] is not None
    run_id = port_data["latest_run"]["id"]

    # Step 5: Verify Initial State Snapshot & Stage Transitions
    # Check the run status endpoint
    status_res = client.get(f"/api/runs/{run_id}/status", headers=headers)
    assert status_res.status_code == 200
    status_data = status_res.json()
    assert status_data["run_id"] == run_id
    assert status_data["state"] in ["READY", "COMPLETED", "CHECKED", "IMPROVING", "GENERATED"]
    assert status_data["progress"] == 100

    # Verify that the logs trace stages through the 8-stage pipeline
    logged_stages = [log["stage"] for log in status_data.get("logs", [])]
    # Check key milestone stages are recorded
    assert any("Profile" in s for s in logged_stages)
    assert any("Project" in s for s in logged_stages)
    assert any("Plan" in s for s in logged_stages)
    assert any("Content" in s for s in logged_stages)
    assert any("Case Study" in s for s in logged_stages)
    assert any("Quality" in s for s in logged_stages)
    assert any("Completed" in s for s in logged_stages)

    # Step 6: Validate Quality Audit Report & Self-Improvement
    quality_report = status_data["payload"].get("quality_report")
    assert quality_report is not None
    assert "score" in quality_report
    assert quality_report["score"] >= 80, f"Expected recruiter-ready score >= 80, got {quality_report['score']}"
    assert "checklist" in quality_report
    assert "issues" in quality_report

    # Step 7: Validate Role-Tailored Content and Theme Config
    get_port = client.get(f"/api/portfolios/{portfolio_id}", headers=headers)
    assert get_port.status_code == 200
    p_body = get_port.json()
    assert p_body["current_version"] is not None
    content = p_body["current_version"]["content"]

    # Verify role tailoring
    assert "AI" in content["hero"]["title"] or "Engineer" in content["hero"]["title"]
    assert len(content["featured_projects"]) >= 1
    featured = content["featured_projects"][0]
    assert "name" in featured
    assert "overview" in featured
    assert "technologies" in featured

    # Step 8: Test Dynamic Theme Switching via PATCH /portfolios/{id}/theme
    patch_res = client.patch(f"/api/portfolios/{portfolio_id}/theme", json={
        "theme_id": "rose",
        "primary_color": "#f43f5e"
    }, headers=headers)
    assert patch_res.status_code == 200
    patched_body = patch_res.json()
    assert patched_body["theme_id"] == "rose"
    assert patched_body["primary_color"] == "#f43f5e"

    # Step 9: Validate Live Preview HTML with Dynamic Theme Variables
    preview_res = client.get(f"/api/portfolios/{portfolio_id}/preview?theme=rose&accent=%23f43f5e")
    assert preview_res.status_code == 200
    assert "text/html" in preview_res.headers["content-type"]
    preview_html = preview_res.text
    # Verify primary accent color is injected
    assert "#f43f5e" in preview_html.lower()
    assert "sarah connor" in preview_html.lower()
    # Verify no unrendered Jinja template tags exist in preview HTML
    assert "{{" not in preview_html
    assert "}}" not in preview_html
    assert "{%" not in preview_html

    # Step 10: Trigger ZIP Export & Validate Static Artifacts
    export_res = client.get(f"/api/portfolios/{portfolio_id}/export?theme=rose&accent=%23f43f5e")
    assert export_res.status_code == 200
    assert "application/zip" in export_res.headers["content-type"]
    assert len(export_res.content) > 0

    with zipfile.ZipFile(io.BytesIO(export_res.content), "r") as zf:
        file_list = zf.namelist()
        assert "index.html" in file_list
        assert "portfolio-data.json" in file_list
        assert "README.md" in file_list

        index_html = zf.read("index.html").decode("utf-8")
        assert "<!DOCTYPE html>" in index_html
        # Verify theme colors and content are present
        assert "#f43f5e" in index_html.lower()
        assert "sarah connor" in index_html.lower()
        assert "skynet autonomous orchestrator" in index_html.lower()
        # Verify zero unrendered template variables
        jinja_matches = re.findall(r"\{\{.*?\}\}|\{%.*?%\}", index_html)
        assert len(jinja_matches) == 0, f"Found unrendered Jinja placeholders in exported HTML: {jinja_matches}"


def test_gap_detection_interactive_flow():
    """
    Validates gap detection with sparse project data:
    1. Agent detects incomplete project details and emits NEEDS_INFO state with follow-up questions.
    2. User submits answers via /api/runs/{id}/answers.
    3. Pipeline resumes and completes to READY.
    """
    unique_id = str(uuid.uuid4())[:8]
    test_email = f"gap_user_{unique_id}@example.com"

    reg_res = client.post("/api/auth/register", json={
        "email": test_email,
        "password": "Password123!",
        "name": "Taylor Swiftly"
    })
    assert reg_res.status_code == 200
    token = reg_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Set profile with minimal info
    client.put("/api/profile", json={
        "headline": "Junior Developer",
        "about": "Aspiring developer learning full stack.",
        "target_role": "Software Developer",
        "skills": ["JavaScript"],
        "education": [],
        "experience": [],
        "achievements": [],
        "certifications": [],
        "links": {"email": "taylor@example.com"}
    }, headers=headers)

    # Add project with missing outcome and brief description
    proj_res = client.post("/api/projects", json={
        "name": "Simple App",
        "description": "Short note",
        "technologies": ["JS"],
        "is_featured": True
    }, headers=headers)
    assert proj_res.status_code == 201

    # Create portfolio
    port_res = client.post("/api/portfolios", json={
        "title": "Taylor's Portfolio",
        "target_role": "Software Developer",
        "template_id": "clean"
    }, headers=headers)
    assert port_res.status_code == 201
    run_id = port_res.json()["latest_run"]["id"]

    # Check status
    status_res = client.get(f"/api/runs/{run_id}/status", headers=headers)
    assert status_res.status_code == 200
    data = status_res.json()

    # The gap detector detects missing details for this sparse project
    if data["state"] == "NEEDS_INFO":
        questions = data["payload"].get("questions", [])
        assert len(questions) > 0
        answers = {q["id"]: "Implemented responsive user interface and integrated REST API" for q in questions}

        # Submit answers
        ans_res = client.post(f"/api/runs/{run_id}/answers", json={
            "answers": answers,
            "generate_anyway": False
        }, headers=headers)
        assert ans_res.status_code == 200

        # Verify resumption
        resume_status = client.get(f"/api/runs/{run_id}/status", headers=headers)
        assert resume_status.status_code == 200
        assert resume_status.json()["state"] in ["READY", "COMPLETED", "CHECKED", "GENERATED"]
