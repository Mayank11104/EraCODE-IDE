// src/components/panels/cicd/StatusBadge.tsx

import { CheckCircle2, XCircle, Loader2, Clock, Pause } from 'lucide-react'

type Status = 'running' | 'success' | 'failed' | 'pending' | 'paused'

interface StatusBadgeProps {
  status: Status
  size?: 'sm' | 'md' | 'lg'
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const getStatusConfig = (status: Status) => {
    const configs = {
      running: {
        icon: Loader2,
        label: 'Running',
        color: 'rgb(59, 130, 246)',
        bg: 'rgba(59, 130, 246, 0.15)',
        border: 'rgba(59, 130, 246, 0.4)',
        animate: true,
      },
      success: {
        icon: CheckCircle2,
        label: 'Success',
        color: 'rgb(34, 197, 94)',
        bg: 'rgba(34, 197, 94, 0.15)',
        border: 'rgba(34, 197, 94, 0.4)',
        animate: false,
      },
      failed: {
        icon: XCircle,
        label: 'Failed',
        color: 'rgb(239, 68, 68)',
        bg: 'rgba(239, 68, 68, 0.15)',
        border: 'rgba(239, 68, 68, 0.4)',
        animate: false,
      },
      pending: {
        icon: Clock,
        label: 'Pending',
        color: 'rgb(156, 163, 175)',
        bg: 'rgba(156, 163, 175, 0.1)',
        border: 'rgba(156, 163, 175, 0.3)',
        animate: false,
      },
      paused: {
        icon: Pause,
        label: 'Paused',
        color: 'rgb(234, 179, 8)',
        bg: 'rgba(234, 179, 8, 0.15)',
        border: 'rgba(234, 179, 8, 0.4)',
        animate: false,
      },
    }
    return configs[status]
  }

  const sizes = {
    sm: { icon: 12, text: 'text-[10px]', padding: 'px-2 py-0.5' },
    md: { icon: 14, text: 'text-xs', padding: 'px-2.5 py-1' },
    lg: { icon: 16, text: 'text-sm', padding: 'px-3 py-1.5' },
  }

  const config = getStatusConfig(status)
  const sizeConfig = sizes[size]
  const Icon = config.icon

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full font-bold ${sizeConfig.padding} ${sizeConfig.text}`}
      style={{
        background: config.bg,
        border: `1px solid ${config.border}`,
        color: config.color,
      }}
    >
      <Icon size={sizeConfig.icon} className={config.animate ? 'animate-spin' : ''} />
      <span>{config.label}</span>
    </div>
  )
}
