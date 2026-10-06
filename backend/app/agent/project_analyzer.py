from typing import Any
from app.agent.llm_client import LLMClient
from app.schemas import ProjectAnalysis

class ProjectAnalyzer:
    def __init__(self, llm_client: LLMClient):
        self.llm_client = llm_client

    def analyze(self, project_data: dict[str, Any], target_role: str) -> ProjectAnalysis:
        context = {
            "target_role": target_role,
            "project_json": project_data
        }
        prompt = self.llm_client.load_prompt("project_analyzer", context)
        return self.llm_client.generate_structured(
            prompt=prompt,
            response_schema=ProjectAnalysis,
            temperature=0.2,
            stage_name="project_analyzer",
            context=context
        )
