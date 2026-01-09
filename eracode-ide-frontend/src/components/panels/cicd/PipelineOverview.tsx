// src/components/panels/cicd/PipelineOverview.tsx

import { Play, Pause, CheckCircle2, XCircle, Clock, TrendingUp } from 'lucide-react'
import PipelineViewer from './PipelineViewer'
import StatusBadge from './StatusBadge'

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

export default function PipelineOverview() {
  // Mock data
  const activePipeline: Pipeline = {
    id: '1',
    name: 'Main CI Pipeline',
    status: 'running',
    branch: 'main',
    duration: '2m 34s',
    progress: 65,
    stages: [
      { id: 's1', name: 'Build', status: 'success', duration: '45s' },
      { id: 's2', name: 'Test', status: 'running', duration: '1m 15s' },
      { id: 's3', name: 'Security Scan', status: 'pending' },
      { id: 's4', name: 'Deploy', status: 'pending' },
    ],
  }

  const recentRuns = [
    { id: '2', name: 'Feature Branch', status: 'success', branch: 'feature/auth', duration: '3m 12s', time: '5 min ago' },
    { id: '3', name: 'Hotfix', status: 'failed', branch: 'hotfix/login', duration: '1m 45s', time: '15 min ago' },
    { id: '4', name: 'Main CI', status: 'success', branch: 'main', duration: '2m 58s', time: '1 hour ago' },
  ]

  const stats = [
    { label: 'Success Rate', value: '94%', icon: TrendingUp, color: 'text-green-400' },
    { label: 'Avg Duration', value: '2m 45s', icon: Clock, color: 'text-blue-400' },
    { label: 'Total Runs', value: '1,234', icon: Play, color: 'text-purple-400' },
    { label: 'Failed Today', value: '3', icon: XCircle, color: 'text-red-400' },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="p-4 rounded-xl transition-all duration-200 hover:scale-[1.02]"
              style={{
                background: 'linear-gradient(135deg, rgba(88, 28, 135, 0.08) 0%, rgba(139, 92, 246, 0.05) 100%)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400 font-medium">{stat.label}</span>
                <Icon size={16} className={stat.color} />
              </div>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
            </div>
          )
        })}
      </div>

      {/* Active Pipeline */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Play size={16} className="text-purple-400" />
            Active Pipeline
          </h3>
        </div>
        <PipelineViewer pipeline={activePipeline} />
      </div>

      {/* Recent Runs */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Clock size={16} className="text-blue-400" />
          Recent Runs
        </h3>
        <div className="space-y-2">
          {recentRuns.map((run) => (
            <div
              key={run.id}
              className="p-4 rounded-xl transition-all duration-200 hover:scale-[1.01] cursor-pointer group"
              style={{
                background: 'linear-gradient(135deg, rgba(88, 28, 135, 0.08) 0%, rgba(139, 92, 246, 0.05) 100%)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <StatusBadge status={run.status} />
                  <div>
                    <div className="text-sm font-medium text-white group-hover:text-purple-300 transition-colors">
                      {run.name}
                    </div>
                    <div className="text-xs text-gray-400 flex items-center gap-2">
                      <span>{run.branch}</span>
                      <span>•</span>
                      <span>{run.time}</span>
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-500 font-medium">{run.duration}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
