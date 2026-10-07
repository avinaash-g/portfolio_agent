import os
import uuid
import zipfile
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.database import SessionLocal
from app.models import User, Profile, Portfolio, PortfolioVersion
from app.export.renderer import render_portfolio_html, export_portfolio_zip, LAYOUT_TEMPLATES
from app.services.deployer import deploy_portfolio, STATIC_DEPLOYMENTS_DIR
from app.agent.portfolio_planner import PortfolioPlanner
from app.agent.llm_client import LLMClient
from app.schemas import ProfileAnalysis

client = TestClient(app)

@pytest.fixture
def sample_portfolio_content():
    return {
        "hero": {
            "title": "Principal Systems Engineer",
            "tagline": "Architecting resilient distributed microservices and low-latency storage engines."
        },
        "about": "Systems engineer with deep expertise in performance engineering, distributed consensus, and Rust/Python runtimes.",
        "skills": {
            "Core": ["Rust", "Python", "Go", "C++"],
            "Distributed Systems": ["Kafka", "Raft", "Redis", "gRPC"],
            "Cloud & Infra": ["Kubernetes", "AWS", "PostgreSQL", "Terraform"]
        },
        "featured_projects": [
            {
                "name": "Chronos Key-Value Engine",
                "overview": "Distributed LSM-tree storage engine handling 100k writes/sec with Raft consensus.",
                "solution": "Built memory-mapped SSTables with WAL journaling and zero-copy deserialization in Rust.",
                "technologies": ["Rust", "Raft", "gRPC", "RocksDB"],
                "key_features": ["Zero-copy I/O", "Dynamic compaction", "Automated partition healing"],
                "role": "Architect & Core Maintainer",
                "links": {"github": "https://github.com/example/chronos-engine"}
            },
            {
                "name": "Nexus Event Gateway",
                "overview": "High-throughput edge gateway routing sensor streams with sub-millisecond latency.",
                "solution": "Engineered an asynchronous pipeline leveraging Tokio and Kafka backpressure management.",
                "technologies": ["Rust", "Kafka", "Docker", "Prometheus"],
                "key_features": ["Adaptive batching", "Circuit breaking"],
                "role": "Lead Engineer",
                "links": {"github": "https://github.com/example/nexus-gateway"}
            }
        ],
        "other_projects": [
            {
                "name": "Dotfiles & Dev Environment",
                "description": "Custom Neovim and Zsh terminal developer configuration."
            }
        ],
        "experience": [
            {
                "role": "Senior Infrastructure Engineer",
                "company": "Distributed Core Inc",
                "duration": "2022 - Present",
                "location": "San Francisco, CA",
                "highlights": [
                    "Scaled event processing clusters across 3 regions",
                    "Reduced p99 tail latency from 45ms to 8ms"
                ]
            }
        ],
        "education": [
            {
                "institution": "University of Technology",
                "degree": "B.S. in Computer Science",
                "year": "2021",
                "details": "Distributed Systems & Compilers"
            }
        ],
        "achievements": [
            {
                "title": "Author of RFC-889",
                "description": "Standardized binary wire protocol for sensor telemetry",
                "year": "2023"
            }
        ],
        "contact": {
            "email": "systems.engineer@example.com",
            "github": "https://github.com/systems-eng",
            "linkedin": "https://linkedin.com/in/systems-eng"
        }
    }


def test_different_layouts_produce_distinct_html_and_css_structures(sample_portfolio_content):
    """
    Verify that all 4 curated layouts render distinct HTML structures,
    CSS grid architectures, and dedicated container classes.
    """
    user_name = "Alex Stone"

    # 1. Modern Grid / Bento
    html_bento = render_portfolio_html(
        sample_portfolio_content,
        template_id="clean",
        user_name=user_name,
        layout_id="modern_grid"
    )
    assert "<!DOCTYPE html>" in html_bento
    assert "bento-grid" in html_bento
    assert "bento-card" in html_bento
    assert "Chronos Key-Value Engine" in html_bento

    # 2. Chronological Case-Study Story
    html_story = render_portfolio_html(
        sample_portfolio_content,
        template_id="clean",
        user_name=user_name,
        layout_id="case_study_story"
    )
    assert "<!DOCTYPE html>" in html_story
    assert "case-study-story" in html_story
    assert "case-study-card" in html_story
    assert "timeline-node" in html_story

    # 3. Minimalist Sidebar / Split-Screen
    html_sidebar = render_portfolio_html(
        sample_portfolio_content,
        template_id="clean",
        user_name=user_name,
        layout_id="sidebar_split"
    )
    assert "<!DOCTYPE html>" in html_sidebar
    assert "sidebar-split-layout" in html_sidebar
    assert "split-container" in html_sidebar
    assert "sidebar-fixed" in html_sidebar
    assert "nav-indicator" in html_sidebar

    # 4. Executive / Terminal Minimalist
    html_terminal = render_portfolio_html(
        sample_portfolio_content,
        template_id="clean",
        user_name=user_name,
        layout_id="terminal_minimalist"
    )
    assert "<!DOCTYPE html>" in html_terminal
    assert "terminal-window" in html_terminal
    assert "terminal-header" in html_terminal
    assert "terminal-command" in html_terminal
    assert "whoami" in html_terminal

    # Verify cross-layout structural exclusivity
    # Modern bento signature should NOT appear in terminal layout
    assert "bento-grid" not in html_terminal
    # Terminal screen signature should NOT appear in bento layout
    assert "terminal-window" not in html_bento
    # Story timeline signature should NOT appear in terminal layout
    assert "timeline-node" not in html_terminal
    # Fixed sidebar signature should NOT appear in modern bento
    assert "sidebar-fixed" not in html_bento


