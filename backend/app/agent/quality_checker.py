from typing import Any
from app.agent.llm_client import LLMClient
from app.schemas import QualityReport, PortfolioContent

class QualityChecker:
    def __init__(self, llm_client: LLMClient):
        self.llm_client = llm_client

    def check(
        self,
        portfolio_content: PortfolioContent,
        target_role: str,
        raw_user_data: dict[str, Any]
    ) -> QualityReport:
        context = {
            "target_role": target_role,
            "raw_user_data": raw_user_data,
            "generated_portfolio": portfolio_content.model_dump()
        }
        prompt = self.llm_client.load_prompt("quality_checker", context)
        return self.llm_client.generate_structured(
            prompt=prompt,
            response_schema=QualityReport,
            temperature=0.2,
            stage_name="quality_checker",
            context=context
        )
