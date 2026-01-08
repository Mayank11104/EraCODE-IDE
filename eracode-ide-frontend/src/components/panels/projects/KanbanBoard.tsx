// src/components/panels/projects/KanbanBoard.tsx

import { useState, useEffect } from 'react'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import KanbanColumn from './KanbanColumn'
import KanbanCard from './KanbanCard'
import CardDetailModal from './CardDetailModal'
import DeleteConfirmModal from './DeleteConfirmModal'
import { Card } from '../../../types/kanban.types'

interface KanbanBoardProps {
  boardId: string
}

// Initial mock data
const initialCards: Card[] = [
  {
    id: 'card-1',
    title: 'Implement Kanban Board',
    description: 'Create drag-and-drop Kanban board with columns',
    assignee: 'John Doe',
    labels: ['feature', 'high-priority'],
    status: 'in-progress',
    branch: 'feature/kanban-board',
    dueDate: '2026-01-15',
    priority: 'high',
    comments: [
      { id: 'c1', author: 'John Doe', text: 'Started working on this!', timestamp: '2026-01-08T10:00:00' }
    ],
    subtasks: [
      { id: 's1', title: 'Setup DnD library', completed: true },
      { id: 's2', title: 'Create card components', completed: true },
      { id: 's3', title: 'Add drag handlers', completed: false }
    ]
  },
  {
    id: 'card-2',
    title: 'Setup Git Integration',
    description: 'Auto-create branches when cards move to In Progress',
    assignee: 'Jane Smith',
    labels: ['feature'],
    status: 'todo',
    priority: 'medium',
    comments: [],
    subtasks: []
  },
  {
    id: 'card-3',
    title: 'Add CI/CD Pipeline',
    description: 'Setup automated testing and deployment',
    status: 'todo',
    priority: 'low',
    comments: [],
    subtasks: []
  },
  {
    id: 'card-4',
    title: 'Design System Setup',
    description: 'Create reusable component library',
    assignee: 'Alice Johnson',
    labels: ['design', 'completed'],
    status: 'done',
    branch: 'feature/design-system',
    dueDate: '2026-01-05',
    priority: 'medium',
    comments: [],
    subtasks: []
  },
]