def test_export_zip_preserves_selected_layout(sample_portfolio_content):
    """
    Verify that exporting the portfolio as a static ZIP packages the exact selected layout.
    """
    zip_buffer = export_portfolio_zip(
        sample_portfolio_content,
        template_id="clean",
        user_name="Jordan Dev",
        layout_id="terminal_minimalist"
    )
    assert zip_buffer.getbuffer().nbytes > 0

    with zipfile.ZipFile(zip_buffer, "r") as zf:
        namelist = zf.namelist()
        assert "index.html" in namelist
        assert "portfolio-data.json" in namelist
        assert "README.md" in namelist

        index_html = zf.read("index.html").decode("utf-8")
        assert "terminal-window" in index_html
        assert "whoami" in index_html
        assert "Chronos Key-Value Engine" in index_html


def test_natural_language_custom_layout_planning():
    """
    Verify the Planning Agent interprets natural language layout instructions
    and dynamically rearranges section_order and layout configurations.
    """
    llm_client = LLMClient()
    planner = PortfolioPlanner(llm_client)

    profile_analysis = ProfileAnalysis(
        target_role="Full Stack Engineer",
        experience_level="Mid-Level",
        primary_areas_of_expertise=["Web Apps"],
        technical_skills_identified=["Python", "React"]
    )

    custom_prompt = (
        "Put featured projects right under the hero before skills, "
        "and format case studies as compact cards with expandable details"
    )

    plan = planner.plan(
        profile_analysis=profile_analysis,
        project_analyses=[],
        target_role="Full Stack Engineer",
        clarification_answers={},
        profile_data={
            "skills": ["Python", "React"],
            "experience": [{"role": "Dev", "company": "Tech Corp", "duration": "2023"}],
            "education": [{"institution": "Tech Univ", "degree": "BS", "year": "2023"}]
        },
        projects_data=[
            {"id": "p1", "name": "App 1", "description": "Web app", "technologies": ["React"]}
        ],
        layout_id="modern_grid",
        custom_layout_prompt=custom_prompt
    )

    # Verify custom instruction rearranged section_order
    order = plan.section_order
    assert "hero" in order
    assert "featured_projects" in order
    assert "skills" in order

    # featured_projects should come BEFORE skills due to the prompt
    proj_idx = order.index("featured_projects")
    skills_idx = order.index("skills")
    assert proj_idx < skills_idx

    assert plan.custom_layout_prompt == custom_prompt


def test_deploy_portfolio_service(sample_portfolio_content):
    """
    Verify that deploy_portfolio service packages the static directory and
    returns a complete DeploymentResponse with status, live URL, and preview URL.
    """
    result = deploy_portfolio(
        content=sample_portfolio_content,
        user_name="Morgan Tech",
        slug="morgan-test-deploy",
        layout_id="sidebar_split",
        template_id="dark",
        provider="mock"
    )

    assert result.status == "deployed"
    assert result.url.startswith("http")
    assert "morgan-test-deploy" in result.url
    assert result.preview_url.startswith("/deployed/")
    assert result.provider == "mock"
    assert result.deployed_at is not None

    # Verify static files were physically written to disk
    deploy_dir = STATIC_DEPLOYMENTS_DIR / "morgan-test-deploy"
    assert deploy_dir.exists()
    assert (deploy_dir / "index.html").exists()
    assert (deploy_dir / "portfolio-data.json").exists()
    assert (deploy_dir / "README.md").exists()

    # Verify index.html in the deployed folder has the sidebar_split layout
    deployed_html = (deploy_dir / "index.html").read_text(encoding="utf-8")
    assert "sidebar-split-layout" in deployed_html
    assert "split-container" in deployed_html
    assert "Chronos Key-Value Engine" in deployed_html


