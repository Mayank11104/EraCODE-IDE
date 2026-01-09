// src/components/panels/systemMonitor/SystemStats.tsx

import { Monitor, Cpu, Server, Clock } from 'lucide-react'
import { SystemMetrics } from '../../../hooks/useSystemMonitor'

interface SystemStatsProps {
  metrics: SystemMetrics
}

export default function SystemStats({ metrics }: SystemStatsProps) {
  const stats = [
    {
      icon: Monitor,
      label: 'Platform',
      value: metrics.system.platform.toUpperCase(),
      color: 'blue'
    },
    {
      icon: Cpu,
      label: 'CPU Cores',
      value: metrics.system.totalCPUs.toString(),
      color: 'purple'
    },
    {
      icon: Server,
      label: 'Hostname',
      value: metrics.system.hostname,
      color: 'green'
    },
    {
      icon: Clock,
      label: 'Uptime',
      value: metrics.system.uptime,
      color: 'orange'
    }
  ]

  const colorClasses = {
    blue: {
      bg: 'rgba(59, 130, 246, 0.1)',
      border: 'rgba(59, 130, 246, 0.2)',
      iconBg: 'bg-blue-500/20',
      icon: 'text-blue-400',
      text: 'text-blue-400'
    },
    purple: {
      bg: 'rgba(139, 92, 246, 0.1)',
      border: 'rgba(139, 92, 246, 0.2)',
      iconBg: 'bg-purple-500/20',
      icon: 'text-purple-400',
      text: 'text-purple-400'
    },
    green: {
      bg: 'rgba(16, 185, 129, 0.1)',
      border: 'rgba(16, 185, 129, 0.2)',
      iconBg: 'bg-green-500/20',
      icon: 'text-green-400',
      text: 'text-green-400'
    },
    orange: {
      bg: 'rgba(251, 146, 60, 0.1)',
      border: 'rgba(251, 146, 60, 0.2)',
      iconBg: 'bg-orange-500/20',
      icon: 'text-orange-400',
      text: 'text-orange-400'
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const colors = colorClasses[stat.color as keyof typeof colorClasses]
        const Icon = stat.icon
        
        return (
          <div
            key={stat.label}
            className="p-4 rounded-xl border backdrop-blur-sm hover:scale-105 transition-transform"
            style={{
              background: `linear-gradient(135deg, ${colors.bg}, transparent)`,
              borderColor: colors.border
            }}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${colors.iconBg}`}>
                <Icon size={20} className={colors.icon} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-400 mb-1">{stat.label}</div>
                <div className={`text-sm font-bold ${colors.text} truncate`}>
                  {stat.value}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
