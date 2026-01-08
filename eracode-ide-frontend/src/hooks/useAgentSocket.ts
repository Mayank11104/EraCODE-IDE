
import { useEffect, useRef, useState, useCallback } from 'react';

// Configuration
const AGENT_WS_URL = 'ws://localhost:8000/agent/ws'; // Connects to Python FastAPI Backend

export type AgentMessage = {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    status?: 'sending' | 'thinking' | 'done' | 'error';
    artifacts?: any[]; // For generated code/commands
    pending_approvals?: any[]; // For code/command approvals
};

export function useAgentSocket() {
    const socketRef = useRef<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [messages, setMessages] = useState<AgentMessage[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: 'Hello! I am your AI Developer Agent. I can help you analyze code, fix bugs, or generate new features. Just ask!',
            timestamp: new Date(),
        },
    ]);
    const [isThinking, setIsThinking] = useState(false);

    // Initialize WebSocket
    useEffect(() => {
        connect();
        return () => {
            if (socketRef.current) socketRef.current.close();
        };
    }, []);

    const connect = useCallback(() => {
        if (socketRef.current?.readyState === WebSocket.OPEN) return;

        console.log('🔌 Connecting to Agent Backend:', AGENT_WS_URL);
        const ws = new WebSocket(AGENT_WS_URL);
        socketRef.current = ws;

        ws.onopen = () => {
            console.log('✅ Agent Socket Connected');
            setIsConnected(true);
        };

        ws.onclose = () => {
            console.log('❌ Agent Socket Disconnected');
            setIsConnected(false);
            // Auto-reconnect after 3s
            setTimeout(connect, 3000);
        };

        ws.onerror = (err) => {
            console.error('⚠️ Agent Socket Error:', err);
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                handleServerMessage(data);
            } catch (e) {
                console.error('❌ Failed to parse agent message:', e);
            }
        };
    }, []);

    const handleServerMessage = (data: any) => {
        console.log('📩 Received from Agent:', data);

        // Logic to handle different response types
        if (data.type === 'status') {
            // "AI is thinking..."
            setIsThinking(true);
        }
        else if (data.type === 'text_response' || data.type === 'analysis_result' || data.type === 'code_task_auth' || data.type === 'error') {
            setIsThinking(false);

            let content = '';

            if (data.type === 'error') {
                content = `❌ Error: ${data.message}`;
            } else if (data.type === 'analysis_result') {
                const res = data.result;
                const relevantFiles = res.relevant_files?.map((f: string) => `- \`${f}\``).join('\n') || 'None';

                let fileContext = '';
                if (res.file_contents && Object.keys(res.file_contents).length > 0) {
                    fileContext = '\n\n**📄 File Contents:**\n';
                    Object.entries(res.file_contents).forEach(([file, code]) => {
                        const ext = file.split('.').pop() || '';
                        // Normalize Windows paths for display
                        const displayPath = file.replace(/\\/g, '/');
                        fileContext += `\n**${displayPath}**\n\`\`\`${ext}\n${code}\n\`\`\`\n`;
                    });
                }

                content = `**📊 Analysis Report**\n\n**📂 Project Structure:**\n${res.project_structure}\n\n**🔍 Relevant Files:**\n${relevantFiles}\n\n**💡 Recommendations:**\n${res.recommendations}${fileContext}`;

                if (res.validation_info) {
                    content += `\n\n---\n*Debug: Found ${res.validation_info.files_found} files in \`${res.validation_info.project_path}\`*\n*Preview: ${res.validation_info.file_list_preview.join(', ')}*`;
                }
            } else if (data.type === 'code_task_auth') {
                content = data.result?.message || 'Code changes generated. Please review via the Review tab.';
            } else {
                content = data.result?.message || JSON.stringify(data.result);
            }

            const newMessage: AgentMessage = {
                id: Date.now().toString(),
                role: 'assistant',
                content: content,
                timestamp: new Date(),
                artifacts: data.result?.artifacts,
                pending_approvals: data.result?.pending_approvals
            };

            setMessages((prev) => [...prev, newMessage]);
        }
    };

    const sendMessage = (text: string, projectPath: string, openFiles: any[] = []) => {
        if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
            console.error('⚠️ Socket not connected');
            return;
        }

        // Add user message to UI immediately
        const userMsg: AgentMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: text,
            timestamp: new Date(),
            status: 'sending'
        };
        setMessages((prev) => [...prev, userMsg]);
        setIsThinking(true);

        // Send to backend (Intelligent Routing via 'chat' command)
        const payload = {
            command: 'chat', // Triggers the Supervisor
            message: text,
            project_path: projectPath,
            file_tree: [], // Can be populated if needed
            open_files: openFiles // Context for the supervisor
        };

        socketRef.current.send(JSON.stringify(payload));
    };

    const approveAction = async (approvalId: string, decision: 'approved' | 'rejected') => {
        try {
            const response = await fetch(`http://localhost:8000/agent/approve/${approvalId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    session_id: 'default', // TODO: sync session ID
                    decision: decision
                }),
            });
            const result = await response.json();
            console.log('✅ Approval result:', result);
            return result;
        } catch (error) {
            console.error('❌ Approval failed:', error);
            throw error;
        }
    };

    return {
        isConnected,
        messages,
        isThinking,
        sendMessage,
        approveAction
    };
}
