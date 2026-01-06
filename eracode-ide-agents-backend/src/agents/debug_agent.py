from src.agents.base_agent import BaseAgent
from src.config.prompts import DEBUG_AGENT_PROMPT
from src.utils.logger import logger
from typing import Any
import os

class DebugAgent(BaseAgent):
    """Agent that analyzes errors and suggests fixes"""
    
    def __init__(self):
        super().__init__("DebugAgent")
    
    async def execute(self, task: str, context: dict[str, Any]) -> dict[str, Any]:
        """
        Analyze error and suggest fix
        """
        logger.info(f"🐛 {self.name} debugging: {task}")
    
        error_info = context.get("error_info", task)
        code_context = context.get("code_context", "")
        relevant_files = context.get("relevant_files", [])
        project_path = context.get("project_path", "")
    
        # Read relevant files if provided
        if relevant_files and not code_context:
            file_contents = self._read_relevant_files(project_path, relevant_files)
            code_context = "\n\n".join([
                f"## {path}\n```\n{content}\n```"
                for path, content in file_contents.items()
            ])
    
    # ✅ FIX: Convert backslashes to forward slashes for JSON
        project_path_safe = project_path.replace("\\", "/")
    
    # Create prompt
        prompt = DEBUG_AGENT_PROMPT.format(
            task=task,
        error_info=error_info,
        code_context=code_context or "No code context provided"
    )
    
    # Add instruction to use forward slashes
        prompt += "\n\nIMPORTANT: Use forward slashes (/) in file paths, not backslashes."
    
    # Get LLM response
        response = await self._invoke_llm(prompt)
    
    # ✅ FIX: Clean response before parsing
        content = response.strip()
    # Replace escaped backslashes with forward slashes
        content = content.replace("\\\\", "/").replace("\\", "/")
    
        result = self._parse_json_response(content)
    
        logger.info(f"✅ {self.name} identified root cause: {result.get('root_cause', 'Unknown')[:100]}")
    
        return result

    
    def _read_relevant_files(self, project_path: str, file_paths: list[str]) -> dict[str, str]:
        """Read contents of relevant files"""
        contents = {}
        
        for file_path in file_paths[:3]:  # Limit to 3 files for debugging
            full_path = os.path.join(project_path, file_path)
            
            try:
                with open(full_path, 'r', encoding='utf-8') as f:
                    contents[file_path] = f.read()
            except Exception as e:
                logger.debug(f"Could not read {file_path}: {e}")
        
        return contents
