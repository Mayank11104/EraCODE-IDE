import { Cloud, MoreHorizontal } from 'lucide-react'

export default function DeployPanel() {
  return (
    <div className="w-[280px] h-full bg-dark-surface border-r border-dark-border flex flex-col shrink-0">
      <div className="h-9 px-3 flex items-center justify-between bg-dark-header border-b border-dark-border">
        <span className="text-[11px] font-bold tracking-wide text-orange-400 uppercase">
          Cloud Deploy
        </span>
        <MoreHorizontal size={16} className="text-text-secondary hover:text-white cursor-pointer" />
      </div>
      <div className="flex-1 p-3">
        <button className="w-full px-4 py-2 bg-orange-500 text-white rounded text-sm hover:bg-orange-600">
          Deploy to Production
        </button>
      </div>
    </div>
  )
}
