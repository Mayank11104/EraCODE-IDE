// src/components/panels/projects/CardDetailModal.tsx

import { useState } from 'react'
import { X, User, Tag, Calendar, GitBranch, FileText, Flag, MessageSquare, CheckSquare, Archive, Trash2, ArchiveRestore } from 'lucide-react'
import { Card, Priority, Comment, Subtask } from '../../../types/kanban.types'

interface CardDetailModalProps {
  card: Card
  onClose: () => void
  onSave: (card: Card) => void
  onArchive: (cardId: string) => void
  onDelete: () => void
  onRestore: (cardId: string) => void
}

export default function CardDetailModal({ card, onClose, onSave, onArchive, onDelete, onRestore }: CardDetailModalProps) {
  const [editedCard, setEditedCard] = useState<Card>(card)
  const [newLabel, setNewLabel] = useState('')
  const [newComment, setNewComment] = useState('')
  const [newSubtask, setNewSubtask] = useState('')

  // ⭐ Format date for input (YYYY-MM-DD)
  const formatDateForInput = (dateString?: string) => {
    if (!dateString) return ''
    try {
      const date = new Date(dateString)
      return date.toISOString().split('T')[0]
    } catch {
      return ''
    }
  }

  const handleSave = () => {
    if (!editedCard.title.trim()) {
      alert('Title is required')
      return
    }
    onSave(editedCard)
    onClose()
  }

  const handleAddLabel = () => {
    if (newLabel.trim()) {
      const labels = editedCard.labels || []
      setEditedCard({
        ...editedCard,
        labels: [...labels, newLabel.trim()]
      })
      setNewLabel('')
    }
  }

  const handleRemoveLabel = (index: number) => {
    const labels = editedCard.labels || []
    setEditedCard({
      ...editedCard,
      labels: labels.filter((_, i) => i !== index)
    })
  }

  // Comment handlers
  const handleAddComment = () => {
    if (newComment.trim()) {
      const comments = editedCard.comments || []
      const comment: Comment = {
        id: `comment-${Date.now()}`,
        author: 'Current User', // TODO: Get from auth context
        text: newComment.trim(),
        timestamp: new Date().toISOString()
      }
      setEditedCard({
        ...editedCard,
        comments: [...comments, comment]
      })
      setNewComment('')
    }
  }

  const handleDeleteComment = (commentId: string) => {
    const comments = editedCard.comments || []
    setEditedCard({
      ...editedCard,
      comments: comments.filter(c => c.id !== commentId)
    })
  }

  // Subtask handlers
  const handleAddSubtask = () => {
    if (newSubtask.trim()) {
      const subtasks = editedCard.subtasks || []
      const subtask: Subtask = {
        id: `subtask-${Date.now()}`,
        title: newSubtask.trim(),
        completed: false
      }
      setEditedCard({
        ...editedCard,
        subtasks: [...subtasks, subtask]
      })
      setNewSubtask('')
    }
  }

  const handleToggleSubtask = (subtaskId: string) => {
    const subtasks = editedCard.subtasks || []
    setEditedCard({
      ...editedCard,
      subtasks: subtasks.map(s =>
        s.id === subtaskId ? { ...s, completed: !s.completed } : s
      )
    })
  }

  const handleDeleteSubtask = (subtaskId: string) => {
    const subtasks = editedCard.subtasks || []
    setEditedCard({
      ...editedCard,
      subtasks: subtasks.filter(s => s.id !== subtaskId)
    })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  const completedSubtasks = editedCard.subtasks?.filter(s => s.completed).length || 0
  const totalSubtasks = editedCard.subtasks?.length || 0

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(8px)',
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="fixed inset-0 flex items-center justify-center z-50 p-4"
        onKeyDown={handleKeyPress}
      >
        <div
          className="w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl flex flex-col"
          style={{
            background: 'linear-gradient(135deg, rgba(20, 20, 30, 0.98) 0%, rgba(30, 30, 45, 0.98) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          {/* Header */}
          <div
            className="px-6 py-4 border-b flex items-center justify-between"
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              borderColor: 'rgba(255, 255, 255, 0.05)',
            }}
          >
            <div className="flex items-center gap-3">
              <FileText size={20} className="text-purple-400" />
              <h2 className="text-lg font-semibold text-white">Card Details</h2>
            </div>
            <div className="flex items-center gap-2">
              {/* Archive/Restore Button */}
              {editedCard.archived ? (
                <button
                  onClick={() => {
                    onRestore(editedCard.id)
                    onClose()
                  }}
                  className="p-2 rounded-lg transition-all duration-200 hover:bg-green-500/20 text-green-400"
                  title="Restore Card"
                >
                  <ArchiveRestore size={18} />
                </button>
              ) : (
                <button
                  onClick={() => {
                    onArchive(editedCard.id)
                    onClose()
                  }}
                  className="p-2 rounded-lg transition-all duration-200 hover:bg-yellow-500/20 text-yellow-400"
                  title="Archive Card"
                >
                  <Archive size={18} />
                </button>
              )}

              {/* Delete Button */}
              <button
                onClick={onDelete}
                className="p-2 rounded-lg transition-all duration-200 hover:bg-red-500/20 text-red-400"
                title="Delete Card"
              >
                <Trash2 size={18} />
              </button>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="p-2 rounded-lg transition-all duration-200 hover:bg-white/10 text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={editedCard.title}
                onChange={(e) => setEditedCard({ ...editedCard, title: e.target.value })}
                className="w-full px-4 py-3 rounded-xl text-white text-sm font-medium focus:outline-none transition-all duration-200"
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
                onFocus={(e) => {
                  e.target.style.border = '1px solid rgba(168, 85, 247, 0.6)'
                  e.target.style.boxShadow = '0 0 20px rgba(168, 85, 247, 0.15)'
                }}
                onBlur={(e) => {
                  e.target.style.border = '1px solid rgba(255, 255, 255, 0.1)'
                  e.target.style.boxShadow = 'none'
                }}
                placeholder="Enter card title..."
                autoFocus
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Description
              </label>
              <textarea
                value={editedCard.description || ''}
                onChange={(e) => setEditedCard({ ...editedCard, description: e.target.value })}
                className="w-full px-4 py-3 rounded-xl text-white text-sm resize-none focus:outline-none transition-all duration-200"
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
                onFocus={(e) => {
                  e.target.style.border = '1px solid rgba(168, 85, 247, 0.6)'
                  e.target.style.boxShadow = '0 0 20px rgba(168, 85, 247, 0.15)'
                }}
                onBlur={(e) => {
                  e.target.style.border = '1px solid rgba(255, 255, 255, 0.1)'
                  e.target.style.boxShadow = 'none'
                }}
                rows={4}
                placeholder="Add a description..."
              />
            </div>

            {/* Priority */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-400 mb-3">
                <Flag size={16} />
                Priority
              </label>
              <div className="flex gap-2">
                {[
                  { value: 'high', label: 'High', color: 'rgb(239, 68, 68)' },
                  { value: 'medium', label: 'Medium', color: 'rgb(234, 179, 8)' },
                  { value: 'low', label: 'Low', color: 'rgb(34, 197, 94)' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setEditedCard({ ...editedCard, priority: option.value as Priority })}
                    className="flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
                    style={{
                      background: editedCard.priority === option.value
                        ? `${option.color}20`
                        : 'rgba(255, 255, 255, 0.04)',
                      border: editedCard.priority === option.value
                        ? `2px solid ${option.color}`
                        : '1px solid rgba(255, 255, 255, 0.1)',
                      color: editedCard.priority === option.value ? option.color : 'rgba(255, 255, 255, 0.6)',
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Subtasks/Checklist */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-400">
                  <CheckSquare size={16} />
                  Subtasks
                </label>
                {totalSubtasks > 0 && (
                  <span className="text-xs text-gray-500">
                    {completedSubtasks}/{totalSubtasks} completed
                  </span>
                )}
              </div>

              {/* Add Subtask */}
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddSubtask()
                    }
                  }}
                  className="flex-1 px-4 py-3 rounded-xl text-white text-sm focus:outline-none transition-all duration-200"
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                  onFocus={(e) => {
                    e.target.style.border = '1px solid rgba(168, 85, 247, 0.6)'
                    e.target.style.boxShadow = '0 0 20px rgba(168, 85, 247, 0.15)'
                  }}
                  onBlur={(e) => {
                    e.target.style.border = '1px solid rgba(255, 255, 255, 0.1)'
                    e.target.style.boxShadow = 'none'
                  }}
                  placeholder="Add a subtask..."
                />
                <button
                  onClick={handleAddSubtask}
                  disabled={!newSubtask.trim()}
                  className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-50"
                  style={{
                    background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.8) 0%, rgba(147, 51, 234, 0.9) 100%)',
                    color: 'white',
                  }}
                >
                  Add
                </button>
              </div>

              {/* Subtasks List */}
              <div className="space-y-2">
                {editedCard.subtasks && editedCard.subtasks.length > 0 ? (
                  editedCard.subtasks.map((subtask) => (
                    <div
                      key={subtask.id}
                      className="flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group"
                      style={{
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={subtask.completed}
                        onChange={() => handleToggleSubtask(subtask.id)}
                        className="w-4 h-4 rounded cursor-pointer"
                        style={{
                          accentColor: 'rgb(168, 85, 247)',
                        }}
                      />
                      <span
                        className={`flex-1 text-sm ${
                          subtask.completed
                            ? 'line-through text-gray-500'
                            : 'text-white'
                        }`}
                      >
                        {subtask.title}
                      </span>
                      <button
                        onClick={() => handleDeleteSubtask(subtask.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all duration-200"
                      >
                        <X size={14} className="text-red-400" />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">No subtasks yet</p>
                )}
              </div>
            </div>

            {/* Comments Section */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-400 mb-3">
                <MessageSquare size={16} />
                Comments ({editedCard.comments?.length || 0})
              </label>

              {/* Add Comment */}
              <div className="flex gap-2 mb-4">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && e.ctrlKey) {
                      e.preventDefault()
                      handleAddComment()
                    }
                  }}
                  className="flex-1 px-4 py-3 rounded-xl text-white text-sm resize-none focus:outline-none transition-all duration-200"
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                  onFocus={(e) => {
                    e.target.style.border = '1px solid rgba(168, 85, 247, 0.6)'
                    e.target.style.boxShadow = '0 0 20px rgba(168, 85, 247, 0.15)'
                  }}
                  onBlur={(e) => {
                    e.target.style.border = '1px solid rgba(255, 255, 255, 0.1)'
                    e.target.style.boxShadow = 'none'
                  }}
                  rows={3}
                  placeholder="Add a comment... (Ctrl+Enter to post)"
                />
                <button
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-50 self-end"
                  style={{
                    background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.8) 0%, rgba(147, 51, 234, 0.9) 100%)',
                    color: 'white',
                  }}
                >
                  Post
                </button>
              </div>

              {/* Comments List */}
              <div className="space-y-3">
                {editedCard.comments && editedCard.comments.length > 0 ? (
                  editedCard.comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="p-4 rounded-xl group"
                      style={{
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className="text-sm font-medium text-white">{comment.author}</span>
                          <span className="text-xs text-gray-500 ml-2">
                            {new Date(comment.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all duration-200"
                        >
                          <X size={14} className="text-red-400" />
                        </button>
                      </div>
                      <p className="text-sm text-gray-300">{comment.text}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">No comments yet</p>
                )}
              </div>
            </div>

            {/* Assignee */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-400 mb-2">
                <User size={16} />
                Assignee
              </label>
              <input
                type="text"
                value={editedCard.assignee || ''}
                onChange={(e) => setEditedCard({ ...editedCard, assignee: e.target.value })}
                className="w-full px-4 py-3 rounded-xl text-white text-sm focus:outline-none transition-all duration-200"
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
                onFocus={(e) => {
                  e.target.style.border = '1px solid rgba(168, 85, 247, 0.6)'
                  e.target.style.boxShadow = '0 0 20px rgba(168, 85, 247, 0.15)'
                }}
                onBlur={(e) => {
                  e.target.style.border = '1px solid rgba(255, 255, 255, 0.1)'
                  e.target.style.boxShadow = 'none'
                }}
                placeholder="Assign to..."
              />
            </div>

            {/* Due Date */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-400 mb-2">
                <Calendar size={16} />
                Due Date
              </label>
              <input
                type="date"
                value={formatDateForInput(editedCard.dueDate)}
                onChange={(e) => setEditedCard({ ...editedCard, dueDate: e.target.value })}
                className="w-full px-4 py-3 rounded-xl text-white text-sm focus:outline-none transition-all duration-200 [color-scheme:dark]"
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
                onFocus={(e) => {
                  e.target.style.border = '1px solid rgba(168, 85, 247, 0.6)'
                  e.target.style.boxShadow = '0 0 20px rgba(168, 85, 247, 0.15)'
                }}
                onBlur={(e) => {
                  e.target.style.border = '1px solid rgba(255, 255, 255, 0.1)'
                  e.target.style.boxShadow = 'none'
                }}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* Branch */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-400 mb-2">
                <GitBranch size={16} />
                Git Branch
              </label>
              <input
                type="text"
                value={editedCard.branch || ''}
                onChange={(e) => setEditedCard({ ...editedCard, branch: e.target.value })}
                className="w-full px-4 py-3 rounded-xl text-white text-sm focus:outline-none transition-all duration-200"
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
                onFocus={(e) => {
                  e.target.style.border = '1px solid rgba(168, 85, 247, 0.6)'
                  e.target.style.boxShadow = '0 0 20px rgba(168, 85, 247, 0.15)'
                }}
                onBlur={(e) => {
                  e.target.style.border = '1px solid rgba(255, 255, 255, 0.1)'
                  e.target.style.boxShadow = 'none'
                }}
                placeholder="feature/branch-name"
              />
              <p className="text-xs text-gray-500 mt-2">
                Auto-created when moved to "In Progress"
              </p>
            </div>

            {/* Labels */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-400 mb-3">
                <Tag size={16} />
                Labels
              </label>

              {/* Add Label Input */}
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddLabel()
                    }
                  }}
                  className="flex-1 px-4 py-3 rounded-xl text-white text-sm focus:outline-none transition-all duration-200"
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                  onFocus={(e) => {
                    e.target.style.border = '1px solid rgba(168, 85, 247, 0.6)'
                    e.target.style.boxShadow = '0 0 20px rgba(168, 85, 247, 0.15)'
                  }}
                  onBlur={(e) => {
                    e.target.style.border = '1px solid rgba(255, 255, 255, 0.1)'
                    e.target.style.boxShadow = 'none'
                  }}
                  placeholder="Type label and press Enter..."
                />
                <button
                  onClick={handleAddLabel}
                  disabled={!newLabel.trim()}
                  className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-50"
                  style={{
                    background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.8) 0%, rgba(147, 51, 234, 0.9) 100%)',
                    color: 'white',
                  }}
                >
                  Add
                </button>
              </div>

              {/* Labels List */}
              <div className="flex flex-wrap gap-2">
                {editedCard.labels && editedCard.labels.length > 0 ? (
                  editedCard.labels.map((label, idx) => (
                    <span
                      key={idx}
                      className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200"
                      style={{
                        background: 'rgba(168, 85, 247, 0.2)',
                        border: '1px solid rgba(168, 85, 247, 0.4)',
                        color: 'rgb(168, 85, 247)',
                      }}
                    >
                      {label}
                      <button
                        onClick={() => handleRemoveLabel(idx)}
                        className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all duration-200 hover:scale-125"
                        type="button"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-gray-500">No labels yet</span>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            className="px-6 py-4 border-t flex items-center justify-end gap-3"
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              borderColor: 'rgba(255, 255, 255, 0.05)',
            }}
          >
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'rgba(255, 255, 255, 0.8)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
              style={{
                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.8) 0%, rgba(147, 51, 234, 0.9) 100%)',
                border: '1px solid rgba(168, 85, 247, 0.6)',
                color: 'white',
                boxShadow: '0 4px 15px rgba(168, 85, 247, 0.3)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)'
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(168, 85, 247, 0.4)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(168, 85, 247, 0.3)'
              }}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
