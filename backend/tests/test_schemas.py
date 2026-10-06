import pytest
from app.schemas import (
    UserRegister,
    ProfileCreate,
    ProjectCreate,
    PortfolioPlan,
    PortfolioContent,
    QualityReport,
    ChecklistItem,
    HeroSection,
    ContactSection
)

def test_user_register_schema():
    user = UserRegister(email="test@example.com", password="password123", name="Alex Dev")
    assert user.email == "test@example.com"
    assert user.name == "Alex Dev"

def test_profile_schema_defaults():
    profile = ProfileCreate(
        target_role="Software Developer",
        skills=["Python", "FastAPI"]
    )
    assert profile.target_role == "Software Developer"
    assert len(profile.skills) == 2
    assert profile.education == []

def test_portfolio_plan_defaults():
    plan = PortfolioPlan(
        target_role="AI Engineer",
        included_sections=["hero", "about", "skills", "featured_projects"],
        featured_project_ids=["p1", "p2"]
    )
    assert plan.target_role == "AI Engineer"
    assert "hero" in plan.section_order

def test_portfolio_content_validation():
    content = PortfolioContent(
        hero=HeroSection(title="Backend Engineer", tagline="Building scalable distributed systems."),
        about="Experienced software engineer with deep Python expertise.",
        skills={"Backend": ["FastAPI", "PostgreSQL"]},
        featured_projects=[],
        other_projects=[],
        contact=ContactSection(email="alex@example.com")
    )
    assert content.hero.title == "Backend Engineer"
    assert "FastAPI" in content.skills["Backend"]
