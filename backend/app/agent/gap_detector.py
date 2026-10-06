from typing import Any
from app.agent.llm_client import LLMClient
from app.schemas import GapDetectorOutput, ProfileAnalysis, ProjectAnalysis

class GapDetector:
    def __init__(self, llm_client: LLMClient):
        self.llm_client = llm_client

    def detect(
        self,
        profile_analysis: ProfileAnalysis,
        project_analyses: list[ProjectAnalysis],
        target_role: str,
        raw_projects: list[dict[str, Any]]
    ) -> GapDetectorOutput:
        context = {
            "target_role": target_role,
            "profile_analysis": profile_analysis.model_dump(),
            "project_analyses": [p.model_dump() for p in project_analyses],
            "raw_projects": raw_projects
        }
        prompt = self.llm_client.load_prompt("gap_detector", context)
        return self.llm_client.generate_structured(
            prompt=prompt,
            response_schema=GapDetectorOutput,
            temperature=0.3,
            stage_name="gap_detector",
            context=context
        )
