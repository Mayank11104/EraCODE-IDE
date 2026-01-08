export interface AgentRequest {
    message: string;
    project_path: string;
    file_tree: string[];
    open_files: { path: string, content: string }[]; // List of files
    session_id: string;
    callback_url?: string;
    permission_level?: "off" | "auto" | "turbo"; // Matched backend literal types
}

export interface AgentResponse {
    task_id: string;
    status: "processing" | "completed" | "failed" | "waiting_approval";
    message: string;
    agent_used: string;
    artifacts: Artifact[];
    pending_approvals: PendingApproval[];
    error?: string;
}

export interface Artifact {
    type: "code_edit" | "terminal_command" | "file_create" | "other";
    content: any;
    requires_approval: boolean;
}

export interface PendingApproval {
    id: string;
    type: "code_edit" | "terminal_command";
    artifact: Artifact;
    status: "pending" | "approved" | "rejected";
}

export interface ApprovalRequest {
    session_id: string;
    approval_id: string;
    decision: "approved" | "rejected";
    feedback?: string;
}
