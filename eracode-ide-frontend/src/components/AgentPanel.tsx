import { useEffect, useState } from 'react'
import {
  Bot,
  MoreHorizontal,
  X,
  RefreshCw,
  Plus,
  Mic,
  Send,
  ChevronDown,
  Sparkles,
  Zap,
  Eye,
  Check,
  XCircle
} from 'lucide-react'
import { useAgentStore } from '../stores/agentStore'
// import { useEditorStore } from '../stores/editorStore' // Just in case we need it directly

interface AgentPanelProps {
  onClose: () => void
}

export default function AgentPanel({ onClose }: AgentPanelProps) {
  const [activeTab, setActiveTab] = useState('chat')
  const [input, setInput] = useState('')

  // Connect to store
  const {
    messages,
    isThinking,
    sendMessage,
    initializeSession,
    approveAction,
    rejectAction
  } = useAgentStore()

  useEffect(() => {
    initializeSession()
  }, [])

  const handleSend = () => {
    if (!input.trim()) return
    sendMessage(input)
    setInput('')
  }

  return (
    <div className="w-[340px] h-screen bg-dark-surface border-l border-dark-border flex flex-col shrink-0">
      {/* Header */}
      <div className="h-11 px-4 flex items-center justify-between bg-dark-header border-b border-dark-border">
        <div className="flex items-center gap-2">
          <Bot size={18} className="text-purple-400" />
          <span className="text-[13px] font-semibold text-text-primary">Agent</span>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-1 hover:bg-white/10 rounded transition-colors">
            <Plus size={16} className="text-text-secondary hover:text-white" />
          </button>
          <button className="p-1 hover:bg-white/10 rounded transition-colors">
            <RefreshCw size={16} className="text-text-secondary hover:text-white" />
          </button>
          <button className="p-1 hover:bg-white/10 rounded transition-colors">
            <MoreHorizontal size={16} className="text-text-secondary hover:text-white" />
          </button>
          {/* Close button */}
          <button
            onClick={onClose}
            className="p-1 hover:bg-red-500/20 hover:text-red-400 rounded transition-colors"
            title="Close Agent Panel"
          >
            <X size={16} className="text-text-secondary hover:text-red-400" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-dark-border bg-dark-header">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-[12px] font-medium transition-all ${activeTab === 'chat'
            ? 'text-purple-400 border-b-2 border-purple-400 bg-dark-surface/50'
            : 'text-text-secondary hover:text-white hover:bg-white/5'
            }`}
        >
          <Bot size={14} />
          Chat
        </button>
        <button
          onClick={() => setActiveTab('workflows')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-[12px] font-medium transition-all ${activeTab === 'workflows'
            ? 'text-yellow-400 border-b-2 border-yellow-400 bg-dark-surface/50'
            : 'text-text-secondary hover:text-white hover:bg-white/5'
            }`}
        >
          <Zap size={14} />
          Workflows
        </button>
        <button
          onClick={() => setActiveTab('review')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-[12px] font-medium transition-all ${activeTab === 'review'
            ? 'text-blue-400 border-b-2 border-blue-400 bg-dark-surface/50'
            : 'text-text-secondary hover:text-white hover:bg-white/5'
            }`}
        >
          <Eye size={14} />
          Review
        </button>
      </div>

      {/* Project Name */}
      <div className="px-4 py-3 border-b border-dark-border">
        <h3 className="text-[15px] font-bold text-text-primary">eracode_ide</h3>
      </div>

      {/* Content Area */}
      {activeTab === 'chat' && (
        <>
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'
                  }`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-4 py-2.5 ${message.role === 'user'
                    ? 'bg-primary/20 border border-primary/30 text-white'
                    : 'bg-dark-hover border border-dark-border text-text-primary'
                    }`}
                >
                  <p className="text-[13px] leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </p>
                </div>

                {/* Pending Approvals */}
                {message.role === 'assistant' && message.pendingApprovals && message.pendingApprovals.length > 0 && (
                  <div className="mt-2 w-full max-w-[85%] space-y-2">
                    {message.pendingApprovals.map(approval => (
                      <div key={approval.id} className="bg-dark-surface border border-yellow-500/30 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2 text-yellow-400">
                          <Zap size={14} />
                          <span className="text-xs font-semibold">Approval Required</span>
                        </div>
                        <div className="text-xs text-text-secondary mb-3">
                          {approval.type === 'code_edit' && `Edit file: ${approval.artifact.content.file}`}
                          {approval.type === 'terminal_command' && `Run command: ${approval.artifact.content.command}`}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => approveAction(approval.id)}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded hover:bg-green-500/30 transition-colors text-xs"
                          >
                            <Check size={12} /> Approve
                          </button>
                          <button
                            onClick={() => rejectAction(approval.id)}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded hover:bg-red-500/30 transition-colors text-xs"
                          >
                            <XCircle size={12} /> Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <span className="text-[10px] text-text-secondary mt-1 px-2">
                  {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}

            {isThinking && (
              <div className="flex items-start gap-2">
                <div className="bg-dark-hover border border-dark-border rounded-lg px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-[11px] text-text-secondary italic">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t border-dark-border bg-dark-header">
            <div className="p-3">
              <div className="flex flex-col bg-dark-surface border border-dark-border rounded-lg overflow-hidden focus-within:border-primary/50 transition-colors">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                  disabled={isThinking}
                  placeholder="Ask anything (Ctrl+L), @ to mention, / for workflow"
                  className="w-full bg-transparent border-none text-[13px] text-text-primary p-3 resize-none focus:outline-none placeholder-text-secondary/60 h-[80px]"
                />

                <div className="flex items-center justify-between px-3 py-2 bg-dark-hover/50 border-t border-dark-border/50">
                  <button className="p-1 hover:bg-white/10 rounded transition-colors">
                    <Plus size={16} className="text-text-secondary hover:text-white" />
                  </button>

                  <div className="flex items-center gap-2">
                    <button className="flex items-center gap-1.5 px-2.5 py-1 bg-dark-surface border border-dark-border rounded hover:border-white/30 transition-colors group">
                      <Sparkles size={12} className="text-yellow-400" />
                      <span className="text-[11px] font-medium text-text-primary">Fast</span>
                      <ChevronDown size={12} className="text-text-secondary group-hover:text-white" />
                    </button>

                    <button className="flex items-center gap-1.5 px-2.5 py-1 bg-dark-surface border border-dark-border rounded hover:border-white/30 transition-colors group">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-[11px] font-medium text-text-primary">Claude 4.5</span>
                      <ChevronDown size={12} className="text-text-secondary group-hover:text-white" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button className="p-1 hover:bg-white/10 rounded transition-colors">
                      <Mic size={16} className="text-text-secondary hover:text-white" />
                    </button>
                    <button
                      onClick={handleSend}
                      className="p-1.5 bg-primary hover:bg-blue-600 rounded transition-colors disabled:opacity-50"
                      disabled={!input.trim() || isThinking}
                    >
                      <Send size={14} className="text-white" />
                    </button>
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-center text-text-secondary/60 mt-2">
                AI can make mistakes. Double-check all generated code.
              </p>
            </div>
          </div>
        </>
      )}

      {activeTab === 'workflows' && (
        <div className="flex-1 p-4 space-y-3">
          <div className="p-4 bg-dark-hover rounded-lg border border-yellow-400/30 hover:border-yellow-400/50 cursor-pointer transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={16} className="text-yellow-400" />
              <h4 className="text-sm font-semibold text-white">Generate Tests</h4>
            </div>
            <p className="text-xs text-text-secondary">Auto-generate unit tests for your code</p>
          </div>

          <div className="p-4 bg-dark-hover rounded-lg border border-yellow-400/30 hover:border-yellow-400/50 cursor-pointer transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={16} className="text-yellow-400" />
              <h4 className="text-sm font-semibold text-white">Refactor Code</h4>
            </div>
            <p className="text-xs text-text-secondary">Improve code structure and readability</p>
          </div>

          <div className="p-4 bg-dark-hover rounded-lg border border-yellow-400/30 hover:border-yellow-400/50 cursor-pointer transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={16} className="text-yellow-400" />
              <h4 className="text-sm font-semibold text-white">Fix Bugs</h4>
            </div>
            <p className="text-xs text-text-secondary">Identify and fix common bugs</p>
          </div>
        </div>
      )}

      {activeTab === 'review' && (
        <div className="flex-1 p-4">
          <div className="text-center py-8">
            <Eye size={48} className="mx-auto mb-4 text-blue-400 opacity-50" />
            <h3 className="text-sm font-semibold text-white mb-2">AI Code Review</h3>
            <p className="text-xs text-text-secondary mb-4">
              Get intelligent feedback on your code quality, best practices, and potential improvements.
            </p>
            <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm transition-colors">
              Start Review
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

