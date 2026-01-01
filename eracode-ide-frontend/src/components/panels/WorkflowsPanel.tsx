import { MoreHorizontal } from 'lucide-react'

export default function WorkflowsPanel() {
  return (
    <div className="w-[280px] h-full bg-dark-surface border-r border-dark-border flex flex-col shrink-0">
      <div className="h-9 px-3 flex items-center justify-between bg-dark-header border-b border-dark-border">
        <span className="text-[11px] font-bold tracking-wide text-yellow-400 uppercase">
          AI Workflows
        </span>
        <MoreHorizontal size={16} className="text-text-secondary hover:text-white cursor-pointer" />
      </div>
      <div className="flex-1 p-3">
        <div className="space-y-2">
          <div className="p-3 bg-dark-hover rounded border border-dark-border hover:border-yellow-400/50 cursor-pointer">
            <p className="text-sm text-white">⚡ Generate Tests</p>
          </div>
          <div className="p-3 bg-dark-hover rounded border border-dark-border hover:border-yellow-400/50 cursor-pointer">
            <p className="text-sm text-white">⚡ Refactor Code</p>
          </div>
          <div className="p-3 bg-dark-hover rounded border border-dark-border hover:border-yellow-400/50 cursor-pointer">
            <p className="text-sm text-white">⚡ Fix Bugs</p>
          </div>
        </div>
      </div>
    </div>
  )
}
