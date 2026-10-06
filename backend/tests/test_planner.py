import pytest
from app.agent.portfolio_planner import PortfolioPlanner
from app.agent.llm_client import LLMClient
from app.schemas import ProfileAnalysis, ProjectAnalysis

def test_planner_role_personalization():
    llm_client = LLMClient()
    planner = PortfolioPlanner(llm_client)

    profile_analysis = ProfileAnalysis(
        target_role="AI Engineer",
        experience_level="Junior",
        primary_areas_of_expertise=["AI/ML"],
        technical_skills_identified=["Python", "PyTorch", "LangChain"]
    )

    projects = [
        {"id": "p1", "name": "LLM Rag Agent", "description": "Agentic system", "technologies": ["Python", "LangChain"]},
        {"id": "p2", "name": "Vision Classifier", "description": "ResNet classifier", "technologies": ["PyTorch"]},
        {"id": "p3", "name": "Speech Transcriber", "description": "Whisper audio", "technologies": ["Python"]},
        {"id": "p4", "name": "Portfolio Site", "description": "Static HTML", "technologies": ["HTML", "CSS"]},
        {"id": "p5", "name": "Utility Scripts", "description": "Helper scripts", "technologies": ["Bash"]}
    ]

    profile_data = {
        "skills": ["Python", "PyTorch", "LangChain", "FastAPI"],
        "experience": [],  # empty: should be omitted
        "education": [{"institution": "Tech Univ", "degree": "BS CS", "year": "2024"}]
    }

    plan = planner.plan(
        profile_analysis=profile_analysis,
        project_analyses=[],
        target_role="AI Engineer",
        clarification_answers={},
        profile_data=profile_data,
        projects_data=projects
    )

    assert plan.target_role == "AI Engineer"
    assert "experience" in plan.omitted_sections
    assert "education" in plan.included_sections
    assert len(plan.featured_project_ids) <= 4
    assert len(plan.other_project_ids) > 0
    assert "AI/ML" in plan.role_emphasis.primary_focus or "Intelligent" in plan.role_emphasis.primary_focus
