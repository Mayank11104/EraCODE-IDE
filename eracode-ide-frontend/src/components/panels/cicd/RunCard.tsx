// src/components/panels/cicd/RunCard.tsx

import { GitBranch, Clock, ExternalLink } from 'lucide-react'
import { WorkflowRun } from '../../../types/github.types'
import StatusBadge from './StatusBadge'
import { formatDuration, formatRelativeTime } from '../../../utils/github-helpers'

interface RunCardProps {
  run: WorkflowRun
  onClick?: () => void
}

export default function RunCard({ run, onClick }: RunCardProps) {
  const duration = run.run_started_at
    ? formatDuration(run.run_started_at, run.updated_at)
    : '-'

  return (
    <div
      onClick={onClick}
      className="p-4 rounded-xl transition-all duration-200 hover:scale-[1.01] cursor-pointer group"
      style={{
        background: 'linear-gradient(135deg, rgba(88, 28, 135, 0.08) 0%, rgba(139, 92, 246, 0.05) 100%)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <StatusBadge status={run.status} conclusion={run.conclusion} />
          
          <div className="flex-1">
            <div className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
              {run.name}
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
              <div className="flex items-center gap-1.5">
                <GitBranch size={12} />
                <span className="font-medium">{run.head_branch}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock size={12} />
                <span>{duration}</span>
              </div>
              <span>{formatRelativeTime(run.created_at)}</span>
            </div>
          </div>
        </div>

        <a
          href={run.html_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="p-2 hover:bg-white/10 rounded-lg transition-all"
        >
          <ExternalLink size={14} className="text-gray-400 hover:text-purple-400" />
        </a>
      </div>
    </div>
  )
}
