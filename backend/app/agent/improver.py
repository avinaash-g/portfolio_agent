from typing import Any
from app.agent.llm_client import LLMClient
from app.schemas import ImproverOutput, PortfolioContent, QualityReport

class PortfolioImprover:
    def __init__(self, llm_client: LLMClient):
        self.llm_client = llm_client

    def improve(
        self,
        current_content: PortfolioContent,
        quality_report: QualityReport,
        target_role: str,
        raw_user_data: dict[str, Any]
    ) -> ImproverOutput:
        context = {
            "target_role": target_role,
            "raw_user_data": raw_user_data,
            "current_portfolio": current_content.model_dump(),
            "quality_report": quality_report.model_dump()
        }
        prompt = self.llm_client.load_prompt("improver", context)
        return self.llm_client.generate_structured(
            prompt=prompt,
            response_schema=ImproverOutput,
            temperature=0.3,
            stage_name="improver",
            context=context
        )
