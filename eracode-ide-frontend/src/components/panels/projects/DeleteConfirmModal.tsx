// src/components/panels/projects/DeleteConfirmModal.tsx

import { AlertTriangle, X } from 'lucide-react'

interface DeleteConfirmModalProps {
  cardTitle: string
  onConfirm: () => void
  onCancel: () => void
}

export default function DeleteConfirmModal({ cardTitle, onConfirm, onCancel }: DeleteConfirmModalProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60]"
        style={{
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(8px)',
        }}
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-[70] p-4">
        <div
          className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(20, 20, 30, 0.95) 0%, rgba(30, 30, 45, 0.95) 100%)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            boxShadow: '0 20px 60px rgba(239, 68, 68, 0.3)',
          }}
        >
          {/* Header */}
          <div
            className="px-6 py-4 border-b flex items-center justify-between"
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              borderColor: 'rgba(239, 68, 68, 0.2)',
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="p-2 rounded-xl"
                style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                }}
              >
                <AlertTriangle size={20} className="text-red-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">Delete Card</h2>
            </div>
            <button
              onClick={onCancel}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-all duration-200 text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-6 space-y-4">
            <p className="text-sm text-gray-300">
              Are you sure you want to permanently delete this card?
            </p>
            <div
              className="p-4 rounded-xl"
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <p className="text-sm font-medium text-white">"{cardTitle}"</p>
            </div>
            <p className="text-xs text-red-400 flex items-start gap-2">
              <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
              <span>This action cannot be undone. All data including comments, subtasks, and attachments will be permanently deleted.</span>
            </p>
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
              onClick={onCancel}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
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
              onClick={onConfirm}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
              style={{
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.8) 0%, rgba(220, 38, 38, 0.9) 100%)',
                border: '1px solid rgba(239, 68, 68, 0.6)',
                color: 'white',
                boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)'
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(239, 68, 68, 0.4)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(239, 68, 68, 0.3)'
              }}
            >
              Delete Permanently
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
