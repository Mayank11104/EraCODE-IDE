from fastapi import APIRouter, BackgroundTasks, HTTPException
from src.models.request_models import AgentRequest, ApprovalRequest
from src.models.response_models import AgentResponse, Artifact, PendingApproval
from src.graph.orchestrator import AgentOrchestrator
from src.agents.code_agent import CodeAgent
from src.utils.callbacks import send_callback
from src.utils.logger import logger
from typing import Dict
import uuid

router = APIRouter()

# Global orchestrator instance
orchestrator = AgentOrchestrator()

# Store active sessions
active_sessions: Dict[str, dict] = {}

@router.post("/execute", response_model=AgentResponse)
async def execute_agent(request: AgentRequest, background_tasks: BackgroundTasks):
    """Execute an agent task"""
    task_id = f"task_{uuid.uuid4().hex[:8]}"
    
    logger.info(f"📨 Received agent request: {request.message[:100]}")
    logger.info(f"   Task ID: {task_id}")
    logger.info(f"   Session: {request.session_id}")
    
    # Store session
    active_sessions[request.session_id] = {
        "task_id": task_id,
        "status": "processing",
        "request": request
    }
    
    # Start agent execution in background
    background_tasks.add_task(
        execute_agent_task,
        task_id=task_id,
        request=request
    )
    
    return AgentResponse(
        task_id=task_id,
        status="processing",
        message="Agent task started",
        agent_used="supervisor",
        artifacts=[],
        pending_approvals=[]
    )

async def execute_agent_task(task_id: str, request: AgentRequest):
    """Background task to execute agent workflow"""
    
    try:
        logger.info(f"🚀 Starting agent task: {task_id}")
        
        # Prepare initial state
        initial_state = {
            "current_task": request.message,
            "project_path": request.project_path,
            "file_tree": request.file_tree,
            "open_files": request.open_files,
            "session_id": request.session_id,
            "permission_level": request.permission_level
        }
        
        # Execute agent workflow
        final_state = await orchestrator.execute(initial_state)
        
        # Convert state to response format
        artifacts = []
        for artifact_data in final_state.get("artifacts", []):
            artifacts.append(Artifact(
                type=artifact_data["type"],
                content=artifact_data["content"],
                requires_approval=artifact_data.get("requires_approval", False)
            ))
        
        pending_approvals = []
        for approval_data in final_state.get("pending_approvals", []):
            if approval_data["status"] == "pending":
                pending_approvals.append(PendingApproval(
                    id=approval_data["id"],
                    type=approval_data["type"],
                    artifact=Artifact(**approval_data["artifact"]),
                    status=approval_data["status"]
                ))
        
        # Determine status
        if final_state.get("error"):
            status = "failed"
            message = f"Error: {final_state['error']}"
        elif pending_approvals:
            status = "waiting_approval"
            message = f"Waiting for {len(pending_approvals)} approval(s)"
        else:
            status = "completed"
            message = "Task completed successfully"
        
        # Create response
        response = AgentResponse(
            task_id=task_id,
            status=status,
            message=message,
            agent_used=final_state.get("next_agent", "unknown"),
            artifacts=artifacts,
            pending_approvals=pending_approvals,
            error=final_state.get("error")
        )
        
        # Update session
        active_sessions[request.session_id] = {
            "task_id": task_id,
            "status": status,
            "response": response,
            "final_state": final_state
        }
        
        logger.info(f"✅ Agent task completed: {task_id}")
        
        # Send callback to Node.js if URL provided
        if request.callback_url:
            await send_callback(request.callback_url, response.dict())
        
    except Exception as e:
        logger.error(f"❌ Agent task failed: {task_id} - {e}")
        
        error_response = AgentResponse(
            task_id=task_id,
            status="failed",
            message=f"Agent execution failed: {str(e)}",
            agent_used="unknown",
            artifacts=[],
            pending_approvals=[],
            error=str(e)
        )
        
        # Update session
        active_sessions[request.session_id] = {
            "task_id": task_id,
            "status": "failed",
            "response": error_response
        }
        
        # Send error callback
        if request.callback_url:
            await send_callback(request.callback_url, error_response.dict())

