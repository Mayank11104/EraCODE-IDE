from pydantic import BaseModel, Field
from typing import Literal, Optional

class AgentRequest(BaseModel):
    """Request to execute an agent task"""
    message: str = Field(..., description="User's request/question")
    project_path: str = Field(..., description="Absolute path to project directory")
    file_tree: list[str] = Field(default=[], description="List of files in project")
    open_files: list[dict] = Field(default=[], description="Currently open files with content")
    permission_level: Literal["off", "auto", "turbo"] = Field(default="auto")
    callback_url: Optional[str] = Field(None, description="URL to send results back to Node.js")
    session_id: str = Field(..., description="Unique session identifier")

class ApprovalRequest(BaseModel):
    """Request to approve/reject an agent action"""
    approval_id: str = Field(..., description="ID of the pending approval")
    decision: Literal["approved", "rejected"] = Field(..., description="User's decision")
    session_id: str = Field(..., description="Session ID")

class FileEdit(BaseModel):
    """A single file edit operation"""
    file: str = Field(..., description="Relative path to file")
    action: Literal["create", "update", "delete"] = Field(..., description="Type of operation")
    content: Optional[str] = Field(None, description="New file content (for create/update)")
    reasoning: str = Field(..., description="Why this change is needed")

class TerminalCommand(BaseModel):
    """A terminal command to execute"""
    command: str = Field(..., description="Shell command")
    description: str = Field(..., description="What the command does")
    is_safe: bool = Field(..., description="Whether command is safe to auto-execute")
    requires_approval: bool = Field(..., description="Whether user approval is needed")
