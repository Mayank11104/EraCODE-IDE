// src/components/panels/projects/KanbanColumn.tsx

import { useDroppable } from '@dnd-kit/core'
import { Plus } from 'lucide-react'
import KanbanCard from './KanbanCard'

interface Card {
  id: string
  title: string
  description?: string
  assignee?: string
  labels?: string[]
  dueDate?: string
  branch?: string
  status: string
}

interface Column {
  id: string
  title: string
  color: string
  gradient: string
}

interface KanbanColumnProps {
  column: Column
  cards: Card[]
  onCardClick: (card: Card) => void
  onAddCard: () => void
}

export default function KanbanColumn({ column, cards, onCardClick, onAddCard }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  })

  // Color-specific gradients for different states
  const getColorAccent = () => {
    if (column.id === 'todo') return 'rgba(156, 163, 175, 0.6)'
    if (column.id === 'in-progress') return 'rgba(59, 130, 246, 0.6)'
    if (column.id === 'review') return 'rgba(234, 179, 8, 0.6)'
    if (column.id === 'done') return 'rgba(34, 197, 94, 0.6)'
    return 'rgba(168, 85, 247, 0.6)'
  }

  const getHoverColor = () => {
    if (column.id === 'todo') return 'hover:text-gray-300'
    if (column.id === 'in-progress') return 'hover:text-blue-300'
    if (column.id === 'review') return 'hover:text-yellow-300'
    if (column.id === 'done') return 'hover:text-green-300'
    return 'hover:text-purple-300'
  }

  return (
    <div 
      ref={setNodeRef}
      className="flex flex-col w-80 shrink-0 rounded-2xl transition-all duration-300 overflow-hidden"
      style={{
        background: isOver 
          ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.08) 0%, rgba(139, 92, 246, 0.12) 100%)'
          : 'linear-gradient(135deg, #1E1E1E 0%, #252525 100%)',
        border: isOver 
          ? `2px solid ${getColorAccent()}`
          : '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: isOver 
          ? `0 20px 60px ${getColorAccent().replace('0.6', '0.3')}, 0 0 40px ${getColorAccent().replace('0.6', '0.2')}`
          : '0 4px 20px rgba(0, 0, 0, 0.3)'
      }}
    >
      {/* Top glow indicator */}
      <div 
        className="h-1 w-full transition-opacity duration-300"
        style={{
          background: column.gradient,
          opacity: isOver ? 1 : 0.6
        }}
      />

      {/* Column Header */}
      <div 
        className="flex items-center justify-between px-5 py-4 border-b"
        style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0.01) 100%)',
          borderColor: 'rgba(255, 255, 255, 0.08)'
        }}
      >
        <div className="flex items-center gap-3">
          <h3 className={`text-sm font-bold ${column.color} tracking-wide`}>
            {column.title}
          </h3>
          <span 
            className="px-2.5 py-1 text-xs font-bold rounded-full transition-all duration-200"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              color: '#9ca3af',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            {cards.length}
          </span>
        </div>
        <button
          onClick={onAddCard}
          className={`p-2 rounded-xl text-gray-400 ${getHoverColor()} transition-all duration-200 hover:scale-110 hover:rotate-90 group`}
          style={{ background: 'rgba(255, 255, 255, 0.04)' }}
          title="Add Card"
        >
          <Plus size={16} className="transition-transform duration-200" />
        </button>
      </div>

      {/* Cards Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px] custom-scrollbar">
        {cards.length === 0 ? (
          <div 
            className={`flex flex-col items-center justify-center h-40 rounded-xl border-2 border-dashed transition-all duration-300 ${
              isOver ? 'scale-105' : ''
            }`}
            style={{
              borderColor: isOver ? getColorAccent() : 'rgba(255, 255, 255, 0.1)',
              background: isOver 
                ? `radial-gradient(circle at center, ${getColorAccent().replace('0.6', '0.08')}, transparent)`
                : 'rgba(255, 255, 255, 0.02)'
            }}
          >
            <div 
              className="p-3 rounded-full mb-2 transition-all duration-300"
              style={{ 
                background: isOver ? getColorAccent().replace('0.6', '0.15') : 'rgba(255, 255, 255, 0.05)'
              }}
            >
              <Plus size={20} className={`${column.color} transition-transform duration-300 ${isOver ? 'scale-110' : ''}`} />
            </div>
            <p className={`text-sm font-semibold ${isOver ? column.color : 'text-gray-500'} transition-colors duration-300`}>
              {isOver ? 'Drop here' : 'No cards yet'}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              {isOver ? '' : 'Click + to add a card'}
            </p>
          </div>
        ) : (
          cards.map(card => (
            <KanbanCard
              key={card.id}
              card={card}
              onClick={() => onCardClick(card)}
            />
          ))
        )}
      </div>

      {/* Subtle bottom gradient */}
      <div 
        className="h-8 pointer-events-none"
        style={{
          background: 'linear-gradient(to top, rgba(30, 30, 30, 0.8), transparent)'
        }}
      />
    </div>
  )
}