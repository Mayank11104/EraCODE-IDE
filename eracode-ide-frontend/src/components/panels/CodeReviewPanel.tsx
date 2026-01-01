import { Eye, MoreHorizontal } from 'lucide-react'

export default function CodeReviewPanel() {
  return (
    <div className="w-[280px] h-full bg-dark-surface border-r border-dark-border flex flex-col shrink-0">
      <div className="h-9 px-3 flex items-center justify-between bg-dark-header border-b border-dark-border">
        <span className="text-[11px] font-bold tracking-wide text-blue-400 uppercase">
          Code Review
        </span>
        <MoreHorizontal size={16} className="text-text-secondary hover:text-white cursor-pointer" />
      </div>
      <div className="flex-1 p-3">
        <div className="text-center text-text-secondary text-sm">
          <Eye size={48} className="mx-auto mb-2 text-blue-400 opacity-50" />
          <p>AI Code Review</p>
        </div>
      </div>
    </div>
  )
}
