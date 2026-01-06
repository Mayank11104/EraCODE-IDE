from abc import ABC, abstractmethod
from langchain_groq import ChatGroq
from src.config.settings import settings
from src.utils.logger import logger
from typing import Any
import json

class BaseAgent(ABC):
    """Base class for all agents"""
    
    def __init__(self, name: str):
        self.name = name
        self.llm = self._initialize_llm()
        logger.info(f"🤖 Initialized {name}")
    
    def _initialize_llm(self) -> ChatGroq:
        """Initialize the LLM based on settings"""
        if settings.MODEL_PROVIDER == "groq":
            return ChatGroq(
                model=settings.MODEL_NAME,
                temperature=settings.TEMPERATURE,
                max_tokens=settings.MAX_TOKENS,
                groq_api_key=settings.GROQ_API_KEY
            )
        else:
            # Future: Add OpenAI, Anthropic, etc.
            raise ValueError(f"Unsupported model provider: {settings.MODEL_PROVIDER}")
    
    @abstractmethod
    async def execute(self, task: str, context: dict[str, Any]) -> dict[str, Any]:
        """
        Execute the agent's task
        
        Args:
            task: The task description
            context: Additional context (project_path, files, etc.)
            
        Returns:
            Dictionary with agent results
        """
        pass
    
    async def _invoke_llm(self, prompt: str) -> str:
        """
        Call the LLM with error handling
        
        Args:
            prompt: The prompt to send
            
        Returns:
            LLM response content
        """
        try:
            logger.debug(f"🔄 {self.name} calling LLM...")
            response = await self.llm.ainvoke(prompt)
            logger.debug(f"✅ {self.name} received LLM response")
            return response.content
        except Exception as e:
            logger.error(f"❌ {self.name} LLM error: {str(e)}")
            raise
    
    def _parse_json_response(self, content: str) -> dict[str, Any]:
        """
        Parse JSON from LLM response, handling markdown code blocks
        
        Args:
            content: Raw LLM response
            
        Returns:
            Parsed JSON dictionary
        """
        # Clean markdown if present
        cleaned = content.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned.replace("```json", "").replace("```", "").strip()
        elif cleaned.startswith("```"):
            cleaned = cleaned.replace("```", "").strip()
    
    # ✅ FIX: Replace Windows backslashes with forward slashes
    # This prevents JSON parsing errors with file paths
        cleaned = cleaned.replace("\\\\", "/")  # Double backslash
        cleaned = cleaned.replace("\\'", "'")   # Escaped quote
        cleaned = cleaned.replace('\\"', '"')   # Escaped double quote
    
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError as e:
            logger.error(f"❌ Failed to parse JSON: {e}")
            logger.error(f"Raw content: {cleaned[:500]}")
            raise ValueError(f"Invalid JSON response from {self.name}")

