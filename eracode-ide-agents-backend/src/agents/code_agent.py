from __future__ import annotations

from typing import Any, Dict, List
import os
import re
import base64

from src.agents.base_agent import BaseAgent
from src.config.prompts import CODE_MANIFEST_PROMPT, CODE_FILE_PROMPT
from src.utils.logger import logger


_BASE64_RE = re.compile(r"^[A-Za-z0-9+/=\s]+$")


def _safe_b64decode_utf8(b64: str) -> str:
    s = (b64 or "").strip()
    s = "".join(s.split())  # remove whitespace/newlines

    if not _BASE64_RE.match(s):
        raise ValueError("content_base64 contains invalid characters")

    # Fix missing padding
    missing = (-len(s)) % 4
    if missing:
        s += "=" * missing

    data = base64.b64decode(s, validate=True)
    return data.decode("utf-8", errors="replace")


class CodeAgent(BaseAgent):
    """Manifest -> per-file generation using base64 to avoid JSON escaping failures."""

    def __init__(self):
        super().__init__("CodeAgent")

    async def execute(self, task: str, context: dict[str, Any]) -> dict[str, Any]:
        logger.info(f"💻 {self.name} executing: {task}")
        project_path = context.get("project_path", "")

        manifest_prompt = CODE_MANIFEST_PROMPT.format(task=task)
        manifest_raw = await self._invoke_llm(manifest_prompt)
        manifest = self._parse_json_response(manifest_raw)

        stack = str(manifest.get("stack", "html_css_js"))
        app_name = str(manifest.get("app_name", "app"))
        files = manifest.get("files", [])

        if not isinstance(files, list) or not files:
            files = [{"path": "index.html", "purpose": "Main UI page"}]

        files = files[:8]
        edits: List[Dict[str, Any]] = []

        for f in files:
            file_path = (f.get("path") or "").strip().replace("\\", "/")
            purpose = (f.get("purpose") or "").strip()
            if not file_path:
                continue

            last_error = None
            for attempt in range(1, 4):  # 3 attempts total
                extra_rules = ""
                if attempt > 1:
                    extra_rules = (
                        "\n\nRETRY MODE:\n"
                        "- Previous output was invalid/incomplete.\n"
                        "- Generate FULL working code (not a stub).\n"
                        "- Generate FULL working code (not a stub).\n"
                        "- content must be valid JSON escaped string.\n"
                    )

                file_prompt = CODE_FILE_PROMPT.format(
                    task=task,
                    stack=stack,
                    app_name=app_name,
                    file_path=file_path,
                    purpose=(purpose or "Required file") + extra_rules,
                )

                raw = await self._invoke_llm(file_prompt)
                obj = self._parse_json_response(raw)

                edit = obj.get("edit")
                if not isinstance(edit, dict):
                    last_error = f"Missing edit object (attempt {attempt})"
                    continue

                content = edit.get("content")
                b64 = edit.get("content_base64")

                # Try direct content first
                if isinstance(content, str) and content.strip():
                     decoded = content
                # Fallback to base64 if provided
                elif isinstance(b64, str) and b64.strip():
                    try:
                        decoded = _safe_b64decode_utf8(b64)
                    except Exception as e:
                        last_error = f"Invalid base64 (attempt {attempt}): {e}"
                        continue
                else:
                    last_error = f"Missing content (attempt {attempt})"
                    continue

                if not self._content_quality_ok(decoded):
                    last_error = f"Low-quality content (attempt {attempt})"
                    continue

                edits.append(
                    {
                        "file": (edit.get("file") or file_path).replace("\\", "/"),
                        "action": edit.get("action", "create"),
                        "content": decoded,
                        "content_base64": None, # No longer strictly needed
                        "reasoning": edit.get("reasoning", ""),
                    }
                )
                last_error = None
                break

            if last_error is not None:
                raise ValueError(f"{self.name}: Failed to generate good {file_path}: {last_error}")

        logger.info(f"✅ {self.name} generated {len(edits)} edit(s)")
        return {
            "edits": edits,
            "explanation": f"Generated {len(edits)} files for stack={stack}. Approve to write into: {project_path}",
            "stack_used": stack,
            "app_name": app_name,
        }

    def _content_quality_ok(self, content: str) -> bool:
        if not isinstance(content, str):
            return False
        t = content.strip().lower()
        if len(t) < 200:
            return False
        banned = ["todo:", "todo ", "placeholder", "lorem ipsum", "..."]
        if any(b in t for b in banned):
            return False
        return True

    async def apply_edit(self, edit: dict[str, Any], project_path: str) -> dict[str, Any]:
        file_path = os.path.join(project_path, edit["file"])
        action = edit["action"]

        try:
            if action in ("create", "update"):
                os.makedirs(os.path.dirname(file_path) or ".", exist_ok=True)

                content = edit.get("content")
                if content is None and edit.get("content_base64"):
                    content = _safe_b64decode_utf8(edit["content_base64"])

                if content is None:
                    return {"success": False, "file": edit.get("file"), "action": action, "error": "Missing content/content_base64"}

                with open(file_path, "w", encoding="utf-8") as f:
                    f.write(content)

                logger.info(f"✅ {action.capitalize()}d: {edit['file']}")
                return {"success": True, "file": edit["file"], "action": action}

            if action == "delete":
                if os.path.exists(file_path):
                    os.remove(file_path)
                    logger.info(f"✅ Deleted: {edit['file']}")
                    return {"success": True, "file": edit["file"], "action": "delete"}
                return {"success": False, "file": edit.get("file"), "action": action, "error": "File not found"}

            return {"success": False, "file": edit.get("file"), "error": f"Unknown action: {action}"}

        except Exception as e:
            logger.error(f"❌ Failed to {action} {edit.get('file')}: {e}")
            return {"success": False, "file": edit.get("file"), "action": action, "error": str(e)}
