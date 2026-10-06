import pytest
from app.agent.quality_checker import QualityChecker
from app.agent.llm_client import LLMClient
from app.schemas import (
    PortfolioContent,
    HeroSection,
    FeaturedProject,
    ContactSection,
    ProjectLinks
)

def test_quality_checker_unsupported_claims_detection():
    llm_client = LLMClient()
    checker = QualityChecker(llm_client)

    raw_user_data = {
        "skills": ["Python", "FastAPI"],
        "description": "A web API for managing tasks."
    }

    # Contrive a portfolio that has a fabricated metric "reduced latency by 45%" not present in raw data
    hallucinated_portfolio = PortfolioContent(
        hero=HeroSection(title="Backend Engineer", tagline="Fast reliable services"),
        about="Dedicated developer specializing in backend APIs.",
        skills={"Backend": ["Python", "FastAPI"]},
        featured_projects=[
            FeaturedProject(
                name="Task Master",
                overview="A web API for managing tasks with 45% latency improvement.",  # Fabricated 45%
                solution="Built using FastAPI and SQLite.",
                technologies=["Python", "FastAPI"],
                links=ProjectLinks()
            )
        ],
        other_projects=[],
        contact=ContactSection(email="dev@example.com")
    )

    report = checker.check(
        portfolio_content=hallucinated_portfolio,
        target_role="Backend Engineer",
        raw_user_data=raw_user_data
    )

    # Should detect high severity unsupported claim and fail the gate
    assert report.passed is False
    assert any(i.severity == "High" for i in report.issues)
    assert any("45%" in i.description for i in report.issues)
    assert report.checklist["no_unsupported_claims"].score < 20

def test_quality_checker_passes_truthful_portfolio():
    llm_client = LLMClient()
    checker = QualityChecker(llm_client)

    raw_user_data = {
        "skills": ["Python", "FastAPI", "React", "PostgreSQL"],
        "contact": {"email": "dev@example.com", "github": "https://github.com/dev"}
    }

    valid_portfolio = PortfolioContent(
        hero=HeroSection(title="Software Developer", tagline="Building robust web applications and APIs."),
        about="Developer focused on delivering solid software with clean code and modern design.",
        skills={"Languages": ["Python", "JavaScript"], "Backend": ["FastAPI", "PostgreSQL"], "Frontend": ["React"]},
        featured_projects=[
            FeaturedProject(
                name="Task Manager",
                overview="Task Manager is a full-stack project enabling users to organize daily sprints.",
                solution="Architected using FastAPI and React with relational modeling in PostgreSQL.",
                technologies=["FastAPI", "React", "PostgreSQL"],
                key_features=["User authentication", "Task sorting and status updates"],
                role="Full-Stack Developer",
                links=ProjectLinks(github="https://github.com/dev/tasks")
            ),
            FeaturedProject(
                name="Analytics Service",
                overview="Microservice that aggregates user activity events and generates daily summaries.",
                solution="Implemented in Python using async endpoints and background task workers.",
                technologies=["Python", "PostgreSQL"],
                key_features=["Async ingestion", "Scheduled aggregations"],
                links=ProjectLinks(github="https://github.com/dev/analytics")
            )
        ],
        other_projects=[],
        contact=ContactSection(email="dev@example.com", github="https://github.com/dev")
    )

    report = checker.check(
        portfolio_content=valid_portfolio,
        target_role="Software Developer",
        raw_user_data=raw_user_data
    )

    assert report.score >= 80
    assert report.passed is True
