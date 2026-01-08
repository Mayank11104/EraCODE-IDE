// src/components/panels/projects/KanbanCard.tsx

import { useDraggable } from '@dnd-kit/core'
import { User, Calendar, GitBranch, CheckSquare, MessageSquare } from 'lucide-react'
import { Card, Priority } from '../../../types/kanban.types'

interface KanbanCardProps {
  card: Card
  onClick: () => void
}

export default function KanbanCard({ card, onClick }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: card.id,
  })

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined

  // ⭐ Handle click separately from drag
  const handleClick = (e: React.MouseEvent) => {
    // Only trigger onClick if not dragging
    if (!isDragging) {
      e.stopPropagation()
      onClick()
    }
  }

  // ⭐ Get card style based on status
  const getCardStyle = (status: string) => {
    const styles = {
      'todo': {
        background: 'linear-gradient(135deg, rgba(88, 28, 135, 0.08) 0%, rgba(139, 92, 246, 0.05) 100%)',
        backgroundDragging: 'linear-gradient(135deg, rgba(88, 28, 135, 0.15) 0%, rgba(139, 92, 246, 0.12) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderDragging: '2px solid rgba(168, 85, 247, 0.6)',
        hoverGlow: 'radial-gradient(600px circle at 50% 50%, rgba(168, 85, 247, 0.08), transparent 40%)',
        titleColor: 'text-white group-hover:text-purple-300',
        dotColor: 'bg-purple-400/30 group-hover:bg-purple-400'
      },
      'in-progress': {
        background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(59, 130, 246, 0.05) 100%)',
        backgroundDragging: 'linear-gradient(135deg, rgba(37, 99, 235, 0.15) 0%, rgba(59, 130, 246, 0.12) 100%)',
        border: '1px solid rgba(59, 130, 246, 0.15)',
        borderDragging: '2px solid rgba(59, 130, 246, 0.6)',
        hoverGlow: 'radial-gradient(600px circle at 50% 50%, rgba(59, 130, 246, 0.08), transparent 40%)',
        titleColor: 'text-white group-hover:text-blue-300',
        dotColor: 'bg-blue-400/30 group-hover:bg-blue-400'
      },
      'review': {
        background: 'linear-gradient(135deg, rgba(202, 138, 4, 0.08) 0%, rgba(234, 179, 8, 0.05) 100%)',
        backgroundDragging: 'linear-gradient(135deg, rgba(202, 138, 4, 0.15) 0%, rgba(234, 179, 8, 0.12) 100%)',
        border: '1px solid rgba(234, 179, 8, 0.15)',
        borderDragging: '2px solid rgba(234, 179, 8, 0.6)',
        hoverGlow: 'radial-gradient(600px circle at 50% 50%, rgba(234, 179, 8, 0.08), transparent 40%)',
        titleColor: 'text-white group-hover:text-yellow-300',
        dotColor: 'bg-yellow-400/30 group-hover:bg-yellow-400'
      },
      'done': {
        background: 'linear-gradient(135deg, rgba(22, 163, 74, 0.08) 0%, rgba(34, 197, 94, 0.05) 100%)',
        backgroundDragging: 'linear-gradient(135deg, rgba(22, 163, 74, 0.15) 0%, rgba(34, 197, 94, 0.12) 100%)',
        border: '1px solid rgba(34, 197, 94, 0.15)',
        borderDragging: '2px solid rgba(34, 197, 94, 0.6)',
        hoverGlow: 'radial-gradient(600px circle at 50% 50%, rgba(34, 197, 94, 0.08), transparent 40%)',
        titleColor: 'text-white group-hover:text-green-300',
        dotColor: 'bg-green-400/30 group-hover:bg-green-400'
      }
    }
    return styles[status as keyof typeof styles] || styles.todo
  }

  const cardStyle = getCardStyle(card.status)

  // Priority badge styling (using your color palette)
  const getPriorityStyle = (priority?: Priority) => {
    if (!priority) return null
    
    const styles = {
      high: {
        bg: 'linear-gradient(135deg, rgba(239, 68, 68, 0.18) 0%, rgba(220, 38, 38, 0.28) 100%)',
        border: '1px solid rgba(239, 68, 68, 0.35)',
        color: '#fca5a5',
        text: 'High',
        shadow: '0 2px 8px rgba(239, 68, 68, 0.15)'
      },
      medium: {
        bg: 'linear-gradient(135deg, rgba(234, 179, 8, 0.18) 0%, rgba(202, 138, 4, 0.28) 100%)',
        border: '1px solid rgba(234, 179, 8, 0.35)',
        color: '#fde047',
        text: 'Med',
        shadow: '0 2px 8px rgba(234, 179, 8, 0.15)'
      },
      low: {
        bg: 'linear-gradient(135deg, rgba(34, 197, 94, 0.18) 0%, rgba(22, 163, 74, 0.28) 100%)',
        border: '1px solid rgba(34, 197, 94, 0.35)',
        color: '#86efac',
        text: 'Low',
        shadow: '0 2px 8px rgba(34, 197, 94, 0.15)'
      }
    }
    return styles[priority]
  }

  const priorityStyle = getPriorityStyle(card.priority)
  const completedSubtasks = card.subtasks?.filter(s => s.completed).length || 0
  const totalSubtasks = card.subtasks?.length || 0
  const commentsCount = card.comments?.length || 0

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`group relative rounded-xl p-4 transition-all duration-300 ${
        isDragging 
          ? 'opacity-60 scale-105 cursor-grabbing' 
          : 'hover:scale-[1.02] cursor-pointer'
      }`}
    >
      {/* Card background with gradient - Dynamic by Status */}
      <div 
        className="absolute inset-0 rounded-xl transition-all duration-300"
        style={{
          background: isDragging ? cardStyle.backgroundDragging : cardStyle.background,
          backdropFilter: 'blur(10px)',
          border: isDragging ? cardStyle.borderDragging : cardStyle.border,
          boxShadow: isDragging ? `0 20px 60px ${cardStyle.borderDragging.replace('2px solid', '').trim()}` : 'none'
        }}
      />
      
      {/* Hover glow effect - Dynamic by Status */}
      <div 
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" 
        style={{
          background: cardStyle.hoverGlow
        }} 
      />
      
      {/* Drag Handle */}
      <div {...listeners} className="cursor-grab active:cursor-grabbing -mx-4 -mt-4 px-4 pt-4 pb-2 relative">
        <div className="flex items-start justify-between gap-2">
          <h4 className={`text-sm font-bold ${cardStyle.titleColor} transition-colors duration-200 flex-1 leading-snug`}>
            {card.title}
          </h4>
          
          {/* Priority Badge or Status Dots */}
          {priorityStyle ? (
            <span
              className="px-2 py-0.5 text-[10px] font-bold rounded-full transition-all duration-200 hover:scale-110 flex-shrink-0"
              style={{
                background: priorityStyle.bg,
                border: priorityStyle.border,
                color: priorityStyle.color,
                boxShadow: priorityStyle.shadow
              }}
            >
              {priorityStyle.text}
            </span>
          ) : (
            <div className="flex gap-1 pt-0.5">
              <div className={`w-1.5 h-1.5 rounded-full ${cardStyle.dotColor} transition-all duration-200`} />
              <div className={`w-1.5 h-1.5 rounded-full ${cardStyle.dotColor} transition-all duration-200 delay-75`} />
              <div className={`w-1.5 h-1.5 rounded-full ${cardStyle.dotColor} transition-all duration-200 delay-150`} />
            </div>
          )}
        </div>
      </div>

      {/* Clickable Content */}
      <div onClick={handleClick} className="relative">
        {/* Description */}
        {card.description && (
          <p className="text-xs text-gray-400 mb-3 line-clamp-2 leading-relaxed">
            {card.description}
          </p>
        )}

        {/* Labels */}
        {card.labels && card.labels.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {card.labels.map((label, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 text-[10px] font-bold rounded-full transition-all duration-200 hover:scale-110"
                style={{
                  background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.18) 0%, rgba(139, 92, 246, 0.28) 100%)',
                  color: '#c4b5fd',
                  border: '1px solid rgba(168, 85, 247, 0.35)',
                  boxShadow: '0 2px 8px rgba(168, 85, 247, 0.1)'
                }}
              >
                {label}
              </span>
            ))}
          </div>
        )}

        {/* Meta Information */}
        <div className="flex flex-col gap-2.5 text-xs">
          {/* Assignee */}
          {card.assignee && (
            <div className="flex items-center gap-2 text-gray-400 group/item hover:text-purple-300 transition-colors duration-200">
              <div 
                className="p-1.5 rounded-lg group-hover/item:scale-110 transition-all duration-200"
                style={{ background: 'rgba(168, 85, 247, 0.12)' }}
              >
                <User size={11} />
              </div>
              <span className="font-semibold">{card.assignee}</span>
            </div>
          )}

          {/* Due Date */}
          {card.dueDate && (
            <div className="flex items-center gap-2 text-gray-400 group/item hover:text-orange-300 transition-colors duration-200">
              <div 
                className="p-1.5 rounded-lg group-hover/item:scale-110 transition-all duration-200"
                style={{ background: 'rgba(251, 146, 60, 0.12)' }}
              >
                <Calendar size={11} />
              </div>
              <span className="font-semibold">{new Date(card.dueDate).toLocaleDateString()}</span>
            </div>
          )}

          {/* Branch */}
          {card.branch && (
            <div className="flex items-center gap-2 text-emerald-400 group/item hover:text-emerald-300 transition-colors duration-200">
              <div 
                className="p-1.5 rounded-lg group-hover/item:scale-110 transition-all duration-200"
                style={{ background: 'rgba(52, 211, 153, 0.12)' }}
              >
                <GitBranch size={11} />
              </div>
              <span className="truncate font-semibold text-xs">{card.branch}</span>
            </div>
          )}

          {/* Subtasks Progress */}
          {totalSubtasks > 0 && (
            <div className="flex items-center gap-2 text-gray-400 group/item hover:text-blue-300 transition-colors duration-200">
              <div 
                className="p-1.5 rounded-lg group-hover/item:scale-110 transition-all duration-200"
                style={{ background: completedSubtasks === totalSubtasks ? 'rgba(52, 211, 153, 0.12)' : 'rgba(59, 130, 246, 0.12)' }}
              >
                <CheckSquare size={11} className={completedSubtasks === totalSubtasks ? 'text-emerald-400' : ''} />
              </div>
              <span className={`font-semibold ${completedSubtasks === totalSubtasks ? 'text-emerald-400' : ''}`}>
                {completedSubtasks}/{totalSubtasks} tasks
              </span>
            </div>
          )}

          {/* Comments Count */}
          {commentsCount > 0 && (
            <div className="flex items-center gap-2 text-gray-400 group/item hover:text-cyan-300 transition-colors duration-200">
              <div 
                className="p-1.5 rounded-lg group-hover/item:scale-110 transition-all duration-200"
                style={{ background: 'rgba(34, 211, 238, 0.12)' }}
              >
                <MessageSquare size={11} />
              </div>
              <span className="font-semibold text-cyan-400">{commentsCount} comment{commentsCount !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