def test_deploy_api_endpoint_and_live_url(sample_portfolio_content):
    """
    Test the full API flow:
    1. Register user
    2. Directly prepare a generated Portfolio and PortfolioVersion in DB
    3. Call POST /api/portfolios/{id}/deploy
    4. Verify returned payload and live file accessibility via FastAPI StaticFiles
    """
    unique_id = str(uuid.uuid4())[:8]
    test_email = f"deploy_{unique_id}@example.com"

    # Register user
    reg_res = client.post("/api/auth/register", json={
        "email": test_email,
        "password": "DeployPassword123!",
        "name": "Sam Shipper"
    })
    assert reg_res.status_code == 200
    token = reg_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Retrieve user and create profile, portfolio, version directly in DB
    db = SessionLocal()
    user = db.query(User).filter(User.email == test_email).first()
    assert user is not None

    profile = Profile(
        user_id=user.id,
        target_role="Cloud Architect",
        headline="DevOps & Cloud Engineer",
        about="Shipping autonomous cloud systems.",
        skills=["Kubernetes", "Docker", "Go"]
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)

    portfolio = Portfolio(
        user_id=user.id,
        profile_id=profile.id,
        title="Sam's Cloud Portfolio",
        target_role="Cloud Architect",
        template_id="clean",
        layout_id="case_study_story",
        custom_layout_prompt="Put featured projects right under the hero before skills",
        theme_id="emerald",
        primary_color="#10b981",
        status="generated"
    )
    db.add(portfolio)
    db.commit()
    db.refresh(portfolio)

    version = PortfolioVersion(
        portfolio_id=portfolio.id,
        version_number=1,
        plan={"layout_id": "case_study_story"},
        content=sample_portfolio_content,
        quality_report={"score": 92, "issues": []},
        created_by="agent",
        change_summary="Initial generated portfolio"
    )
    db.add(version)
    db.commit()
    db.refresh(version)

    portfolio.current_version_id = version.id
    db.commit()
    portfolio_id = portfolio.id
    db.close()

    # Call Deploy Endpoint: POST /api/portfolios/{id}/deploy
    deploy_res = client.post(
        f"/api/portfolios/{portfolio_id}/deploy",
        json={"provider": "mock"},
        headers=headers
    )
    assert deploy_res.status_code == 200
    deploy_data = deploy_res.json()

    assert deploy_data["status"] == "deployed"
    assert "url" in deploy_data
    assert "preview_url" in deploy_data
    assert deploy_data["provider"] in ["Netlify", "Local Preview", "mock"]
    assert deploy_data["deployed_at"] is not None

    # Fetch portfolio to confirm DB state was updated
    get_res = client.get(f"/api/portfolios/{portfolio_id}", headers=headers)
    assert get_res.status_code == 200
    updated_p = get_res.json()
    assert updated_p["deployment_status"] == "deployed"
    assert updated_p["deployment_url"] == deploy_data["url"]
    assert updated_p["layout_id"] == "case_study_story"

    # Test static preview HTML endpoint works with layout query param
    preview_res = client.get(f"/api/portfolios/{portfolio_id}/preview?layout=terminal_minimalist")
    assert preview_res.status_code == 200
    assert "terminal-window" in preview_res.text

    # Test deployed static URL is physically accessible through FastAPI static mount
    preview_path = deploy_data["preview_url"]
    if preview_path.startswith("http"):
        # extract relative path
        from urllib.parse import urlparse
        preview_path = urlparse(preview_path).path
    static_file_res = client.get(preview_path)
    assert static_file_res.status_code == 200
    assert "Chronos Key-Value Engine" in static_file_res.text


