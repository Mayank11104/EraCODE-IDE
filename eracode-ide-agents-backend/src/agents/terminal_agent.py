from src.agents.base_agent import BaseAgent
from src.config.prompts import TERMINAL_AGENT_PROMPT
from src.config.settings import settings
from src.utils.logger import logger
from typing import Any
import platform

class TerminalAgent(BaseAgent):
    """Agent that generates and validates terminal commands"""
    
    def __init__(self):
        super().__init__("TerminalAgent")
        self.os_type = platform.system()  # Windows, Linux, Darwin (macOS)
    
    async def execute(self, task: str, context: dict[str, Any]) -> dict[str, Any]:
        """
        Generate safe terminal commands
        
        Args:
            task: What commands to generate
            context: Project context
            
        Returns:
            List of commands with safety validation
        """
        logger.info(f"⚡ {self.name} generating commands for: {task}")
        
        project_path = context.get("project_path", "")
        
        # Create prompt
        prompt = TERMINAL_AGENT_PROMPT.format(
            task=task,
            project_path=project_path,
            os_type=self.os_type
        )
        
        # Get LLM response
        response = await self._invoke_llm(prompt)
        result = self._parse_json_response(response)
        
        # Validate command safety
        commands = result.get("commands", [])
        for cmd_info in commands:
            cmd_info["is_safe"] = self._is_command_safe(cmd_info["command"])
            cmd_info["requires_approval"] = not cmd_info["is_safe"]
        
        logger.info(f"✅ {self.name} generated {len(commands)} command(s)")
        
        return result
    
    def _is_command_safe(self, command: str) -> bool:
        """
        Check if command is safe to auto-execute
        
        Args:
            command: Shell command to validate
            
        Returns:
            True if safe, False if needs approval
        """
        command_lower = command.lower()
        
        # Check against dangerous commands
        for dangerous in settings.DANGEROUS_COMMANDS:
            if dangerous.lower() in command_lower:
                logger.warning(f"⚠️ Dangerous command detected: {command}")
                return False
        
        # Safe commands (read-only, informational)
        safe_prefixes = [
            "ls", "dir", "pwd", "cat", "echo", "grep",
            "git status", "git log", "git diff",
            "npm list", "pip list", "node --version",
            "python --version", "which", "whereis"
        ]
        
        for safe_prefix in safe_prefixes:
            if command_lower.startswith(safe_prefix):
                return True
        
        # Default: require approval for unknown commands
        return False
