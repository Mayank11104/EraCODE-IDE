from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any
import json


from langchain_openai import AzureChatOpenAI
from src.config.settings import settings
from src.utils.logger import logger


class BaseAgent(ABC):
    """Base class for all agents"""

    def __init__(self, name: str):
        self.name = name
        self.llm = self._initialize_llm()
        logger.info(f"🤖 Initialized {name}")

    def _initialize_llm(self) -> Any:
        if settings.MODEL_PROVIDER == "azure":
            return AzureChatOpenAI(
                azure_deployment=settings.AZURE_OPENAI_DEPLOYMENT_NAME,
                openai_api_version=settings.AZURE_OPENAI_API_VERSION,
                azure_endpoint=settings.AZURE_OPENAI_ENDPOINT,
                api_key=settings.AZURE_OPENAI_API_KEY,
                temperature=settings.TEMPERATURE,
            )

        #if settings.MODEL_PROVIDER == "groq":
        #    return ChatGroq(
        #        model=settings.MODEL_NAME,
        #        temperature=settings.TEMPERATURE,
        #        max_tokens=settings.MAX_TOKENS,
        #        groq_api_key=settings.GROQ_API_KEY,
        #    )
        #raise ValueError(f"Unsupported model provider: {settings.MODEL_PROVIDER}")

    @abstractmethod
    async def execute(self, task: str, context: dict[str, Any]) -> dict[str, Any]:
        pass

    async def _invoke_llm(self, prompt: str) -> str:
        try:
            response = await self.llm.ainvoke(prompt)
            return response.content
        except Exception as e:
            logger.error(f"❌ {self.name} LLM error: {str(e)}")
            raise

    def _parse_json_response(self, content: str) -> dict[str, Any]:
        cleaned = content.strip()

        # Remove markdown fences
        if cleaned.startswith("```"):
            cleaned = cleaned.replace("```json", "").replace("```", "").strip()

        # Try direct parse
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            pass

        # Extract first top-level JSON object by brace matching
        start = cleaned.find("{")
        if start == -1:
            logger.error(f"❌ Failed to parse JSON: no object found")
            logger.error(f"Raw content: {cleaned[:500]}")
            raise ValueError(f"Invalid JSON response from {self.name}")

        depth = 0
        end = None
        for i in range(start, len(cleaned)):
            c = cleaned[i]
            if c == "{":
                depth += 1
            elif c == "}":
                depth -= 1
                if depth == 0:
                    end = i + 1
                    break

        if end is None:
            logger.error(f"❌ Failed to parse JSON: unterminated object")
            logger.error(f"Raw content: {cleaned[:500]}")
            raise ValueError(f"Invalid JSON response from {self.name}")

        candidate = cleaned[start:end]
        try:
            return json.loads(candidate)
        except json.JSONDecodeError as e:
            logger.error(f"❌ Failed to parse JSON: {e}")
            logger.error(f"Raw content: {candidate[:500]}")
            raise ValueError(f"Invalid JSON response from {self.name}")
