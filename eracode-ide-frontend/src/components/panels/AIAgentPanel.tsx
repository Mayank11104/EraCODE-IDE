import { Bot, MoreHorizontal } from 'lucide-react'

export default function AIAgentPanel() {
  return (
    <div className="w-[320px] h-full bg-dark-surface border-r border-dark-border flex flex-col shrink-0">
      <div className="h-9 px-3 flex items-center justify-between bg-dark-header border-b border-dark-border">
        <span className="text-[11px] font-bold tracking-wide text-purple-400 uppercase flex items-center gap-2">
          <Bot size={16} />
          AI Agent
        </span>
        <MoreHorizontal size={16} className="text-text-secondary hover:text-white cursor-pointer" />
      </div>
      <div className="flex-1 p-3">
        <div className="text-center text-text-secondary text-sm">
          <Bot size={48} className="mx-auto mb-2 text-purple-400 opacity-50" />
          <p>AI Assistant Chat</p>
          <p className="text-xs mt-2">Coming soon...</p>
        </div>
      </div>
    </div>
  )
}
