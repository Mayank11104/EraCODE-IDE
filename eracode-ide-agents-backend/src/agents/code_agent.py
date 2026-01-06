from src.agents.base_agent import BaseAgent
from src.config.prompts import CODE_AGENT_PROMPT
from src.models.request_models import FileEdit
from src.utils.logger import logger
from typing import Any
import os

class CodeAgent(BaseAgent):
    """Agent that creates, edits, and refactors code"""
    
    def __init__(self):
        super().__init__("CodeAgent")
    
    async def execute(self, task: str, context: dict[str, Any]) -> dict[str, Any]:
        """
        Generate or edit code based on task
        
        Args:
            task: What code to write/edit
            context: Project context and relevant files
            
        Returns:
            File edits to apply
        """
        logger.info(f"💻 {self.name} executing: {task}")
        
        project_path = context.get("project_path", "")
        relevant_files = context.get("relevant_files", [])
        file_contents = context.get("file_contents", {})
        
        # Read file contents if needed
        if relevant_files and not file_contents:
            file_contents = self._read_relevant_files(project_path, relevant_files)
        
        # Format file contents for prompt
        file_contents_str = "\n\n".join([
            f"## {path}\n```\n{content}\n```" 
            for path, content in file_contents.items()
        ])
        
        # Create prompt
        prompt = CODE_AGENT_PROMPT.format(
            task=task,
            project_path=project_path,
            relevant_files=", ".join(relevant_files) if relevant_files else "None",
            file_contents=file_contents_str or "No existing files to edit"
        )
        
        # Get LLM response
        response = await self._invoke_llm(prompt)
        result = self._parse_json_response(response)
        
        # Validate edits
        edits = result.get("edits", [])
        logger.info(f"✅ {self.name} generated {len(edits)} file edit(s)")
        
        return result
    
    def _read_relevant_files(self, project_path: str, file_paths: list[str]) -> dict[str, str]:
        """Read contents of relevant files"""
        contents = {}
        
        for file_path in file_paths[:5]:  # Limit to 5 files
            full_path = os.path.join(project_path, file_path)
            
            try:
                with open(full_path, 'r', encoding='utf-8') as f:
                    contents[file_path] = f.read()
            except Exception as e:
                logger.debug(f"Could not read {file_path}: {e}")
        
        return contents
    
    async def apply_edit(self, edit: dict[str, Any], project_path: str) -> dict[str, Any]:
        """
        Apply a file edit to disk
        
        Args:
            edit: Edit specification (file, action, content)
            project_path: Base project directory
            
        Returns:
            Result of applying edit
        """
        file_path = os.path.join(project_path, edit["file"])
        action = edit["action"]
        
        try:
            if action == "create" or action == "update":
                # Ensure directory exists
                os.makedirs(os.path.dirname(file_path), exist_ok=True)
                
                # Write file
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(edit["content"])
                
                logger.info(f"✅ {action.capitalize()}d: {edit['file']}")
                return {"success": True, "file": edit["file"], "action": action}
                
            elif action == "delete":
                if os.path.exists(file_path):
                    os.remove(file_path)
                    logger.info(f"✅ Deleted: {edit['file']}")
                    return {"success": True, "file": edit["file"], "action": "delete"}
                else:
                    return {"success": False, "error": "File not found"}
            
        except Exception as e:
            logger.error(f"❌ Failed to {action} {edit['file']}: {e}")
            return {"success": False, "error": str(e)}
