import { create } from 'zustand';
import { agentService } from '../services/agentService';
import type { /* AgentResponse, */ PendingApproval } from '../types/agent.types';
// import { useEditorStore } from './editorStore';
import { useFileSystemStore } from './fileSystemStore';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    pendingApprovals?: PendingApproval[];
}

interface AgentState {
    messages: Message[];
    isThinking: boolean;
    sessionId: string;
    currentTaskId: string | null;

    // Actions
    initializeSession: () => void;
    sendMessage: (content: string) => Promise<void>;
    pollStatus: () => Promise<void>;
    approveAction: (approvalId: string) => Promise<void>;
    rejectAction: (approvalId: string) => Promise<void>;
}

export const useAgentStore = create<AgentState>((set, get) => ({
    messages: [
        {
            id: '1',
            role: 'assistant',
            content: "Hello! I'm EraCode AI Assistant. How can I help you with your code today?",
            timestamp: new Date()
        }
    ],
    isThinking: false,
    sessionId: '',
    currentTaskId: null,

    initializeSession: () => {
        // Generate a session ID if one doesn't exist
        const sessionId = `session_${Math.random().toString(36).substr(2, 9)}`;
        set({ sessionId });
    },

    sendMessage: async (content: string) => {
        const { sessionId } = get();

        // Add user message
        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content,
            timestamp: new Date()
        };

        set(state => ({
            messages: [...state.messages, userMessage],
            isThinking: true
        }));

        try {
            // Gather context
            // Note: accessing other stores via hooks isn't possible directly in vanilla JS logic outside React components
            // but we can assume these would be passed or we can use the getState() method if available on the stores.
            // For now, let's grab from the DOM/Store if exported, or pass basic data.
            // Better approach: Import the store instance directly if it's not a hook-only store.
            // Looking at imports, `useEditorStore` is likely a hook. Zustand stores also have `getState()`.

            // const openFiles = useEditorStore.getState().openFiles;

            // We might need to fetch file content.
            // For this MVP, let's send basic info.
            // We might need to fetch file content.
            // For this MVP, let's send basic info.

            // NOTE: We probably need async file reading here if we want to send content.
            // For now, we will send file paths.

            const rootPath = useFileSystemStore.getState().rootDirectory?.path || "e:/shreyash project/eracode-ide";

            const response = await agentService.execute({
                message: content,
                project_path: rootPath, // Dynamic path from explorer
                file_tree: [], // TODO: Populate this
                open_files: [], // Backend expects list[dict]
                session_id: sessionId,
                permission_level: "auto" // Backend expects "off" | "auto" | "turbo"
            });

            set({ currentTaskId: response.task_id });

            // Start polling
            get().pollStatus();

        } catch (error) {
            console.error(error);
            set(state => ({
                messages: [...state.messages, {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: 'Sorry, I encountered an error connecting to the agent backend.',
                    timestamp: new Date()
                }],
                isThinking: false
            }));
        }
    },

    pollStatus: async () => {
        const { sessionId, currentTaskId } = get();
        if (!sessionId || !currentTaskId) return;

        const interval = setInterval(async () => {
            try {
                const status = await agentService.getSession(sessionId);

                if (status.status === 'completed' || status.status === 'waiting_approval' || status.status === 'failed') {
                    clearInterval(interval);
                    set({ isThinking: false });

                    let aiContent = status.message;
                    if (status.status === 'waiting_approval') {
                        aiContent = `I have a plan that requires your approval.`;
                    } else if (status.status === 'completed') {
                        if (status.artifacts && status.artifacts.length > 0) {
                            aiContent = "Task completed. I've updated the files.";
                        }
                    }

                    const currentMessages = get().messages;
                    const lastMsgIndex = currentMessages.length - 1;
                    const lastMsg = currentMessages[lastMsgIndex];

                    const aiMessage: Message = {
                        id: lastMsg?.role === 'assistant' ? lastMsg.id : Date.now().toString(),
                        role: 'assistant',
                        content: aiContent,
                        timestamp: new Date(),
                        pendingApprovals: status.pending_approvals
                    };

                    // If the last message was from the assistant, update it instead of appending
                    // This prevents "new message" spam when only the approval status changes
                    if (lastMsg && lastMsg.role === 'assistant') {
                        const newMessages = [...currentMessages];
                        newMessages[lastMsgIndex] = aiMessage;
                        set({ messages: newMessages });
                    } else {
                        set(state => ({
                            messages: [...state.messages, aiMessage]
                        }));
                    }
                }
            } catch (error) {
                clearInterval(interval);
                set({ isThinking: false });
            }
        }, 2000);
    },

    approveAction: async (approvalId: string) => {
        const { sessionId } = get();
        try {
            const result = await agentService.approveAction(approvalId, {
                session_id: sessionId,
                decision: 'approved',
                approval_id: approvalId // Required by backend Pydantic model
            });

            // Update file explorer if a file was created/updated
            if (result && result.status === 'applied' && result.result?.success) {
                const filePath: string = result.result.file; // Relative path e.g. "style.css" or "src/style.css"
                const rootPath = useFileSystemStore.getState().rootDirectory?.path;

                if (rootPath) {
                    const fullPath = `${rootPath}/${filePath}`.replace(/\\/g, '/');
                    const fileName = filePath.split('/').pop() || filePath;

                    // Add to store
                    useFileSystemStore.getState().addNode(rootPath, {
                        id: fullPath,
                        name: fileName,
                        type: 'file',
                        path: fullPath
                    });
                }
            }

            // Refresh status to clear the approval button
            // Update local state to remove the approval from the message
            set(state => ({
                messages: state.messages.map(msg => ({
                    ...msg,
                    pendingApprovals: msg.pendingApprovals?.filter(a => a.id !== approvalId)
                }))
            }));

            // Continue polling if needed (if the backend processes more after approval)
            get().pollStatus();

        } catch (error) {
            console.error("Failed to approve", error);
        }
    },

    rejectAction: async (approvalId: string) => {
        const { sessionId } = get();
        try {
            await agentService.approveAction(approvalId, {
                session_id: sessionId,
                decision: 'rejected',
                approval_id: approvalId // Required by backend Pydantic model
            });

            set(state => ({
                messages: state.messages.map(msg => ({
                    ...msg,
                    pendingApprovals: msg.pendingApprovals?.filter(a => a.id !== approvalId)
                }))
            }));
        } catch (error) {
            console.error("Failed to reject", error);
        }
    }

}));
