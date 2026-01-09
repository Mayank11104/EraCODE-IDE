// src/components/panels/cicd/PipelineViewer.tsx

import { CheckCircle2, XCircle, Loader2, Circle, GitBranch } from 'lucide-react'
import PipelineStage from './PipelineStage'

interface Pipeline {
  id: string
  name: string
  status: 'running' | 'success' | 'failed' | 'pending'
  branch: string
  duration?: string
  progress?: number
  stages: Stage[]
}

interface Stage {
  id: string
  name: string
  status: 'running' | 'success' | 'failed' | 'pending' | 'skipped'
  duration?: string
}

interface PipelineViewerProps {
  pipeline: Pipeline
}

export default function PipelineViewer({ pipeline }: PipelineViewerProps) {
  return (
    <div
      className="p-6 rounded-2xl"
      style={{
        background: 'linear-gradient(135deg, rgba(88, 28, 135, 0.08) 0%, rgba(139, 92, 246, 0.05) 100%)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      {/* Pipeline Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-white">{pipeline.name}</h3>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <GitBranch size={12} />
              <span>{pipeline.branch}</span>
            </div>
          </div>
          <div className="text-sm text-gray-400 font-medium">{pipeline.duration}</div>
        </div>

        {/* Progress Bar */}
        {pipeline.progress !== undefined && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400 font-medium">Progress</span>
              <span className="text-purple-400 font-bold">{pipeline.progress}%</span>
            </div>
            <div
              className="h-2 rounded-full overflow-hidden"
              style={{ background: 'rgba(255, 255, 255, 0.1)' }}
            >
              <div
                className="h-full transition-all duration-500"
                style={{
                  width: `${pipeline.progress}%`,
                  background: 'linear-gradient(90deg, rgb(168, 85, 247) 0%, rgb(147, 51, 234) 100%)',
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Pipeline Stages */}
      <div className="relative">
        {/* Connection Lines */}
        <div
          className="absolute top-6 left-6 right-6 h-0.5"
          style={{ background: 'rgba(255, 255, 255, 0.1)' }}
        />

        {/* Stages Grid */}
        <div className="grid grid-cols-4 gap-4">
          {pipeline.stages.map((stage, index) => (
            <PipelineStage key={stage.id} stage={stage} index={index} />
          ))}
        </div>
      </div>
    </div>
  )
}
