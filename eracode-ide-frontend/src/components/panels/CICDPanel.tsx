import { MoreHorizontal } from 'lucide-react'

export default function CICDPanel() {
  return (
    <div className="w-[250px] h-full bg-dark-surface border-r border-dark-border flex flex-col shrink-0">
      <div className="h-9 px-3 flex items-center justify-between bg-dark-header border-b border-dark-border">
        <span className="text-[11px] font-bold tracking-wide text-green-400 uppercase">
          CI/CD Pipeline
        </span>
        <MoreHorizontal size={16} className="text-text-secondary hover:text-white cursor-pointer" />
      </div>
      <div className="flex-1 p-3">
        <div className="space-y-2">
          <div className="p-3 bg-dark-hover rounded border border-green-500/30">
            <p className="text-xs text-green-400">✓ Build Passing</p>
            <p className="text-[11px] text-text-secondary mt-1">Last run: 2 min ago</p>
          </div>
          <div className="p-3 bg-dark-hover rounded border border-dark-border">
            <p className="text-xs text-text-primary">Tests: 24/24</p>
          </div>
        </div>
      </div>
    </div>
  )
}
