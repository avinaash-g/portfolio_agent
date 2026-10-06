from typing import Any
from app.agent.llm_client import LLMClient
from app.schemas import ProfileAnalysis

class ProfileAnalyzer:
    def __init__(self, llm_client: LLMClient):
        self.llm_client = llm_client

    def analyze(self, profile_data: dict[str, Any], target_role: str) -> ProfileAnalysis:
        context = {
            "target_role": target_role,
            "profile_json": profile_data
        }
        prompt = self.llm_client.load_prompt("profile_analyzer", context)
        return self.llm_client.generate_structured(
            prompt=prompt,
            response_schema=ProfileAnalysis,
            temperature=0.2,
            stage_name="profile_analyzer",
            context=context
        )
