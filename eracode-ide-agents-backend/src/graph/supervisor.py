
from langchain_openai import AzureChatOpenAI
from src.config.settings import settings
from src.config.prompts import SUPERVISOR_PROMPT
from src.utils.logger import logger
import json

class SupervisorAgent:
    """Supervisor that routes tasks to specialized agents"""
    
    def __init__(self):
        if settings.MODEL_PROVIDER == "azure":
            self.llm = AzureChatOpenAI(
                azure_deployment=settings.AZURE_OPENAI_DEPLOYMENT_NAME,
                openai_api_version=settings.AZURE_OPENAI_API_VERSION,
                azure_endpoint=settings.AZURE_OPENAI_ENDPOINT,
                api_key=settings.AZURE_OPENAI_API_KEY,
                temperature=0.1,  # Lower temperature for routing decisions
            
        
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
        
        # Build history string
        history = []
        if state.get("analyzer_result"):
            res = state['analyzer_result']
            history.append(f"Analyzer: Found {len(res.get('relevant_files', []))} files. Context: {res.get('project_structure', 'N/A')[:200]}...")
        if state.get("debug_result"):
            history.append(f"Debug: Root cause found - {state['debug_result'].get('root_cause', 'Unknown')}")
        if state.get("terminal_result"):
            history.append(f"Terminal: Executed commands")
        if state.get("server_response"):
             history.append(f"Server: {state['server_response']}")
        
        history_str = "\n".join(history) if history else "No recent actions."
        
        # Create routing prompt
        prompt = SUPERVISOR_PROMPT.format(
            request=current_task,
            project_path=project_path,
            open_files=open_files_str,
            history=history_str
        )
        
        # Get routing decision
        try:
            response = await self.llm.ainvoke(prompt)
            
            try:
                decision = self._parse_json_response(response.content)
                next_agent = decision.get("agent", "end")
                
                # Map agent names to graph nodes
                agent_mapping = {
                    "analyzer_agent": "analyzer",
                    "code_agent": "code",
                    "debug_agent": "debug",
                    "terminal_agent": "terminal",
                    "finish": "end"
                }
                
                next_agent = agent_mapping.get(next_agent, "end")
                
                logger.info(f"✅ Supervisor routing to: {next_agent}")
                logger.info(f"   Reasoning: {decision.get('reasoning', 'N/A')[:100]}")

                if next_agent == "end":
                     return {
                        "next_agent": "end",
                        "supervisor_message": decision.get("task_description", "Task completed.")
                    }
                
                return {
                    "next_agent": next_agent,
                    "current_task": decision.get("task_description", current_task)
                }

            except json.JSONDecodeError:
                # If valid JSON logic fails, treat as direct message (Greeting/Conversational)
                logger.info("💬 Supervisor provided direct response (non-JSON)")
                return {
                    "next_agent": "end",
                    "supervisor_message": response.content.strip()
                }
            
        except Exception as e:
            logger.error(f"❌ Supervisor routing error: {e}")
            return {
                "next_agent": "end",
                "error": f"Routing failed: {str(e)}"
            }
    
    def _parse_json_response(self, content: str) -> dict:
        """Parse JSON from LLM response"""
        # Try to find JSON object structure first
        try:
            start_index = content.find('{')
            end_index = content.rfind('}')
            
            if start_index != -1 and end_index != -1 and start_index < end_index:
                json_str = content[start_index:end_index + 1]
                return json.loads(json_str)
        except Exception:
            pass  # Fallback to cleaning if direct extraction fails
            
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
