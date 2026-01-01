import { Plug, MoreHorizontal } from 'lucide-react'

export default function APITesterPanel() {
  return (
    <div className="w-[300px] h-full bg-dark-surface border-r border-dark-border flex flex-col shrink-0">
      <div className="h-9 px-3 flex items-center justify-between bg-dark-header border-b border-dark-border">
        <span className="text-[11px] font-bold tracking-wide text-pink-400 uppercase">
          API Tester
        </span>
        <MoreHorizontal size={16} className="text-text-secondary hover:text-white cursor-pointer" />
      </div>
      <div className="flex-1 p-3">
        <input 
          type="text" 
          placeholder="https://api.example.com"
          className="w-full bg-dark-hover border border-dark-border rounded px-3 py-2 text-[13px] text-text-primary mb-2"
        />
        <button className="w-full px-4 py-2 bg-pink-500 text-white rounded text-sm hover:bg-pink-600">
          Send Request
        </button>
      </div>
    </div>
  )
}
