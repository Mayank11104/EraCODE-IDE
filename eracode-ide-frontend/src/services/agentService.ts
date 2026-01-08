import type { AgentRequest, AgentResponse, ApprovalRequest } from '../types/agent.types';

const API_BASE_URL = 'http://localhost:8000/agent'; // Adjusted to match backend route prefix

export const agentService = {
    async execute(request: AgentRequest): Promise<AgentResponse> {
        const response = await fetch(`${API_BASE_URL}/execute`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(request),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || 'Failed to execute agent task');
        }

        return response.json();
    },

    async getSession(sessionId: string): Promise<AgentResponse> {
        const response = await fetch(`${API_BASE_URL}/session/${sessionId}/approvals`, { // Using approvals endpoint to get full state including pending approvals
            method: 'GET'
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || 'Failed to fetch session');
        }

        return response.json();
    },

    async approveAction(approvalId: string, request: ApprovalRequest): Promise<any> {
        const response = await fetch(`${API_BASE_URL}/approve/${approvalId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(request),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || 'Failed to submit approval');
        }

        return response.json();
    }
};
