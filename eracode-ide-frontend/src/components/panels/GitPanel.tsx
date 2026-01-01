import { GitBranch, MoreHorizontal } from 'lucide-react'

export default function GitPanel() {
  return (
    <div className="w-[250px] h-full bg-dark-surface border-r border-dark-border flex flex-col shrink-0">
      <div className="h-9 px-3 flex items-center justify-between bg-dark-header border-b border-dark-border">
        <span className="text-[11px] font-bold tracking-wide text-text-secondary uppercase">
          Source Control
        </span>
        <MoreHorizontal size={16} className="text-text-secondary hover:text-white cursor-pointer" />
      </div>
      <div className="flex-1 p-3">
        <div className="text-center text-text-secondary text-sm">
          <GitBranch size={48} className="mx-auto mb-2 opacity-30" />
          <p className="mb-2">Git Repository</p>
          <button className="px-4 py-2 bg-primary text-white rounded text-xs hover:bg-blue-600">
            Initialize Repository
          </button>
        </div>
      </div>
    </div>
  )
}
