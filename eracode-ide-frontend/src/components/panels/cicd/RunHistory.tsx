// src/components/panels/cicd/RunHistory.tsx

import { WorkflowRun } from '../../../types/github.types'
import RunCard from './RunCard'
import { Loader2, History } from 'lucide-react'

interface RunHistoryProps {
  runs: WorkflowRun[]
  loading: boolean
  onRunClick?: (runId: number) => void
}

export default function RunHistory({ runs, loading, onRunClick }: RunHistoryProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="text-purple-400 animate-spin" />
      </div>
    )
  }

  if (runs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <History size={48} className="text-gray-600 mb-4" />
        <h3 className="text-sm font-bold text-white mb-2">No Pipeline Runs Yet</h3>
        <p className="text-xs text-gray-400">
          Run a workflow to see its execution history here
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {runs.map((run) => (
        <RunCard
          key={run.id}
          run={run}
          onClick={() => onRunClick?.(run.id)}
        />
      ))}
    </div>
  )
}