export default function KanbanBoard({ boardId }: KanbanBoardProps) {
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)
  const [activeCard, setActiveCard] = useState<Card | null>(null)
  const [cardToDelete, setCardToDelete] = useState<Card | null>(null)
  const [showArchived, setShowArchived] = useState(false)

  // ⭐ Load cards from localStorage on mount
  const [cards, setCards] = useState<Card[]>(() => {
    const saved = localStorage.getItem(`kanban-cards-${boardId}`)
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (error) {
        console.error('Failed to parse saved cards:', error)
        return initialCards
      }
    }
    return initialCards
  })

  // ⭐ Save cards to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(`kanban-cards-${boardId}`, JSON.stringify(cards))
  }, [cards, boardId])

  const columns = [
    {
      id: 'todo',
      title: 'To Do',
      color: 'text-gray-400',
      gradient: 'linear-gradient(135deg, rgba(156, 163, 175, 0.2) 0%, rgba(107, 114, 128, 0.3) 100%)'
    },
    {
      id: 'in-progress',
      title: 'In Progress',
      color: 'text-blue-400',
      gradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.3) 100%)'
    },
    {
      id: 'review',
      title: 'Review',
      color: 'text-yellow-400',
      gradient: 'linear-gradient(135deg, rgba(234, 179, 8, 0.2) 0%, rgba(202, 138, 4, 0.3) 100%)'
    },
    {
      id: 'done',
      title: 'Done',
      color: 'text-green-400',
      gradient: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(22, 163, 74, 0.3) 100%)'
    },
  ]

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const handleCardClick = (card: Card) => {
    setSelectedCard(card)
  }

  const handleCardSave = (updatedCard: Card) => {
    setCards(cards.map(c => c.id === updatedCard.id ? updatedCard : c))
  }

  const handleCardMove = (cardId: string, newStatus: string) => {
    setCards(cards.map(card => {
      if (card.id === cardId) {
        const updatedCard = { ...card, status: newStatus }
        
        if (newStatus === 'in-progress' && !card.branch) {
          const branchName = `feature/${card.title.toLowerCase().replace(/\s+/g, '-')}`
          updatedCard.branch = branchName
          console.log('🌿 Auto-created branch:', branchName)
        }
        
        return updatedCard
      }
      return card
    }))
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const card = cards.find(c => c.id === active.id)
    setActiveCard(card || null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    if (!over) {
      setActiveCard(null)
      return
    }

    const cardId = active.id as string
    const overId = over.id as string
    const targetColumn = columns.find(col => col.id === overId)
    
    if (targetColumn) {
      handleCardMove(cardId, targetColumn.id)
    }

    setActiveCard(null)
  }

  const handleAddCard = (columnId: string) => {
    const newCard: Card = {
      id: `card-${Date.now()}`,
      title: 'New Task',
      status: columnId,
      priority: 'medium',
      subtasks: [],
      comments: [],
    }
    setCards([...cards, newCard])
    setSelectedCard(newCard)
  }

  const handleArchiveCard = (cardId: string) => {
    setCards(cards.map(card => 
      card.id === cardId 
        ? { ...card, archived: true, archivedAt: new Date().toISOString() }
        : card
    ))
    setSelectedCard(null)
  }

  const handleRestoreCard = (cardId: string) => {
    setCards(cards.map(card => 
      card.id === cardId 
        ? { ...card, archived: false, archivedAt: undefined }
        : card
    ))
  }

  const handleDeleteCard = (cardId: string) => {
    setCards(cards.filter(c => c.id !== cardId))
    setCardToDelete(null)
    setSelectedCard(null)
  }

  const visibleCards = cards.filter(card => 
    showArchived ? card.archived : !card.archived
  )

  // ⭐ Reset to default data (for testing)
  const handleResetData = () => {
    if (confirm('Reset to default cards? This will delete all your changes.')) {
      setCards(initialCards)
      localStorage.removeItem(`kanban-cards-${boardId}`)
    }
  }

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Archive Toggle */}
        <div className="px-6 py-3 border-b border-dark-border flex items-center justify-between">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
            style={{
              background: showArchived 
                ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(147, 51, 234, 0.3) 100%)'
                : 'rgba(255, 255, 255, 0.04)',
              border: showArchived 
                ? '1px solid rgba(168, 85, 247, 0.6)'
                : '1px solid rgba(255, 255, 255, 0.1)',
              color: showArchived ? 'rgb(168, 85, 247)' : 'rgba(255, 255, 255, 0.6)'
            }}
          >
            {showArchived ? '📦 Viewing Archived' : '📋 Active Cards'} ({visibleCards.length})
          </button>

          {/* Reset Button (Optional - for testing) */}
          <button
            onClick={handleResetData}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:bg-red-500/20 text-red-400"
            title="Reset to default data"
          >
            🔄 Reset
          </button>
        </div>

        {/* Board */}
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 h-full overflow-x-auto p-6">
            {columns.map(column => (
              <KanbanColumn
                key={column.id}
                column={column}
                cards={visibleCards.filter(card => card.status === column.id)}
                onCardClick={handleCardClick}
                onAddCard={() => handleAddCard(column.id)}
              />
            ))}
          </div>

          <DragOverlay>
            {activeCard ? (
              <div className="opacity-80 rotate-3 cursor-grabbing">
                <KanbanCard card={activeCard} onClick={() => {}} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {selectedCard && (
        <CardDetailModal
          card={selectedCard}
          onClose={() => setSelectedCard(null)}
          onSave={handleCardSave}
          onArchive={handleArchiveCard}
          onDelete={() => setCardToDelete(selectedCard)}
          onRestore={handleRestoreCard}
        />
      )}

      {cardToDelete && (
        <DeleteConfirmModal
          cardTitle={cardToDelete.title}
          onConfirm={() => handleDeleteCard(cardToDelete.id)}
          onCancel={() => setCardToDelete(null)}
        />
      )}
    </>
  )
}
