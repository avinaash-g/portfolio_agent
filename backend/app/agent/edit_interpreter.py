from typing import Any
from app.agent.llm_client import LLMClient
from app.schemas import EditInterpreterOutput, PortfolioContent

class EditInterpreter:
    def __init__(self, llm_client: LLMClient):
        self.llm_client = llm_client

    def interpret(
        self,
        instruction: str,
        current_content: PortfolioContent
    ) -> EditInterpreterOutput:
        context = {
            "user_instruction": instruction,
            "current_portfolio": current_content.model_dump()
        }
        prompt = self.llm_client.load_prompt("edit_interpreter", context)
        return self.llm_client.generate_structured(
            prompt=prompt,
            response_schema=EditInterpreterOutput,
            temperature=0.3,
            stage_name="edit_interpreter",
            context=context
        )
