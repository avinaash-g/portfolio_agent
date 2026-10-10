import os
import json
import re
import logging
from pathlib import Path
from typing import Type, TypeVar, Optional, Any
from pydantic import BaseModel, ValidationError

from app.config import settings

logger = logging.getLogger("agent.llm_client")

T = TypeVar("T", bound=BaseModel)

class LLMClient:
    """
    Abstracted LLM Client supporting Google Gemini API with structured JSON output,
    Pydantic schema validation, and automatic retries.
    Includes a deterministic fallback engine for offline development, CI tests, or missing API keys.
    """

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.model_name = model or settings.GEMINI_MODEL
        self._genai_client = None
        self._prompts_dir = Path(__file__).resolve().parent.parent / "prompts" / "v1"

        if self.api_key:
            try:
                from google import genai
                self._genai_client = genai.Client(api_key=self.api_key, http_options={"timeout": 10000})
                logger.info(f"Initialized Google GenAI client with model {self.model_name}")
            except Exception as e:
                logger.warning(f"Could not initialize Google GenAI SDK: {e}. Will use deterministic fallback.")

    def reconfigure(self, api_key: str, model: Optional[str] = None):
        """Allows dynamic reconfiguration of Gemini client with a new API key."""
        self.api_key = api_key
        if model:
            self.model_name = model
        if self.api_key:
            try:
                from google import genai
                self._genai_client = genai.Client(api_key=self.api_key, http_options={"timeout": 10000})
                logger.info(f"Reconfigured Google GenAI client with model {self.model_name}")
            except Exception as e:
                logger.warning(f"Could not reconfigure GenAI client: {e}")
        else:
            self._genai_client = None


    def load_prompt(self, template_name: str, context: dict[str, Any]) -> str:
        """Loads a versioned prompt template and replaces {{ key }} tags."""
        prompt_path = self._prompts_dir / f"{template_name}.txt"
        if not prompt_path.exists():
            raise FileNotFoundError(f"Prompt template {template_name}.txt not found at {prompt_path}")
        
        template = prompt_path.read_text(encoding="utf-8")
        for key, value in context.items():
            str_val = json.dumps(value, indent=2) if isinstance(value, (dict, list)) else str(value)
            template = template.replace(f"{{{{ {key} }}}}", str_val)
            template = template.replace(f"{{{{{key}}}}}", str_val)
        return template

    def _clean_json_response(self, text: str) -> str:
        """Extracts JSON from text, handling markdown fences."""
        text = text.strip()
        # Remove markdown code fences if present
        fence_match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text, re.IGNORECASE)
        if fence_match:
            return fence_match.group(1).strip()
        return text

    def generate_structured(
        self,
        prompt: str,
        response_schema: Type[T],
        temperature: float = 0.3,
        stage_name: str = "generic",
        context: Optional[dict[str, Any]] = None,
        max_retries: int = 2
    ) -> T:
        """
        Executes prompt and returns a validated Pydantic model instance.
        If Gemini is configured, it calls Gemini with structured JSON output and retries on validation errors.
        If no API key or call fails, it uses the high-fidelity deterministic engine.
        """
        if self._genai_client and not getattr(self, "_quota_exhausted", False):
            attempt = 0
            current_prompt = prompt
            last_error = ""

            while attempt <= max_retries:
                try:
                    from google.genai import types
                    
                    schema_json = json.dumps(response_schema.model_json_schema())
                    system_instruction = (
                        f"You are an expert AI agent adhering strictly to structured JSON output.\n"
                        f"Target Schema:\n{schema_json}\n"
                        f"CRITICAL: Never fabricate user facts, metrics, or company names."
                    )
                    
                    response = self._genai_client.models.generate_content(
                        model=self.model_name,
                        contents=current_prompt,
                        config=types.GenerateContentConfig(
                            response_mime_type="application/json",
                            temperature=temperature,
                            system_instruction=system_instruction
                        )
                    )

                    clean_text = self._clean_json_response(response.text)
                    validated = response_schema.model_validate_json(clean_text)
                    return validated

                except (ValidationError, json.JSONDecodeError) as ve:
                    attempt += 1
                    last_error = str(ve)
                    logger.warning(f"Schema validation error on attempt {attempt} for {stage_name}: {last_error}")
                    if attempt <= max_retries:
                        current_prompt = (
                            f"{prompt}\n\n"
                            f"PREVIOUS ATTEMPT FAILED WITH VALIDATION ERROR:\n{last_error}\n"
                            f"Please fix the error and output strictly valid JSON matching the schema."
                        )
                except Exception as api_err:
                    err_msg = str(api_err)
                    logger.error(f"Gemini API error during {stage_name}: {err_msg}. Falling back to deterministic engine.")
                    if "RESOURCE_EXHAUSTED" in err_msg or "429" in err_msg:
                        self._quota_exhausted = True
                    break

        # Fallback deterministic execution
        return self._generate_deterministic(stage_name, context or {}, response_schema)

    def _generate_deterministic(
        self,
        stage_name: str,
        context: dict[str, Any],
        response_schema: Type[T]
    ) -> T:
        """
        High-fidelity deterministic pipeline adhering 100% to PRD rules and factual integrity.
        Ensures zero hallucinations, zero fabricated metrics, and complete role tailoring.
        """
        from app.agent.deterministic_engine import handle_deterministic_stage
        return handle_deterministic_stage(stage_name, context, response_schema)
