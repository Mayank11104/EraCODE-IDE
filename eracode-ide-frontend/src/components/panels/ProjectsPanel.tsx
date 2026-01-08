// src/components/panels/ProjectsPanel.tsx

import { useState, useEffect } from 'react'
import { LayoutGrid, Plus, Settings } from 'lucide-react'
import KanbanBoard from './projects/KanbanBoard'
import BoardSelector from './projects/BoardSelector'

interface Board {
  id: string
  name: string
  description?: string
}

export default function ProjectsPanel() {
  const [boards, setBoards] = useState<Board[]>([])
  const [activeBoard, setActiveBoard] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // TODO: Fetch boards from backend
    // For now, mock data
    const mockBoards: Board[] = [
      { id: 'board-1', name: 'EraCode IDE Development', description: 'Main development board' }
    ]
    setBoards(mockBoards)
    setActiveBoard(mockBoards[0]?.id || null)
    setIsLoading(false)
  }, [])

  const handleCreateBoard = () => {
    // TODO: Open modal to create new board
    console.log('Create new board')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400" style={{ background: '#1E1E1E' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="animate-spin">
              <LayoutGrid size={40} className="text-purple-400" />
            </div>
            <div className="absolute inset-0 animate-ping opacity-20">
              <LayoutGrid size={40} className="text-purple-400" />
            </div>
          </div>
          <p className="text-sm font-medium animate-pulse">Loading projects...</p>
        </div>
      </div>
    )
  }

  if (boards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400" style={{ background: '#1E1E1E' }}>
        <div className="relative mb-6">
          <div className="absolute inset-0 blur-3xl opacity-30 bg-purple-500 rounded-full" />
          <LayoutGrid size={80} className="relative opacity-40 text-purple-400" />
        </div>
        <h3 className="text-xl font-bold mb-3 text-white">No Projects Yet</h3>
        <p className="text-sm mb-8 text-gray-500 max-w-md text-center">
          Create your first project board to organize your work and boost productivity
        </p>
        <button
          onClick={handleCreateBoard}
          className="group flex items-center gap-2.5 px-6 py-3 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/30"
          style={{
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.8) 0%, rgba(139, 92, 246, 0.9) 100%)',
          }}
        >
          <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
          Create Your First Project
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full" style={{ background: '#1E1E1E' }}>
      {/* Header */}
      <div 
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)',
          borderColor: 'rgba(255, 255, 255, 0.06)',
          backdropFilter: 'blur(10px)'
        }}
      >
        <div className="flex items-center gap-4">
          <div className="p-2 rounded-xl" style={{ background: 'rgba(168, 85, 247, 0.1)' }}>
            <LayoutGrid size={20} className="text-purple-400" />
          </div>
          <BoardSelector
            boards={boards}
            activeBoard={activeBoard}
            onSelectBoard={setActiveBoard}
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCreateBoard}
            className="p-2 rounded-xl transition-all duration-200 text-gray-400 hover:text-purple-400 hover:scale-110"
            style={{ background: 'rgba(255, 255, 255, 0.03)' }}
            title="Create New Board"
          >
            <Plus size={18} />
          </button>
          <button
            className="p-2 rounded-xl transition-all duration-200 text-gray-400 hover:text-purple-400 hover:scale-110"
            style={{ background: 'rgba(255, 255, 255, 0.03)' }}
            title="Board Settings"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      {activeBoard && (
        <KanbanBoard boardId={activeBoard} />
      )}
    </div>
  )
}