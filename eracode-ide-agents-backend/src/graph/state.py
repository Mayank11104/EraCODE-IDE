from typing import Annotated, TypedDict, Literal
from langgraph.graph.message import add_messages

class AgentState(TypedDict):
    """State that flows through the agent graph"""
    
    # User input
    messages: Annotated[list, add_messages]
    
    # Project context
    project_path: str
    file_tree: list[str]
    open_files: list[dict]
    
    # Current task
    current_task: str
    session_id: str
    
    # Agent routing
    next_agent: Literal["analyzer", "code", "debug", "terminal", "end"] | None
    
    # Agent results
    analyzer_result: dict | None
    code_result: dict | None
    debug_result: dict | None
    terminal_result: dict | None
    
    # Context passing between agents
    relevant_files: list[str]
    file_contents: dict[str, str]
    
    # Permission system
    permission_level: Literal["off", "auto", "turbo"]
    pending_approvals: list[dict]
    
    # Execution tracking
    artifacts: list[dict]
    iteration_count: int
    error: str | None
