import zipfile
import pytest
from app.export.renderer import render_portfolio_html, export_portfolio_zip

@pytest.fixture
def sample_portfolio_content():
    return {
        "hero": {"title": "Software Developer", "tagline": "Building scalable web and AI applications."},
        "about": "Passionate developer crafting modern software systems.",
        "skills": {
            "Languages": ["Python", "JavaScript"],
            "Backend": ["FastAPI", "Node.js"]
        },
        "featured_projects": [
            {
                "name": "E-Commerce App",
                "overview": "Full featured digital store with secure checkout.",
                "solution": "FastAPI backend with React frontend.",
                "technologies": ["React", "FastAPI", "PostgreSQL"],
                "key_features": ["Cart management", "Stripe checkout"],
                "role": "Lead Developer",
                "links": {"github": "https://github.com/example/shop"}
            }
        ],
        "other_projects": [],
        "experience": [],
        "education": [],
        "achievements": [],
        "contact": {"email": "alex@example.com"}
    }

def test_render_clean_template(sample_portfolio_content):
    html = render_portfolio_html(sample_portfolio_content, template_id="clean", user_name="Alex River")
    assert "<!DOCTYPE html>" in html
    assert "Software Developer" in html
    assert "E-Commerce App" in html
    assert "alex@example.com" in html

def test_render_dark_template(sample_portfolio_content):
    html = render_portfolio_html(sample_portfolio_content, template_id="dark", user_name="Alex River")
    assert "<!DOCTYPE html>" in html
    assert "class=\"dark\"" in html or "dark" in html
    assert "bg-[#090d16]" in html or "glass-card" in html

def test_export_zip(sample_portfolio_content):
    zip_buffer = export_portfolio_zip(sample_portfolio_content, template_id="clean", user_name="Alex River")
    assert zip_buffer.getbuffer().nbytes > 0

    # Verify zip contents
    with zipfile.ZipFile(zip_buffer, "r") as zf:
        names = zf.namelist()
        assert "index.html" in names
        assert "portfolio-data.json" in names
        assert "README.md" in names

        index_content = zf.read("index.html").decode("utf-8")
        assert "E-Commerce App" in index_content
