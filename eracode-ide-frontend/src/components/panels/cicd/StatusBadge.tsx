// src/components/panels/cicd/StatusBadge.tsx

import { CheckCircle2, XCircle, Loader2, Clock, Ban } from 'lucide-react'

interface StatusBadgeProps {
  status: 'queued' | 'in_progress' | 'completed'
  conclusion?: 'success' | 'failure' | 'cancelled' | 'skipped' | null
  size?: 'sm' | 'md' | 'lg'
}

export default function StatusBadge({ status, conclusion, size = 'md' }: StatusBadgeProps) {
  const getConfig = () => {
    if (status === 'in_progress') {
      return {
        icon: Loader2,
        label: 'Running',
        color: 'rgb(59, 130, 246)',
        bg: 'rgba(59, 130, 246, 0.15)',
        border: 'rgba(59, 130, 246, 0.4)',
        animate: true,
      }
    }
    
    if (status === 'queued') {
      return {
        icon: Clock,
        label: 'Queued',
        color: 'rgb(156, 163, 175)',
        bg: 'rgba(156, 163, 175, 0.1)',
        border: 'rgba(156, 163, 175, 0.3)',
        animate: false,
      }
    }
    
    // Completed - check conclusion
    if (conclusion === 'success') {
      return {
        icon: CheckCircle2,
        label: 'Success',
        color: 'rgb(34, 197, 94)',
        bg: 'rgba(34, 197, 94, 0.15)',
        border: 'rgba(34, 197, 94, 0.4)',
        animate: false,
      }
    }
    
    if (conclusion === 'failure') {
      return {
        icon: XCircle,
        label: 'Failed',
        color: 'rgb(239, 68, 68)',
        bg: 'rgba(239, 68, 68, 0.15)',
        border: 'rgba(239, 68, 68, 0.4)',
        animate: false,
      }
    }
    
    if (conclusion === 'cancelled') {
      return {
        icon: Ban,
        label: 'Cancelled',
        color: 'rgb(234, 179, 8)',
        bg: 'rgba(234, 179, 8, 0.15)',
        border: 'rgba(234, 179, 8, 0.4)',
        animate: false,
      }
    }
    
    // Default
    return {
      icon: Clock,
      label: 'Pending',
      color: 'rgb(156, 163, 175)',
      bg: 'rgba(156, 163, 175, 0.1)',
      border: 'rgba(156, 163, 175, 0.3)',
      animate: false,
    }
  }

  const sizes = {
    sm: { icon: 12, text: 'text-[10px]', padding: 'px-2 py-0.5' },
    md: { icon: 14, text: 'text-xs', padding: 'px-2.5 py-1' },
    lg: { icon: 16, text: 'text-sm', padding: 'px-3 py-1.5' },
  }

  const config = getConfig()
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
