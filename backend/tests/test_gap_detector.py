import pytest
from app.agent.gap_detector import GapDetector
from app.agent.llm_client import LLMClient
from app.schemas import ProfileAnalysis, ProjectAnalysis

def test_gap_detector_blocking_and_order():
    llm_client = LLMClient()  # Uses deterministic engine in test
    detector = GapDetector(llm_client)

    profile_analysis = ProfileAnalysis(
        target_role="Backend Developer",
        experience_level="Junior",
        primary_areas_of_expertise=["Backend Architecture"],
        technical_skills_identified=["Python", "FastAPI"]
    )

    project_analyses = [
        ProjectAnalysis(
            name="Barebone Project",
            category="Backend",
            technologies=[],  # Missing tech: should trigger blocking gap
            solution_summary=""  # Empty description: should trigger blocking gap
        ),
        ProjectAnalysis(
            name="Solid API",
            category="Backend",
            technologies=["Python", "PostgreSQL"],
            solution_summary="High performance async REST API servicing client requests.",
            github_url="https://github.com/example/solid-api"
        )
    ]

    output = detector.detect(
        profile_analysis=profile_analysis,
        project_analyses=project_analyses,
        target_role="Backend Developer",
        raw_projects=[]
    )

    assert len(output.questions) <= 8
    assert len(output.questions) > 0
    # First question must be blocking
    assert output.questions[0].severity == "blocking"
    assert any("Barebone Project" in q.question for q in output.questions)
