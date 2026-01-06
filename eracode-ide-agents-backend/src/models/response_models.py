from pydantic import BaseModel, Field
from typing import Literal, Optional, Any
from datetime import datetime

class Artifact(BaseModel):
    """An artifact produced by an agent (code, command, analysis, etc.)"""
    type: Literal["code_edit", "terminal_command", "analysis", "debug_fix"] = Field(...)
    content: Any = Field(..., description="The artifact content (varies by type)")
    requires_approval: bool = Field(default=False)
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

class PendingApproval(BaseModel):
    """An action waiting for user approval"""
    id: str = Field(..., description="Unique approval ID")
    type: Literal["code_edit", "terminal_command", "debug_fix"] = Field(...)
    artifact: Artifact = Field(..., description="The artifact needing approval")
    status: Literal["pending", "approved", "rejected"] = Field(default="pending")

class AgentResponse(BaseModel):
    """Response from agent execution"""
    task_id: str = Field(..., description="Unique task identifier")
    status: Literal["processing", "completed", "failed", "waiting_approval"] = Field(...)
    message: str = Field(..., description="Human-readable status message")
    agent_used: Optional[str] = Field(None, description="Which agent handled this")
    artifacts: list[Artifact] = Field(default=[], description="Generated artifacts")
    pending_approvals: list[PendingApproval] = Field(default=[], description="Actions needing approval")
    error: Optional[str] = Field(None, description="Error message if failed")

class HealthResponse(BaseModel):
    """Health check response"""
    status: Literal["healthy", "unhealthy"] = Field(...)
    agents: list[str] = Field(..., description="Available agents")
    version: str = Field(default="0.1.0")
    model: str = Field(..., description="LLM model being used")
