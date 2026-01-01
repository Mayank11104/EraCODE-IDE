import { Bug, MoreHorizontal } from 'lucide-react'

export default function DebugPanel() {
  return (
    <div className="w-[250px] h-full bg-dark-surface border-r border-dark-border flex flex-col shrink-0">
      <div className="h-9 px-3 flex items-center justify-between bg-dark-header border-b border-dark-border">
        <span className="text-[11px] font-bold tracking-wide text-text-secondary uppercase">
          Debug & Run
        </span>
        <MoreHorizontal size={16} className="text-text-secondary hover:text-white cursor-pointer" />
      </div>
      <div className="flex-1 p-3">
        <div className="text-center text-text-secondary text-sm">
          <Bug size={48} className="mx-auto mb-2 opacity-30" />
          <p>Debug Console</p>
        </div>
      </div>
    </div>
  )
}
