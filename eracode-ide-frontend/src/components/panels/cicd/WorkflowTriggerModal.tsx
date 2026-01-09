// src/components/panels/cicd/WorkflowTriggerModal.tsx

import { useState } from 'react'
import { Workflow } from '../../../types/github.types'
import { X, Play, GitBranch, AlertCircle } from 'lucide-react'

interface WorkflowTriggerModalProps {
  workflow: Workflow
  onTrigger: (workflowId: number, branch: string) => Promise<void>
  onClose: () => void
}

export default function WorkflowTriggerModal({ workflow, onTrigger, onClose }: WorkflowTriggerModalProps) {
  const [branch, setBranch] = useState('main')
  const [triggering, setTriggering] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleTrigger = async () => {
    if (!branch.trim()) {
      setError('Branch name is required')
      return
    }

    setTriggering(true)
    setError(null)

    try {
      await onTrigger(workflow.id, branch)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to trigger workflow')
    } finally {
      setTriggering(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0, 0, 0, 0.7)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6 relative"
        style={{
          background: 'linear-gradient(135deg, rgba(88, 28, 135, 0.95) 0%, rgba(139, 92, 246, 0.9) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 transition-all"
        >
          <X size={18} className="text-white" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="p-2 rounded-lg"
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
              }}
            >
              <Play size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Trigger Workflow</h2>
              <p className="text-sm text-purple-200">{workflow.name}</p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div
            className="mb-4 p-3 rounded-xl flex items-center gap-2"
            style={{
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
            }}
          >
            <AlertCircle size={16} className="text-red-300" />
            <span className="text-xs text-red-200">{error}</span>
          </div>
        )}

        {/* Branch Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-white mb-2 flex items-center gap-2">
            <GitBranch size={14} />
            Branch Name
          </label>
          <input
            type="text"
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            placeholder="main"
            className="w-full px-4 py-3 rounded-xl text-white text-sm focus:outline-none transition-all duration-200"
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
            onFocus={(e) => {
              e.target.style.border = '1px solid rgba(255, 255, 255, 0.4)'
              e.target.style.boxShadow = '0 0 20px rgba(255, 255, 255, 0.1)'
            }}
            onBlur={(e) => {
              e.target.style.border = '1px solid rgba(255, 255, 255, 0.2)'
              e.target.style.boxShadow = 'none'
            }}
            disabled={triggering}
          />
          <p className="text-xs text-purple-200 mt-2">
            The workflow will run on the specified branch
          </p>
        </div>

        {/* Workflow Info */}
        <div
          className="mb-6 p-3 rounded-xl"
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
          }}
        >
          <div className="text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-purple-200">Workflow File:</span>
              <span className="font-mono text-white">{workflow.path.split('/').pop()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-purple-200">Status:</span>
              <span className={`font-medium ${workflow.state === 'active' ? 'text-green-300' : 'text-gray-300'}`}>
                {workflow.state}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={triggering}
            className="flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: 'white',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleTrigger}
            disabled={triggering || workflow.state !== 'active'}
            className="flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.85) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: '#7c3aed',
              boxShadow: '0 4px 15px rgba(255, 255, 255, 0.2)',
            }}
          >
            {triggering ? (
              <>
                <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                <span>Triggering...</span>
              </>
            ) : (
              <>
                <Play size={14} />
                <span>Run Workflow</span>
              </>
            )}
          </button>
        </div>

        {/* Note */}
        <p className="text-xs text-purple-200 text-center mt-4">
          The workflow will start in a few seconds after triggering
        </p>
      </div>
    </div>
  )
}
