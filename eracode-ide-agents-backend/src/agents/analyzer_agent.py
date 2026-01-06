from src.agents.base_agent import BaseAgent
from src.config.prompts import ANALYZER_PROMPT
from src.utils.logger import logger
from typing import Any
import os
import pathlib

class AnalyzerAgent(BaseAgent):
    """Agent that analyzes project structure and provides context"""
    
    def __init__(self):
        super().__init__("AnalyzerAgent")
    
    async def execute(self, task: str, context: dict[str, Any]) -> dict[str, Any]:
        """
        Analyze project and return relevant context
        
        Args:
            task: What to analyze
            context: Project information
            
        Returns:
            Analysis results with relevant files
        """
        logger.info(f"📊 {self.name} analyzing: {task}")
        
        project_path = context.get("project_path", "")
        file_tree = context.get("file_tree", [])
        
        # Build file tree if not provided
        if not file_tree and project_path:
            file_tree = self._build_file_tree(project_path)
        
        # Create prompt
        prompt = ANALYZER_PROMPT.format(
            task=task,
            project_path=project_path,
            file_tree="\n".join(file_tree[:100])  # Limit to first 100 files
        )
        
        # Get LLM response
        response = await self._invoke_llm(prompt)
        result = self._parse_json_response(response)
        
        # Read relevant file contents
        relevant_files = result.get("relevant_files", [])
        file_contents = {}
        
        for file_path in relevant_files[:5]:  # Limit to 5 files
            full_path = os.path.join(project_path, file_path)
            content = self._read_file_safe(full_path)
            if content:
                file_contents[file_path] = content[:2000]  # First 2000 chars
        
        result["file_contents"] = file_contents
        
        logger.info(f"✅ {self.name} found {len(relevant_files)} relevant files")
        return result
    
    def _build_file_tree(self, project_path: str, max_files: int = 500) -> list[str]:
        """Build list of files in project"""
        files = []
        
        try:
            for root, dirs, filenames in os.walk(project_path):
                # Skip common ignore directories
                dirs[:] = [d for d in dirs if d not in [
                    'node_modules', '.git', '__pycache__', 'venv', 
                    'env', '.venv', 'dist', 'build', '.next'
                ]]
                
                for filename in filenames:
                    if len(files) >= max_files:
                        break
                    
                    file_path = os.path.join(root, filename)
                    relative_path = os.path.relpath(file_path, project_path)
                    files.append(relative_path)
                    
        except Exception as e:
            logger.error(f"Error building file tree: {e}")
        
        return files
    
    def _read_file_safe(self, file_path: str) -> str | None:
        """Safely read file content"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read()
        except Exception as e:
            logger.debug(f"Could not read {file_path}: {e}")
            return None
