from typing import Annotated, TypedDict, Literal, Any
from langgraph.graph.message import add_messages

class AgentState(TypedDict):
    messages: Annotated[list, add_messages]

    project_path: str
    file_tree: list[str]
    open_files: list[dict]

    current_task: str
    session_id: str

    next_agent: Literal[
        "planner", "reviewer", "analyzer", "code", "debug", "terminal", "end"
    ] | None

    # Planning/execution
    stack: str
    plan_steps: list[dict]
    step_index: int

    # Agent results
    analyzer_result: dict | None
    code_result: dict | None
    debug_result: dict | None
    terminal_result: dict | None
    planner_result: dict | None
    reviewer_result: dict | None

    relevant_files: list[str]
    file_contents: dict[str, str]

    permission_level: Literal["off", "auto", "turbo"]
    pending_approvals: list[dict]

    artifacts: list[dict]
    iteration_count: int
    error: str | None
