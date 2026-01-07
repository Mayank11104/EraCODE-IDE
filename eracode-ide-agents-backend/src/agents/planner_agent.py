from __future__ import annotations

from typing import Any, Dict, List

from src.agents.base_agent import BaseAgent
from src.config.prompts import PLANNER_PROMPT
from src.utils.logger import logger


class PlannerAgent(BaseAgent):
    """Creates a structured multi-step plan for building features/apps."""

    def __init__(self) -> None:
        super().__init__("PlannerAgent")

    async def execute(self, task: str, context: dict[str, Any]) -> dict[str, Any]:
        logger.info(f"{self.name} planning: {task[:120]}")

        project_path = context.get("project_path", "")
        file_tree = context.get("file_tree", [])
        open_files = context.get("open_files", [])

        prompt = PLANNER_PROMPT.format(
            task=task,
            project_path=project_path,
            file_tree="\n".join(file_tree[:200]) if file_tree else "Not provided",
            open_files=open_files if open_files else [],
        )

        response = await self._invoke_llm(prompt)
        plan = self._parse_json_response(response)

        # Minimal validation + normalization
        steps = plan.get("steps", [])
        if not isinstance(steps, list) or not steps:
            return {
                "stack": plan.get("stack", "unknown"),
                "app_name": plan.get("app_name", "app"),
                "steps": [
                    {
                        "id": "step_1",
                        "agent": "code_agent",
                        "task": task,
                        "deliverables": [],
                    }
                ],
            }

        normalized_steps: List[Dict[str, Any]] = []
        for i, s in enumerate(steps):
            if not isinstance(s, dict):
                continue
            normalized_steps.append(
                {
                    "id": s.get("id") or f"step_{i+1}",
                    "agent": s.get("agent", "code_agent"),
                    "task": s.get("task", ""),
                    "deliverables": s.get("deliverables", []),
                }
            )

        return {
            "stack": plan.get("stack", "html_css_js"),
            "app_name": plan.get("app_name", "app"),
            "steps": normalized_steps,
        }
