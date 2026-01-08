from __future__ import annotations

from typing import Any, Dict, List

from src.agents.base_agent import BaseAgent
from src.config.prompts import REVIEWER_PROMPT
from src.utils.logger import logger


class ReviewerAgent(BaseAgent):
    """Reviews proposed edits/artifacts and decides whether to rework."""

    def __init__(self) -> None:
        super().__init__("ReviewerAgent")

    async def execute(self, task: str, context: dict[str, Any]) -> dict[str, Any]:
        logger.info(f"{self.name} reviewing: {task[:120]}")

        stack = context.get("stack", "unknown")
        plan = context.get("plan", [])
        artifacts = context.get("artifacts", [])
        pending_approvals = context.get("pending_approvals", [])

        prompt = REVIEWER_PROMPT.format(
            task=task,
            stack=stack,
            plan=plan,
            artifacts=artifacts,
            pending_approvals=pending_approvals,
        )

        response = await self._invoke_llm(prompt)
        review = self._parse_json_response(response)

        # Normalize output
        approved = bool(review.get("approved", False))
        issues = review.get("issues", [])
        if not isinstance(issues, list):
            issues = []

        return {
            "approved": approved,
            "issues": issues,
            "rework_task": review.get("rework_task", ""),
            "score": review.get("score", None),
        }
