from typing import Any
from app.agent.llm_client import LLMClient
from app.schemas import SectionGenOutput, PortfolioPlan

class SectionGenerator:
    def __init__(self, llm_client: LLMClient):
        self.llm_client = llm_client

    def generate(
        self,
        plan: PortfolioPlan,
        user_data: dict[str, Any],
        target_role: str
    ) -> SectionGenOutput:
        context = {
            "target_role": target_role,
            "plan_json": plan.model_dump(),
            "user_data_json": user_data
        }
        prompt = self.llm_client.load_prompt("section_generator", context)
        return self.llm_client.generate_structured(
            prompt=prompt,
            response_schema=SectionGenOutput,
            temperature=0.6,
            stage_name="section_generator",
            context=context
        )
