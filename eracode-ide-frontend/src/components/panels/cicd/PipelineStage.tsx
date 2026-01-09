// src/components/panels/cicd/PipelineStage.tsx

import { CheckCircle2, XCircle, Loader2, Circle, Minus } from 'lucide-react'

interface Stage {
  id: string
  name: string
  status: 'running' | 'success' | 'failed' | 'pending' | 'skipped'
  duration?: string
}

interface PipelineStageProps {
  stage: Stage
  index: number
}

export default function PipelineStage({ stage, index }: PipelineStageProps) {
  const getStatusConfig = (status: Stage['status']) => {
    const configs = {
      running: {
        icon: Loader2,
        color: 'text-blue-400',
        bg: 'rgba(59, 130, 246, 0.15)',
        border: 'rgba(59, 130, 246, 0.4)',
        glow: '0 0 20px rgba(59, 130, 246, 0.3)',
        animate: true,
      },
      success: {
        icon: CheckCircle2,
        color: 'text-green-400',
        bg: 'rgba(34, 197, 94, 0.15)',
        border: 'rgba(34, 197, 94, 0.4)',
        glow: '0 0 20px rgba(34, 197, 94, 0.2)',
        animate: false,
      },
      failed: {
        icon: XCircle,
        color: 'text-red-400',
        bg: 'rgba(239, 68, 68, 0.15)',
        border: 'rgba(239, 68, 68, 0.4)',
        glow: '0 0 20px rgba(239, 68, 68, 0.2)',
        animate: false,
      },
      pending: {
        icon: Circle,
        color: 'text-gray-400',
        bg: 'rgba(156, 163, 175, 0.1)',
        border: 'rgba(156, 163, 175, 0.3)',
        glow: 'none',
        animate: false,
      },
      skipped: {
        icon: Minus,
        color: 'text-gray-500',
        bg: 'rgba(107, 114, 128, 0.08)',
        border: 'rgba(107, 114, 128, 0.2)',
        glow: 'none',
        animate: false,
      },
    }
    return configs[status]
  }

  const config = getStatusConfig(stage.status)
  const Icon = config.icon

  return (
    <div className="relative z-10">
      <div
        className="p-4 rounded-xl transition-all duration-300 hover:scale-105"
        style={{
          background: config.bg,
          border: `1px solid ${config.border}`,
          boxShadow: config.glow,
        }}
      >
        {/* Stage Icon */}
        <div className="flex items-center justify-center mb-3">
          <div
            className={`p-3 rounded-full ${config.color}`}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
            }}
          >
            <Icon
              size={24}
              className={config.animate ? 'animate-spin' : ''}
            />
          </div>
        </div>

        {/* Stage Info */}
        <div className="text-center">
          <h4 className="text-sm font-bold text-white mb-1">{stage.name}</h4>
          {stage.duration && (
            <p className="text-xs text-gray-400 font-medium">{stage.duration}</p>
          )}
          {!stage.duration && stage.status === 'pending' && (
            <p className="text-xs text-gray-500">Waiting...</p>
          )}
        </div>

        {/* Step Number */}
        <div
          className="absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
          style={{
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.8) 0%, rgba(147, 51, 234, 0.9) 100%)',
            border: '2px solid rgba(20, 20, 30, 1)',
            color: 'white',
          }}
        >
          {index + 1}
        </div>
      </div>
    </div>
  )
}