def test_deploy_auto_zero_config_fallback(sample_portfolio_content):
    """
    Test zero-config real public cloud deployment when provider is 'auto':
    1. Returns HTTP 200 with status='success' and public cloud provider
    2. URL points to real public HTTPS domain (never localhost:8000)
    3. Dedicated static preview route immediately serves 200 OK HTML for local iframe
    """
    unique_id = str(uuid.uuid4())[:8]
    test_email = f"fallback_{unique_id}@example.com"

    reg_res = client.post("/api/auth/register", json={
        "email": test_email,
        "password": "FallbackPassword123!",
        "name": "Alex Fallback"
    })
    assert reg_res.status_code == 200
    token = reg_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    db = SessionLocal()
    user = db.query(User).filter(User.email == test_email).first()
    profile = Profile(
        user_id=user.id,
        target_role="Full Stack Engineer",
        headline="Full Stack Engineer",
        about="Building robust resilient apps.",
        skills=["Python", "FastAPI", "React"]
    )
    db.add(profile)
    db.commit()

    portfolio = Portfolio(
        user_id=user.id,
        profile_id=profile.id,
        title="Alex's Portfolio",
        target_role="Full Stack Engineer",
        template_id="clean",
        layout_id="modern_grid",
        theme_id="emerald",
        primary_color="#10b981",
        status="generated"
    )
    db.add(portfolio)
    db.commit()

    version = PortfolioVersion(
        portfolio_id=portfolio.id,
        version_number=1,
        plan={"layout_id": "modern_grid"},
        content=sample_portfolio_content,
        quality_report={"score": 95, "issues": []},
        created_by="agent",
        change_summary="Initial portfolio"
    )
    db.add(version)
    db.commit()

    portfolio.current_version_id = version.id
    db.commit()
    p_id = portfolio.id
    db.close()

    # Call POST /api/portfolios/{id}/deploy with provider="auto"
    deploy_res = client.post(
        f"/api/portfolios/{p_id}/deploy",
        json={"provider": "auto"},
        headers=headers
    )
    assert deploy_res.status_code == 200
    deploy_data = deploy_res.json()

    assert deploy_data["status"] == "success"
    assert deploy_data["provider"] in ["Netlify", "DeedPage Cloud", "Vercel", "GitHub HTML Preview"]
    assert deploy_data["url"].startswith("https://")
    assert "localhost" not in deploy_data["url"]
    assert "127.0.0.1" not in deploy_data["url"]
    assert deploy_data["preview_url"] == f"/deployed/{p_id}/index.html"

    # Verify dedicated preview routes: GET /deployed/{portfolio_id}/index.html, GET /deployed/{portfolio_id}/
    resp_index = client.get(f"/deployed/{p_id}/index.html")
    assert resp_index.status_code == 200
    assert "Chronos Key-Value Engine" in resp_index.text

    resp_dir = client.get(f"/deployed/{p_id}/")
    assert resp_dir.status_code == 200
    assert "Chronos Key-Value Engine" in resp_dir.text

    resp_clean = client.get(f"/deployed/{p_id}")
    assert resp_clean.status_code == 200
    assert "Chronos Key-Value Engine" in resp_clean.text


def test_deploy_netlify_zip_api_mocked(sample_portfolio_content, monkeypatch):
    """
    Test Netlify Zip API deployment flow:
    When Netlify API succeeds, returns status='success', provider='Netlify', and ssl_url.
    """
    unique_id = str(uuid.uuid4())[:8]
    test_email = f"netlify_{unique_id}@example.com"

    reg_res = client.post("/api/auth/register", json={
        "email": test_email,
        "password": "NetlifyPassword123!",
        "name": "Taylor Netlify"
    })
    assert reg_res.status_code == 200
    token = reg_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    db = SessionLocal()
    user = db.query(User).filter(User.email == test_email).first()
    profile = Profile(
        user_id=user.id,
        target_role="Frontend Engineer",
        headline="Frontend Engineer",
        about="Frontend craftsman.",
        skills=["React", "TypeScript"]
    )
    db.add(profile)
    db.commit()

    portfolio = Portfolio(
        user_id=user.id,
        profile_id=profile.id,
        title="Taylor's Portfolio",
        target_role="Frontend Engineer",
        template_id="clean",
        layout_id="bento_showcase",
        theme_id="emerald",
        primary_color="#10b981",
        status="generated"
    )
    db.add(portfolio)
    db.commit()

    version = PortfolioVersion(
        portfolio_id=portfolio.id,
        version_number=1,
        plan={"layout_id": "bento_showcase"},
        content=sample_portfolio_content,
        quality_report={"score": 98, "issues": []},
        created_by="agent",
        change_summary="Initial portfolio"
    )
    db.add(version)
    db.commit()

    portfolio.current_version_id = version.id
    db.commit()
    p_id = portfolio.id
    db.close()

    mock_ssl_url = "https://taylor-portfolio-1234.netlify.app"

    # Mock httpx.post and httpx.get for Netlify Zip API
    class MockResponse:
        def __init__(self, status_code, json_data=None, text=""):
            self.status_code = status_code
            self._json = json_data or {}
            self.text = text
        def json(self):
            return self._json

    import httpx
    def mock_post(url, *args, **kwargs):
        if "api.netlify.com" in url:
            return MockResponse(201, {"ssl_url": mock_ssl_url, "url": mock_ssl_url})
        return MockResponse(404)

    def mock_get(url, *args, **kwargs):
        if mock_ssl_url in url:
            return MockResponse(200, text="Mock Netlify HTML")
        return MockResponse(404)

    monkeypatch.setattr(httpx, "post", mock_post)
    monkeypatch.setattr(httpx, "get", mock_get)

    deploy_res = client.post(
        f"/api/portfolios/{p_id}/deploy",
        json={"provider": "netlify", "token": "fake-netlify-token"},
        headers=headers
    )
    assert deploy_res.status_code == 200
    deploy_data = deploy_res.json()

    assert deploy_data["status"] == "success"
    assert deploy_data["provider"] == "Netlify"
    assert deploy_data["url"] == mock_ssl_url

