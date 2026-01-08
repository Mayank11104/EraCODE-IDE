// src/components/panels/projects/BoardSelector.tsx

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface Board {
  id: string
  name: string
  description?: string
}

interface BoardSelectorProps {
  boards: Board[]
  activeBoard: string | null
  onSelectBoard: (boardId: string) => void
}

export default function BoardSelector({ boards, activeBoard, onSelectBoard }: BoardSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  const activeBoardData = boards.find(b => b.id === activeBoard)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 hover:scale-105"
        style={{
          background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.12) 0%, rgba(139, 92, 246, 0.18) 100%)',
          border: '1px solid rgba(168, 85, 247, 0.25)',
          boxShadow: isOpen ? '0 0 20px rgba(168, 85, 247, 0.3)' : 'none'
        }}
      >
        <span className="font-bold text-sm text-white tracking-wide">
          {activeBoardData?.name || 'Select Board'}
        </span>
        <ChevronDown 
          size={16} 
          className={`text-purple-400 transition-all duration-300 ${isOpen ? 'rotate-180 scale-110' : ''}`} 
        />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10 animate-in fade-in duration-200"
            style={{ background: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(2px)' }}
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div 
            className="absolute top-full left-0 mt-2 w-80 rounded-2xl shadow-2xl z-20 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300"
            style={{
              background: 'linear-gradient(135deg, #1E1E1E 0%, #252525 100%)',
              border: '1px solid rgba(168, 85, 247, 0.25)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(168, 85, 247, 0.15)'
            }}
          >
            {/* Glow effect at top */}
            <div 
              className="h-1 w-full"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(168, 85, 247, 0.5), transparent)'
              }}
            />
            
            {boards.map((board, index) => (
              <div
                key={board.id}
                onClick={() => {
                  onSelectBoard(board.id)
                  setIsOpen(false)
                }}
                className={`group px-5 py-4 cursor-pointer transition-all duration-200 relative ${
                  board.id === activeBoard 
                    ? 'bg-gradient-to-r from-purple-500/20 via-purple-600/15 to-transparent' 
                    : 'hover:bg-white/5'
                }`}
                style={{
                  borderLeft: board.id === activeBoard ? '4px solid rgba(168, 85, 247, 0.9)' : '4px solid transparent',
                  borderBottom: index < boards.length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none'
                }}
              >
                {/* Hover glow effect */}
                {board.id !== activeBoard && (
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{
                      background: 'linear-gradient(90deg, rgba(168, 85, 247, 0.05), transparent)'
                    }}
                  />
                )}
                
                <div className="relative">
                  <div className={`font-bold text-sm mb-1 transition-all duration-200 ${
                    board.id === activeBoard 
                      ? 'text-purple-400' 
                      : 'text-white group-hover:text-purple-300'
                  }`}>
                    {board.name}
                  </div>
                  {board.description && (
                    <div className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors duration-200">
                      {board.description}
                    </div>
                  )}
                </div>
                
                {/* Active indicator */}
                {board.id === activeBoard && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" 
                         style={{ boxShadow: '0 0 10px rgba(168, 85, 247, 0.8)' }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}