@router.post("/approve/{approval_id}")
async def approve_action(approval_id: str, request: ApprovalRequest):
    """Approve or reject a pending action"""
    logger.info(f"📋 Approval request: {approval_id} - {request.decision}")
    
    # Get session
    session = active_sessions.get(request.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    final_state = session.get("final_state")
    if not final_state:
        raise HTTPException(status_code=400, detail="No final state available")
    
    # Find the approval in the state
    pending_approvals = final_state.get("pending_approvals", [])
    approval = next((a for a in pending_approvals if a["id"] == approval_id), None)
    
    if not approval:
        raise HTTPException(status_code=404, detail="Approval not found")
    
    # Update approval status
    approval["status"] = request.decision
    
    result_msg = "Approval recorded"
    
    if request.decision == "approved":
        # Apply the change
        artifact = approval["artifact"]
        project_path = final_state.get("project_path", "")
        
        if not project_path:
            raise HTTPException(status_code=400, detail="Project path not found")
        
        try:
            if artifact["type"] == "code_edit":
                code_agent = CodeAgent()
                edit = artifact["content"]
                result = await code_agent.apply_edit(edit, project_path)
                logger.info(f"✅ Applied code edit: {edit['file']}")
                result_msg = f"Applied edit to {edit['file']}"
            
            elif artifact["type"] == "terminal_command":
                cmd = artifact["content"]["command"]
                logger.info(f"✅ Approved command: {cmd}")
                result_msg = f"Approved command: {cmd}"
                
        except Exception as e:
            logger.error(f"❌ Failed to apply approval: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to apply: {str(e)}")
    else:
        logger.info(f"🚫 Rejected approval: {approval_id}")
        result_msg = "Action rejected"

    # Check if we should resume execution
    # We resume if ALL pending approvals are now either approved or rejected
    all_resolved = all(a["status"] in ("approved", "rejected") for a in pending_approvals)
    
    if all_resolved:
        logger.info("🔄 All approvals resolved. Resuming agent execution...")
        
        # Clear pending approvals so the graph doesn't stop again immediately
        # We keep the artifacts but clear the blocking list for the orchestrator
        final_state["pending_approvals"] = [] 
        
        # Resume the graph
        # We pass the modified final_state back in. The orchestrator continues from where it left off.
        new_final_state = await orchestrator.execute(final_state)
        
        # Update session with new state
        # Convert state to response format (reuse logic from execute_agent_task - should refactor ideally)
        artifacts = []
        for artifact_data in new_final_state.get("artifacts", []):
            artifacts.append(Artifact(
                type=artifact_data["type"],
                content=artifact_data["content"],
                requires_approval=artifact_data.get("requires_approval", False)
            ))
        
        new_pending_approvals = []
        for approval_data in new_final_state.get("pending_approvals", []):
            if approval_data["status"] == "pending":
                new_pending_approvals.append(PendingApproval(
                    id=approval_data["id"],
                    type=approval_data["type"],
                    artifact=Artifact(**approval_data["artifact"]),
                    status=approval_data["status"]
                ))
            
        if new_final_state.get("error"):
            status = "failed"
            message = f"Error: {new_final_state['error']}"
        elif new_pending_approvals:
            status = "waiting_approval"
            message = f"Waiting for {len(new_pending_approvals)} approval(s)"
        else:
            status = "completed"
            message = "Task completed successfully"

        new_response = AgentResponse(
            task_id=session["task_id"],
            status=status,
            message=message,
            agent_used=new_final_state.get("next_agent", "unknown"),
            artifacts=artifacts,
            pending_approvals=new_pending_approvals,
            error=new_final_state.get("error")
        )
        
        active_sessions[request.session_id] = {
            "task_id": session["task_id"],
            "status": status,
            "response": new_response,
            "final_state": new_final_state
        }
        
        return {
            "status": "resumed",
            "approval_id": approval_id,
            "message": result_msg + ". Continuing execution."
        }

    # If not all resolved, we still need to update the session response so polling sees the change
    if not all_resolved:
        # Rebuild PendingApproval list from current state
        updated_pending_approvals = []
        for approval_data in pending_approvals:
            if approval_data["status"] == "pending":
                updated_pending_approvals.append(PendingApproval(
                    id=approval_data["id"],
                    type=approval_data["type"],
                    artifact=Artifact(**approval_data["artifact"]),
                    status=approval_data["status"]
                ))
            
        # Update the stored response object
        current_response = session["response"]
        
        # We need to create a new response object with updated approvals
        # Assuming AgentResponse is Pydantic, we can use copy with update or just reconstruct
        updated_response = AgentResponse(
            task_id=current_response.task_id,
            status="waiting_approval", # Still waiting
            message=f"Waiting for {sum(1 for a in pending_approvals if a['status'] == 'pending')} approval(s)",
            agent_used=current_response.agent_used,
            artifacts=current_response.artifacts,
            pending_approvals=updated_pending_approvals,
            error=current_response.error
        )
        
        # Save back to session
        active_sessions[request.session_id]["response"] = updated_response

    return {
        "status": request.decision,
        "approval_id": approval_id,
        "message": result_msg + ". Waiting for other approvals."
    }

@router.get("/session/{session_id}")
async def get_session(session_id: str):
    """Get current session status"""
    session = active_sessions.get(session_id)
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {
        "session_id": session_id,
        "task_id": session["task_id"],
        "status": session["status"],
        "has_response": "response" in session
    }

@router.get("/session/{session_id}/approvals")
async def get_pending_approvals(session_id: str):
    """Get all pending approvals for a session"""
    session = active_sessions.get(session_id)
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    response = session.get("response")
    if not response:
        return {"pending_approvals": []}
    
    # Convert to dict if it's a Pydantic model
    if hasattr(response, 'dict'):
        response_dict = response.dict()
    else:
        response_dict = response
    
    return {
        "session_id": session_id,
        "task_id": session["task_id"],
        "status": session["status"],
        "pending_approvals": response_dict.get("pending_approvals", []),
        "artifacts": response_dict.get("artifacts", [])
    }
