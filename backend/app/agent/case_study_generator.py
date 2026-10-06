from typing import Any
from app.agent.llm_client import LLMClient
from app.schemas import CaseStudyGenOutput, PortfolioPlan

class CaseStudyGenerator:
    def __init__(self, llm_client: LLMClient):
        self.llm_client = llm_client

    def generate(
        self,
        plan: PortfolioPlan,
        projects_data: list[dict[str, Any]],
        target_role: str
    ) -> CaseStudyGenOutput:
        context = {
            "target_role": target_role,
            "plan_json": plan.model_dump(),
            "projects_data_json": projects_data
        }
        prompt = self.llm_client.load_prompt("case_study_generator", context)
        return self.llm_client.generate_structured(
            prompt=prompt,
            response_schema=CaseStudyGenOutput,
            temperature=0.5,
            stage_name="case_study_generator",
            context=context
        )
