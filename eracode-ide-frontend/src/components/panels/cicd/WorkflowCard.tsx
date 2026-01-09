// src/components/panels/cicd/WorkflowCard.tsx

import { Play, FileCode } from 'lucide-react'
import { Workflow } from '../../../types/github.types'

interface WorkflowCardProps {
  workflow: Workflow
  onTrigger: () => void  // ⭐ Simplified
}

export default function WorkflowCard({ workflow, onTrigger }: WorkflowCardProps) {
  return (
    <div
      className="p-4 rounded-xl transition-all duration-200 hover:scale-[1.02] cursor-pointer group"
      style={{
        background: 'linear-gradient(135deg, rgba(88, 28, 135, 0.08) 0%, rgba(139, 92, 246, 0.05) 100%)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div
            className="p-2 rounded-lg"
            style={{
              background: 'rgba(168, 85, 247, 0.2)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
            }}
          >
            <FileCode size={16} className="text-purple-400" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
              {workflow.name}
            </h4>
            <p className="text-xs text-gray-400 font-mono">{workflow.path.split('/').pop()}</p>
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation()
            onTrigger()
          }}
          disabled={workflow.state !== 'active'}
          className="px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
          style={{
            background: workflow.state === 'active'
              ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.8) 0%, rgba(147, 51, 234, 0.9) 100%)'
              : 'rgba(107, 114, 128, 0.3)',
            border: workflow.state === 'active'
              ? '1px solid rgba(168, 85, 247, 0.6)'
              : '1px solid rgba(107, 114, 128, 0.3)',
            color: 'white',
            boxShadow: workflow.state === 'active'
              ? '0 4px 15px rgba(168, 85, 247, 0.3)'
              : 'none',
          }}
        >
          <Play size={12} />
          Run
        </button>
      </div>
    </div>
  )
}
