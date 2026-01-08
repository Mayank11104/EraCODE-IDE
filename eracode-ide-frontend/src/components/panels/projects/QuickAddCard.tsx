// src/components/panels/projects/QuickAddCard.tsx
import { useState } from 'react'
import { X, Plus, Sparkles } from 'lucide-react'

interface QuickAddCardProps {
  columnId: string
  onAdd: (title: string, columnId: string) => void
  onCancel: () => void
}

export default function QuickAddCard({ columnId, onAdd, onCancel }: QuickAddCardProps) {
  const [title, setTitle] = useState('')

  const handleSubmit = () => {
    if (title.trim()) {
      onAdd(title.trim(), columnId)
      setTitle('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel()
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div
      className="rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 fade-in duration-200"
      style={{
        background: 'linear-gradient(135deg, #1E1E1E 0%, #252525 100%)',
        border: '1px solid rgba(168, 85, 247, 0.25)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(168, 85, 247, 0.15)'
      }}
    >
      {/* Top glow line */}
      <div 
        className="h-1 w-full"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(168, 85, 247, 0.6), transparent)'
        }}
      />

      <div className="p-4 space-y-3">
        {/* Title with icon */}
        <div className="flex items-center gap-2 mb-1">
          <div 
            className="p-1.5 rounded-lg"
            style={{ background: 'rgba(168, 85, 247, 0.15)' }}
          >
            <Sparkles size={12} className="text-purple-400" />
          </div>
          <span className="text-xs font-bold text-purple-300 tracking-wide">Quick Add Task</span>
        </div>

        {/* Textarea */}
        <textarea
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={3}
          autoFocus
          placeholder="What needs to be done?"
          className="w-full text-sm text-white placeholder:text-gray-500 bg-transparent resize-none rounded-xl px-4 py-3 focus:outline-none transition-all duration-200"
          style={{
            border: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'rgba(255, 255, 255, 0.04)',
          }}
          onFocus={e => {
            e.target.style.border = '1px solid rgba(168, 85, 247, 0.6)'
            e.target.style.boxShadow = '0 0 20px rgba(168, 85, 247, 0.15)'
          }}
          onBlur={e => {
            e.target.style.border = '1px solid rgba(255, 255, 255, 0.1)'
            e.target.style.boxShadow = 'none'
          }}
        />

        {/* Helper text */}
        <div className="flex items-center gap-2 text-[10px] text-gray-500">
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-white/5 text-purple-300 font-mono border border-white/10">Enter</kbd>
            <span>to add</span>
          </div>
          <span className="text-gray-600">•</span>
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-white/5 text-gray-300 font-mono border border-white/10">Esc</kbd>
            <span>to cancel</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white rounded-xl transition-all duration-200 hover:scale-105"
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <X size={12} className="inline mr-1.5" />
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!title.trim()}
            className="px-4 py-2 text-xs font-bold text-white rounded-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-1.5"
            style={{
              background: title.trim()
                ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.9) 0%, rgba(139, 92, 246, 1) 100%)'
                : 'rgba(255, 255, 255, 0.1)',
              boxShadow: title.trim() ? '0 0 20px rgba(168, 85, 247, 0.4)' : 'none'
            }}
          >
            <Plus size={12} />
            Add Task
          </button>
        </div>
      </div>

      {/* Bottom subtle glow */}
      <div 
        className="h-px w-full"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(168, 85, 247, 0.3), transparent)'
        }}
      />
    </div>
  )
}