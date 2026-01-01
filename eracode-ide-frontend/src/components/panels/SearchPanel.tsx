import { Search, MoreHorizontal } from 'lucide-react'

export default function SearchPanel() {
  return (
    <div className="w-[250px] h-full bg-dark-surface border-r border-dark-border flex flex-col shrink-0">
      <div className="h-9 px-3 flex items-center justify-between bg-dark-header border-b border-dark-border">
        <span className="text-[11px] font-bold tracking-wide text-text-secondary uppercase">
          Search
        </span>
        <MoreHorizontal size={16} className="text-text-secondary hover:text-white cursor-pointer" />
      </div>
      <div className="flex-1 p-3">
        <input 
          type="text" 
          placeholder="Search files..."
          className="w-full bg-dark-hover border border-dark-border rounded px-3 py-2 text-[13px] text-text-primary placeholder-text-secondary focus:outline-none focus:border-primary"
        />
        <div className="mt-4 text-center text-text-secondary text-sm">
          <Search size={48} className="mx-auto mb-2 opacity-30" />
          <p>Search across files</p>
        </div>
      </div>
    </div>
  )
}
