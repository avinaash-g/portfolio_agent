from typing import Any
from app.agent.llm_client import LLMClient
from app.schemas import PortfolioPlan, ProfileAnalysis, ProjectAnalysis

class PortfolioPlanner:
    def __init__(self, llm_client: LLMClient):
        self.llm_client = llm_client

    def plan(
        self,
        profile_analysis: ProfileAnalysis,
        project_analyses: list[ProjectAnalysis],
        target_role: str,
        clarification_answers: dict[str, str],
        profile_data: dict[str, Any],
        projects_data: list[dict[str, Any]],
        layout_id: str = "modern_grid",
        custom_layout_prompt: str | None = None
    ) -> PortfolioPlan:
        context = {
            "target_role": target_role,
            "profile_analysis": profile_analysis.model_dump(),
            "project_analyses": [p.model_dump() for p in project_analyses],
            "clarification_answers": clarification_answers,
            "profile_data": profile_data,
            "projects_data": projects_data,
            "layout_id": layout_id,
            "custom_layout_prompt": custom_layout_prompt
        }
        prompt = self.llm_client.load_prompt("portfolio_planner", context)
        return self.llm_client.generate_structured(
            prompt=prompt,
            response_schema=PortfolioPlan,
            temperature=0.3,
            stage_name="portfolio_planner",
            context=context
        )
