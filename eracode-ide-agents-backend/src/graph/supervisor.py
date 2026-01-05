from langchain_groq import ChatGroq
from src.config.settings import settings
from src.config.prompts import SUPERVISOR_PROMPT
from src.utils.logger import logger
import json

class SupervisorAgent:
    """Supervisor that routes tasks to specialized agents"""
    
    def __init__(self):
        self.llm = ChatGroq(
            model=settings.MODEL_NAME,
            temperature=0.1,  # Lower temperature for routing decisions
            groq_api_key=settings.GROQ_API_KEY
        )
        logger.info("🎯 Supervisor initialized")
    
    async def route(self, state: dict) -> dict:
        """
        Analyze task and route to appropriate agent
        
        Args:
            state: Current agent state
            
        Returns:
            Updated state with next_agent decision
        """
        current_task = state.get("current_task", "")
        project_path = state.get("project_path", "")
        open_files = state.get("open_files", [])
        
        logger.info(f"🎯 Supervisor routing task: {current_task[:100]}")
        
        # Build context for routing
        open_files_str = ", ".join([f["path"] for f in open_files]) if open_files else "None"
        
        # Create routing prompt
        prompt = SUPERVISOR_PROMPT.format(
            request=current_task,
            project_path=project_path,
            open_files=open_files_str
        )
        
        # Get routing decision
        try:
            response = await self.llm.ainvoke(prompt)
            decision = self._parse_json_response(response.content)
            
            next_agent = decision.get("agent", "end")
            
            # Map agent names to graph nodes
            agent_mapping = {
                "analyzer_agent": "analyzer",
                "code_agent": "code",
                "debug_agent": "debug",
                "terminal_agent": "terminal"
            }
            
            next_agent = agent_mapping.get(next_agent, "end")
            
            logger.info(f"✅ Supervisor routing to: {next_agent}")
            logger.info(f"   Reasoning: {decision.get('reasoning', 'N/A')[:100]}")
            
            return {
                "next_agent": next_agent,
                "current_task": decision.get("task_description", current_task)
            }
            
        except Exception as e:
            logger.error(f"❌ Supervisor routing error: {e}")
            return {
                "next_agent": "end",
                "error": f"Routing failed: {str(e)}"
            }
    
    def _parse_json_response(self, content: str) -> dict:
        """Parse JSON from LLM response"""
        cleaned = content.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned.replace("```json", "").replace("```", "").strip()
        elif cleaned.startswith("```"):
            cleaned = cleaned.replace("```", "").strip()
        
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON: {e}")
            logger.error(f"Content: {cleaned[:500]}")
            raise
