from __future__ import annotations

from langgraph.graph import StateGraph, END, START
from src.graph.state import AgentState
from src.graph.supervisor import SupervisorAgent
from src.agents.analyzer_agent import AnalyzerAgent
from src.agents.code_agent import CodeAgent
from src.agents.debug_agent import DebugAgent
from src.agents.terminal_agent import TerminalAgent
from src.agents.planner_agent import PlannerAgent
from src.agents.reviewer_agent import ReviewerAgent
from src.utils.logger import logger
from src.config.settings import settings


class AgentOrchestrator:
    def __init__(self):
        logger.info("Initializing Agent Orchestrator")

        self.supervisor = SupervisorAgent()
        self.planner = PlannerAgent()
        self.reviewer = ReviewerAgent()

        self.analyzer = AnalyzerAgent()
        self.code_agent = CodeAgent()
        self.debug_agent = DebugAgent()
        self.terminal_agent = TerminalAgent()

        self.graph = self._build_graph()

    def _build_graph(self):
        workflow = StateGraph(AgentState)

        workflow.add_node("supervisor", self._supervisor_node)
        workflow.add_node("planner", self._planner_node)
        workflow.add_node("execute_step", self._execute_step_node)
        workflow.add_node("reviewer", self._reviewer_node)

        workflow.add_node("analyzer", self._analyzer_node)
        workflow.add_node("debug", self._debug_node)
        workflow.add_node("terminal", self._terminal_node)

        workflow.add_node("check_approval", self._check_approval_node)

        workflow.add_edge(START, "supervisor")

        workflow.add_conditional_edges(
            "supervisor",
            lambda s: s.get("next_agent") or "end",
            {
                "planner": "planner",
                "analyzer": "analyzer",
                "debug": "debug",
                "terminal": "terminal",
                "end": END,
                "continue": "execute_step",
                # If supervisor chooses code directly, we still plan for “app-like” tasks
                "code": "planner",
            },
        )

        # Analyzer/debug/terminal go to approval check (same as before)
        workflow.add_edge("analyzer", "check_approval")
        workflow.add_edge("debug", "check_approval")
        workflow.add_edge("terminal", "check_approval")

        # Planner -> execute steps loop
        workflow.add_edge("planner", "execute_step")

        # After each step, check approvals; if none, continue steps or review
        workflow.add_edge("execute_step", "check_approval")

        workflow.add_conditional_edges(
            "check_approval",
            self._route_after_approval_check,
            {
                "end": END,
                "execute_step": "execute_step",
                "reviewer": "reviewer",
                "supervisor": "supervisor",
            },
        )

        # Reviewer either ends or triggers rework (which becomes a new tiny plan)
        workflow.add_conditional_edges(
            "reviewer",
            lambda s: "end" if s.get("reviewer_result", {}).get("approved") else "planner",
            {"end": END, "planner": "planner"},
        )

        return workflow.compile()

    def _route_after_approval_check(self, state: AgentState) -> str:
        # Stop if approvals exist, or max iterations reached
        if state.get("pending_approvals"):
            return "end"
        if state.get("iteration_count", 0) >= settings.MAX_ITERATIONS:
            return "end"

        # If we have a plan, keep executing steps; otherwise go back supervisor
        plan = state.get("plan_steps", [])
        idx = state.get("step_index", 0)
        if plan and idx < len(plan):
            return "execute_step"

        # Plan done -> review
        if plan:
            return "reviewer"

        return "supervisor"

    async def _supervisor_node(self, state: AgentState) -> AgentState:
        # Check if we are resuming an existing plan (step_index > 0 implies we started executing)
        if state.get("plan_steps") and state.get("step_index", 0) > 0:
            logger.info("🔄 Resuming existing plan execution")
            return {**state, "next_agent": "continue"}

        result = await self.supervisor.route(state)
        return {**state, **result}

    async def _planner_node(self, state: AgentState) -> AgentState:
        logger.info("Planner running")

        # If reviewer asked for rework, plan based on rework_task
        rework_task = (state.get("reviewer_result") or {}).get("rework_task")
        planning_task = rework_task.strip() if isinstance(rework_task, str) and rework_task.strip() else state.get("current_task", "")

        context = {
            "project_path": state.get("project_path", ""),
            "file_tree": state.get("file_tree", []),
            "open_files": state.get("open_files", []),
        }

        plan = await self.planner.execute(planning_task, context)

        return {
            **state,
            "planner_result": plan,
            "stack": plan.get("stack", state.get("stack", "html_css_js")),
            "plan_steps": plan.get("steps", []),
            "step_index": 0,
            "iteration_count": state.get("iteration_count", 0) + 1,
        }

    async def _execute_step_node(self, state: AgentState) -> AgentState:
        plan = state.get("plan_steps", [])
        idx = state.get("step_index", 0)
        if not plan or idx >= len(plan):
            return state

        step = plan[idx]
        agent = (step.get("agent") or "code_agent").strip()
        task = step.get("task") or state.get("current_task", "")

        logger.info(f"Executing step {idx+1}/{len(plan)} via {agent}")

        # Most app-building steps should be code_agent; analyzer/debug/terminal also supported.
        if agent == "analyzer_agent":
            return await self._analyzer_node({**state, "step_index": idx + 1, "current_task": task})
        if agent == "debug_agent":
            return await self._debug_node({**state, "step_index": idx + 1, "current_task": task})
        if agent == "terminal_agent":
            return await self._terminal_node({**state, "step_index": idx + 1, "current_task": task})

        # Default: code agent
        return await self._code_node({**state, "step_index": idx + 1, "current_task": task})

    async def _analyzer_node(self, state: AgentState) -> AgentState:
        context = {"project_path": state.get("project_path", ""), "file_tree": state.get("file_tree", [])}
        result = await self.analyzer.execute(state.get("current_task", ""), context)

        return {
            **state,
            "analyzer_result": result,
            "relevant_files": result.get("relevant_files", []),
            "file_contents": result.get("file_contents", {}),
            "artifacts": state.get("artifacts", []) + [{"type": "analysis", "content": result, "requires_approval": False}],
            "iteration_count": state.get("iteration_count", 0) + 1,
        }

    async def _code_node(self, state: AgentState) -> AgentState:
        context = {
            "project_path": state.get("project_path", ""),
            "relevant_files": state.get("relevant_files", []),
            "file_contents": state.get("file_contents", {}),
        }
        result = await self.code_agent.execute(state.get("current_task", ""), context)

        edits = result.get("edits", []) if isinstance(result, dict) else []
        artifacts = []
        pending_approvals = []

        for i, edit in enumerate(edits):
            artifact = {"type": "code_edit", "content": edit, "requires_approval": True}
            artifacts.append(artifact)
            pending_approvals.append(
                {
                    "id": f"approval_{state.get('session_id')}_{state.get('step_index', 0)}_{i}",
                    "type": "code_edit",
                    "artifact": artifact,
                    "status": "pending",
                }
            )

        return {
            **state,
            "code_result": result,
            "artifacts": state.get("artifacts", []) + artifacts,
            "pending_approvals": state.get("pending_approvals", []) + pending_approvals,
            "iteration_count": state.get("iteration_count", 0) + 1,
        }

    async def _debug_node(self, state: AgentState) -> AgentState:
        context = {
            "project_path": state.get("project_path", ""),
            "error_info": state.get("current_task", ""),
            "relevant_files": state.get("relevant_files", []),
            "code_context": "",
        }
        result = await self.debug_agent.execute(state.get("current_task", ""), context)

        artifact = {"type": "debug_fix", "content": result, "requires_approval": True}
        approval = {
            "id": f"approval_{state.get('session_id')}_debug_{state.get('step_index', 0)}",
            "type": "debug_fix",
            "artifact": artifact,
            "status": "pending",
        }

        return {
            **state,
            "debug_result": result,
            "artifacts": state.get("artifacts", []) + [artifact],
            "pending_approvals": state.get("pending_approvals", []) + [approval],
            "iteration_count": state.get("iteration_count", 0) + 1,
        }

    async def _terminal_node(self, state: AgentState) -> AgentState:
        context = {"project_path": state.get("project_path", "")}
        result = await self.terminal_agent.execute(state.get("current_task", ""), context)

        commands = result.get("commands", []) if isinstance(result, dict) else []
        artifacts = []
        pending_approvals = []

        for i, cmd in enumerate(commands):
            artifact = {
                "type": "terminal_command",
                "content": cmd,
                "requires_approval": cmd.get("requires_approval", True),
            }
            artifacts.append(artifact)
            if artifact["requires_approval"]:
                pending_approvals.append(
                    {
                        "id": f"approval_{state.get('session_id')}_cmd_{state.get('step_index', 0)}_{i}",
                        "type": "terminal_command",
                        "artifact": artifact,
                        "status": "pending",
                    }
                )

        return {
            **state,
            "terminal_result": result,
            "artifacts": state.get("artifacts", []) + artifacts,
            "pending_approvals": state.get("pending_approvals", []) + pending_approvals,
            "iteration_count": state.get("iteration_count", 0) + 1,
        }

    async def _reviewer_node(self, state: AgentState) -> AgentState:
        logger.info("Reviewer running")

        context = {
            "stack": state.get("stack", "unknown"),
            "plan": state.get("plan_steps", []),
            "artifacts": state.get("artifacts", []),
            "pending_approvals": state.get("pending_approvals", []),
        }
        review = await self.reviewer.execute(state.get("current_task", ""), context)

        return {**state, "reviewer_result": review, "iteration_count": state.get("iteration_count", 0) + 1}

    async def _check_approval_node(self, state: AgentState) -> AgentState:
        return state

    async def execute(self, initial_state: dict) -> dict:
        # Preserve existing state if resuming, otherwise initialize defaults
        state: AgentState = {
            "messages": initial_state.get("messages", [{"role": "user", "content": initial_state.get("current_task", "")}]),
            "current_task": initial_state.get("current_task", ""),
            "project_path": initial_state.get("project_path", ""),
            "file_tree": initial_state.get("file_tree", []),
            "open_files": initial_state.get("open_files", []),
            "session_id": initial_state.get("session_id", ""),
            "permission_level": initial_state.get("permission_level", "auto"),
            "next_agent": initial_state.get("next_agent", None),

            "stack": initial_state.get("stack", "html_css_js"),
            "plan_steps": initial_state.get("plan_steps", []),
            "step_index": initial_state.get("step_index", 0),

            "planner_result": initial_state.get("planner_result", None),
            "reviewer_result": initial_state.get("reviewer_result", None),

            "analyzer_result": initial_state.get("analyzer_result", None),
            "code_result": initial_state.get("code_result", None),
            "debug_result": initial_state.get("debug_result", None),
            "terminal_result": initial_state.get("terminal_result", None),

            "relevant_files": initial_state.get("relevant_files", []),
            "file_contents": initial_state.get("file_contents", {}),
            "pending_approvals": initial_state.get("pending_approvals", []),
            "artifacts": initial_state.get("artifacts", []),
            "iteration_count": initial_state.get("iteration_count", 0),
            "error": initial_state.get("error", None),
        }

        try:
            return await self.graph.ainvoke(state)
        except Exception as e:
            logger.error(f"Agent execution failed: {e}")
            return {**state, "error": str(e), "next_agent": "end"}
