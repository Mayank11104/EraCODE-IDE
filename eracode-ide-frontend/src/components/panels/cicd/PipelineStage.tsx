// src/components/panels/cicd/PipelineStage.tsx

import { CheckCircle2, XCircle, Loader2, Clock } from 'lucide-react'
import { Job } from '../../../types/github.types'
import { formatDuration } from '../../../utils/github-helpers'

interface PipelineStageProps {
  job: Job
  isLast?: boolean
}

export default function PipelineStage({ job, isLast = false }: PipelineStageProps) {
  const getStatusConfig = () => {
    if (job.status === 'in_progress') {
      return {
        icon: Loader2,
        color: 'rgb(59, 130, 246)',
        bg: 'rgba(59, 130, 246, 0.15)',
        border: 'rgba(59, 130, 246, 0.4)',
        glow: '0 0 20px rgba(59, 130, 246, 0.3)',
        animate: true,
      }
    }
    
    if (job.status === 'queued') {
      return {
        icon: Clock,
        color: 'rgb(156, 163, 175)',
        bg: 'rgba(156, 163, 175, 0.1)',
        border: 'rgba(156, 163, 175, 0.3)',
        glow: 'none',
        animate: false,
      }
    }
    
    if (job.conclusion === 'success') {
      return {
        icon: CheckCircle2,
        color: 'rgb(34, 197, 94)',
        bg: 'rgba(34, 197, 94, 0.15)',
        border: 'rgba(34, 197, 94, 0.4)',
        glow: '0 0 20px rgba(34, 197, 94, 0.2)',
        animate: false,
      }
    }
    
    if (job.conclusion === 'failure') {
      return {
        icon: XCircle,
        color: 'rgb(239, 68, 68)',
        bg: 'rgba(239, 68, 68, 0.15)',
        border: 'rgba(239, 68, 68, 0.4)',
        glow: '0 0 20px rgba(239, 68, 68, 0.2)',
        animate: false,
      }
    }
    
    return {
      icon: Clock,
      color: 'rgb(156, 163, 175)',
      bg: 'rgba(156, 163, 175, 0.1)',
      border: 'rgba(156, 163, 175, 0.3)',
      glow: 'none',
      animate: false,
    }
  }

  const config = getStatusConfig()
  const Icon = config.icon
  const duration = job.started_at && job.completed_at
    ? formatDuration(job.started_at, job.completed_at)
    : job.started_at
    ? formatDuration(job.started_at)
    : null

  return (
    <div className="flex items-center gap-3">
      {/* Stage Box */}
      <div className="flex flex-col items-center">
        <div
          className="relative p-4 rounded-xl transition-all duration-300"
          style={{
            background: config.bg,
            border: `1px solid ${config.border}`,
            boxShadow: config.glow,
          }}
        >
          <Icon
            size={24}
            className={config.animate ? 'animate-spin' : ''}
            style={{ color: config.color }}
          />
        </div>
        
        <div className="mt-2 text-center">
          <div
            className="text-xs font-bold"
            style={{ color: config.color }}
          >
            {job.name}
          </div>
          {duration && (
            <div className="text-[10px] text-gray-500 mt-0.5">
              {duration}
            </div>
          )}
        </div>
      </div>

      {/* Connector Line */}
      {!isLast && (
        <div
          className="w-12 h-0.5"
          style={{
            background: job.status === 'completed'
              ? `linear-gradient(90deg, ${config.color} 0%, rgba(156, 163, 175, 0.3) 100%)`
              : 'rgba(156, 163, 175, 0.3)',
          }}
        />
      )}
    </div>
  )
}
