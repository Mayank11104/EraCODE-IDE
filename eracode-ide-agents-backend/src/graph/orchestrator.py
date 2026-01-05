from langgraph.graph import StateGraph, END, START
from src.graph.state import AgentState
from src.graph.supervisor import SupervisorAgent
from src.agents.analyzer_agent import AnalyzerAgent
from src.agents.code_agent import CodeAgent
from src.agents.debug_agent import DebugAgent
from src.agents.terminal_agent import TerminalAgent
from src.utils.logger import logger
from src.config.settings import settings

class AgentOrchestrator:
    """Main orchestrator that manages multi-agent workflow"""
    
    def __init__(self):
        logger.info("🚀 Initializing Agent Orchestrator")
        
        # Initialize agents
        self.supervisor = SupervisorAgent()
        self.analyzer = AnalyzerAgent()
        self.code_agent = CodeAgent()
        self.debug_agent = DebugAgent()
        self.terminal_agent = TerminalAgent()
        
        # Build graph
        self.graph = self._build_graph()
        
        logger.info("✅ Agent Orchestrator ready")
    
    def _build_graph(self):
        """Build the LangGraph workflow"""
        
        # Create graph
        workflow = StateGraph(AgentState)
        
        # Add nodes
        workflow.add_node("supervisor", self._supervisor_node)
        workflow.add_node("analyzer", self._analyzer_node)
        workflow.add_node("code", self._code_node)
        workflow.add_node("debug", self._debug_node)
        workflow.add_node("terminal", self._terminal_node)
        workflow.add_node("check_approval", self._check_approval_node)
        
        # Start with supervisor
        workflow.add_edge(START, "supervisor")
        
        # Conditional routing from supervisor
        workflow.add_conditional_edges(
            "supervisor",
            lambda state: state.get("next_agent", "end"),
            {
                "analyzer": "analyzer",
                "code": "code",
                "debug": "debug",
                "terminal": "terminal",
                "end": END
            }
        )
        
        # All agents go to approval check
        workflow.add_edge("analyzer", "check_approval")
        workflow.add_edge("code", "check_approval")
        workflow.add_edge("debug", "check_approval")
        workflow.add_edge("terminal", "check_approval")
        
        # After approval check, either end or continue
        workflow.add_conditional_edges(
            "check_approval",
            lambda state: "end" if state.get("pending_approvals") or state.get("iteration_count", 0) >= settings.MAX_ITERATIONS else "supervisor",
            {
                "supervisor": "supervisor",
                "end": END
            }
        )
        
        # Compile graph
        return workflow.compile()
    
    async def _supervisor_node(self, state: AgentState) -> AgentState:
        """Supervisor node - routes to appropriate agent"""
        result = await self.supervisor.route(state)
        return {**state, **result}
    
    async def _analyzer_node(self, state: AgentState) -> AgentState:
        """Analyzer agent node"""
        logger.info("📊 Running Analyzer Agent")
        
        context = {
            "project_path": state.get("project_path", ""),
            "file_tree": state.get("file_tree", [])
        }
        
        result = await self.analyzer.execute(state.get("current_task", ""), context)
        
        return {
            **state,
            "analyzer_result": result,
            "relevant_files": result.get("relevant_files", []),
            "file_contents": result.get("file_contents", {}),
            "artifacts": state.get("artifacts", []) + [{
                "type": "analysis",
                "content": result,
                "requires_approval": False
            }],
            "iteration_count": state.get("iteration_count", 0) + 1
        }
    
    async def _code_node(self, state: AgentState) -> AgentState:
        """Code agent node"""
        logger.info("💻 Running Code Agent")
        
        context = {
            "project_path": state.get("project_path", ""),
            "relevant_files": state.get("relevant_files", []),
            "file_contents": state.get("file_contents", {})
        }
        
        result = await self.code_agent.execute(state.get("current_task", ""), context)
        
        # Create artifacts and pending approvals
        edits = result.get("edits", [])
        artifacts = []
        pending_approvals = []
        
        for edit in edits:
            artifact = {
                "type": "code_edit",
                "content": edit,
                "requires_approval": True
            }
            artifacts.append(artifact)
            
            # Add to pending approvals
            approval = {
                "id": f"approval_{state.get('session_id')}_{len(pending_approvals)}",
                "type": "code_edit",
                "artifact": artifact,
                "status": "pending"
            }
            pending_approvals.append(approval)
        
        return {
            **state,
            "code_result": result,
            "artifacts": state.get("artifacts", []) + artifacts,
            "pending_approvals": state.get("pending_approvals", []) + pending_approvals,
            "iteration_count": state.get("iteration_count", 0) + 1
        }
    
    async def _debug_node(self, state: AgentState) -> AgentState:
        """Debug agent node"""
        logger.info("🐛 Running Debug Agent")
        
        context = {
            "project_path": state.get("project_path", ""),
            "error_info": state.get("current_task", ""),
            "relevant_files": state.get("relevant_files", []),
            "code_context": ""
        }
        
        result = await self.debug_agent.execute(state.get("current_task", ""), context)
        
        # Create artifact for suggested fix
        artifact = {
            "type": "debug_fix",
            "content": result,
            "requires_approval": True
        }
        
        approval = {
            "id": f"approval_{state.get('session_id')}_debug",
            "type": "debug_fix",
            "artifact": artifact,
            "status": "pending"
        }
        
        return {
            **state,
            "debug_result": result,
            "artifacts": state.get("artifacts", []) + [artifact],
            "pending_approvals": state.get("pending_approvals", []) + [approval],
            "iteration_count": state.get("iteration_count", 0) + 1
        }
    
    async def _terminal_node(self, state: AgentState) -> AgentState:
        """Terminal agent node"""
        logger.info("⚡ Running Terminal Agent")
        
        context = {
            "project_path": state.get("project_path", "")
        }
        
        result = await self.terminal_agent.execute(state.get("current_task", ""), context)
        
        # Create artifacts and approvals for commands
        commands = result.get("commands", [])
        artifacts = []
        pending_approvals = []
        
        for cmd in commands:
            artifact = {
                "type": "terminal_command",
                "content": cmd,
                "requires_approval": cmd.get("requires_approval", True)
            }
            artifacts.append(artifact)
            
            if cmd.get("requires_approval", True):
                approval = {
                    "id": f"approval_{state.get('session_id')}_cmd_{len(pending_approvals)}",
                    "type": "terminal_command",
                    "artifact": artifact,
                    "status": "pending"
                }
                pending_approvals.append(approval)
        
        return {
            **state,
            "terminal_result": result,
            "artifacts": state.get("artifacts", []) + artifacts,
            "pending_approvals": state.get("pending_approvals", []) + pending_approvals,
            "iteration_count": state.get("iteration_count", 0) + 1
        }
    
    async def _check_approval_node(self, state: AgentState) -> AgentState:
        """Check if there are pending approvals"""
        pending = state.get("pending_approvals", [])
        
        if pending:
            logger.info(f"⏸️  Waiting for {len(pending)} approval(s)")
        
        return state
    
    async def execute(self, initial_state: dict) -> dict:
        """
        Execute the agent workflow
        
        Args:
            initial_state: Initial state with user request
            
        Returns:
            Final state after execution
        """
        logger.info(f"🚀 Starting agent execution for session: {initial_state.get('session_id')}")
        
        # Initialize state
        state = {
            "messages": [{"role": "user", "content": initial_state.get("current_task", "")}],
            "current_task": initial_state.get("current_task", ""),
            "project_path": initial_state.get("project_path", ""),
            "file_tree": initial_state.get("file_tree", []),
            "open_files": initial_state.get("open_files", []),
            "session_id": initial_state.get("session_id", ""),
            "permission_level": initial_state.get("permission_level", "auto"),
            "next_agent": None,
            "analyzer_result": None,
            "code_result": None,
            "debug_result": None,
            "terminal_result": None,
            "relevant_files": [],
            "file_contents": {},
            "pending_approvals": [],
            "artifacts": [],
            "iteration_count": 0,
            "error": None
        }
        
        try:
            # Run the graph
            final_state = await self.graph.ainvoke(state)
            logger.info("✅ Agent execution completed")
            return final_state
            
        except Exception as e:
            logger.error(f"❌ Agent execution failed: {e}")
            return {
                **state,
                "error": str(e),
                "next_agent": "end"
            }
