// src/components/panels/cicd/BuildHistory.tsx

import { useState } from 'react'
import { Search, Filter, Download, GitBranch, Calendar, Clock, User } from 'lucide-react'
import StatusBadge from './StatusBadge'

interface BuildRun {
  id: string
  pipelineName: string
  status: 'running' | 'success' | 'failed' | 'pending'
  branch: string
  commit: string
  author: string
  duration: string
  timestamp: string
  triggeredBy: 'push' | 'manual' | 'schedule' | 'pr'
}

export default function BuildHistory() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  // Mock data
  const buildRuns: BuildRun[] = [
    {
      id: '1',
      pipelineName: 'Main CI Pipeline',
      status: 'success',
      branch: 'main',
      commit: 'a1b2c3d',
      author: 'John Doe',
      duration: '2m 45s',
      timestamp: '2026-01-09 11:30 AM',
      triggeredBy: 'push',
    },
    {
      id: '2',
      pipelineName: 'Feature Auth Pipeline',
      status: 'running',
      branch: 'feature/auth',
      commit: 'e4f5g6h',
      author: 'Jane Smith',
      duration: '1m 20s',
      timestamp: '2026-01-09 11:25 AM',
      triggeredBy: 'pr',
    },
    {
      id: '3',
      pipelineName: 'Hotfix Pipeline',
      status: 'failed',
      branch: 'hotfix/login-bug',
      commit: 'i7j8k9l',
      author: 'Bob Johnson',
      duration: '45s',
      timestamp: '2026-01-09 11:15 AM',
      triggeredBy: 'manual',
    },
    {
      id: '4',
      pipelineName: 'Nightly Build',
      status: 'success',
      branch: 'develop',
      commit: 'm0n1o2p',
      author: 'Scheduler',
      duration: '5m 12s',
      timestamp: '2026-01-09 02:00 AM',
      triggeredBy: 'schedule',
    },
    {
      id: '5',
      pipelineName: 'PR #123 Validation',
      status: 'success',
      branch: 'feature/new-ui',
      commit: 'q3r4s5t',
      author: 'Alice Brown',
      duration: '3m 8s',
      timestamp: '2026-01-08 05:45 PM',
      triggeredBy: 'pr',
    },
  ]

  const getTriggerBadge = (trigger: BuildRun['triggeredBy']) => {
    const badges = {
      push: { label: '📤 Push', color: 'text-blue-400' },
      manual: { label: '👤 Manual', color: 'text-purple-400' },
      schedule: { label: '⏰ Schedule', color: 'text-yellow-400' },
      pr: { label: '🔀 PR', color: 'text-green-400' },
    }
    const badge = badges[trigger]
    return <span className={`text-xs font-medium ${badge.color}`}>{badge.label}</span>
  }

  return (
    <div className="p-6 space-y-6">
      {/* Filters & Search */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by branch, commit, or author..."
            className="w-full pl-11 pr-4 py-3 rounded-xl text-white text-sm focus:outline-none transition-all duration-200"
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
            onFocus={(e) => {
              e.target.style.border = '1px solid rgba(168, 85, 247, 0.6)'
              e.target.style.boxShadow = '0 0 20px rgba(168, 85, 247, 0.15)'
            }}
            onBlur={(e) => {
              e.target.style.border = '1px solid rgba(255, 255, 255, 0.1)'
              e.target.style.boxShadow = 'none'
            }}
          />
        </div>

        {/* Status Filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-3 rounded-xl text-white text-sm focus:outline-none transition-all duration-200 cursor-pointer"
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <option value="all">All Status</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
          <option value="running">Running</option>
          <option value="pending">Pending</option>
        </select>

        {/* Export Button */}
        <button
          className="px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2"
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
          <Download size={16} />
          Export
        </button>
      </div>

      {/* Build Runs List */}
      <div className="space-y-3">
        {buildRuns.map((run) => (
          <div
            key={run.id}
            className="p-4 rounded-xl transition-all duration-200 hover:scale-[1.01] cursor-pointer group"
            style={{
              background: 'linear-gradient(135deg, rgba(88, 28, 135, 0.08) 0%, rgba(139, 92, 246, 0.05) 100%)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <div className="flex items-center gap-4">
              {/* Status */}
              <StatusBadge status={run.status} size="md" />

              {/* Main Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                    {run.pipelineName}
                  </h4>
                  {getTriggerBadge(run.triggeredBy)}
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <div className="flex items-center gap-1.5">
                    <GitBranch size={12} />
                    <span className="font-medium">{run.branch}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono bg-white/5 px-2 py-0.5 rounded">
                      {run.commit}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <User size={12} />
                    <span>{run.author}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar size={12} />
                    <span>{run.timestamp}</span>
                  </div>
                </div>
              </div>

              {/* Duration */}
              <div className="text-right">
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Clock size={12} />
                  <span className="font-medium">{run.duration}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between pt-4">
        <div className="text-xs text-gray-400">
          Showing <span className="text-white font-medium">5</span> of{' '}
          <span className="text-white font-medium">127</span> builds
        </div>
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200"
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'rgba(255, 255, 255, 0.6)',
            }}
          >
            Previous
          </button>
          <button
            className="px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200"
            style={{
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(147, 51, 234, 0.3) 100%)',
              border: '1px solid rgba(168, 85, 247, 0.6)',
              color: 'rgb(168, 85, 247)',
            }}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
