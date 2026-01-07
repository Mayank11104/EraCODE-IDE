import { MoreHorizontal } from 'lucide-react'

export default function MonitoringPanel() {
  return (
    <div className="w-[250px] h-full bg-dark-surface border-r border-dark-border flex flex-col shrink-0">
      <div className="h-9 px-3 flex items-center justify-between bg-dark-header border-b border-dark-border">
        <span className="text-[11px] font-bold tracking-wide text-red-400 uppercase">
          Live Monitoring
        </span>
        <MoreHorizontal size={16} className="text-text-secondary hover:text-white cursor-pointer" />
      </div>
      <div className="flex-1 p-3">
        <div className="space-y-2">
          <div className="p-2 bg-dark-hover rounded">
            <p className="text-xs text-text-secondary">CPU: <span className="text-green-400">23%</span></p>
          </div>
          <div className="p-2 bg-dark-hover rounded">
            <p className="text-xs text-text-secondary">Memory: <span className="text-yellow-400">1.2GB</span></p>
          </div>
        </div>
      </div>
    </div>
  )
}
