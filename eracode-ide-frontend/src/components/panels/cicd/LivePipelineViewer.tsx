// src/components/panels/cicd/LivePipelineViewer.tsx

import { useEffect } from 'react'
import { useWorkflowRun } from '../../../hooks/useWorkflowRun'
import { GitHubActionsService } from '../../../services/github/github-actions.service'
import PipelineStage from './PipelineStage'
import StatusBadge from './StatusBadge'
import { formatDuration, formatRelativeTime } from '../../../utils/github-helpers'
import { GitBranch, Clock, Calendar, X, ExternalLink, Loader2, AlertCircle } from 'lucide-react'

interface LivePipelineViewerProps {
  runId: number
  service: GitHubActionsService | null
  onClose: () => void
}

export default function LivePipelineViewer({ runId, service, onClose }: LivePipelineViewerProps) {
  const { run, jobs, loading, error, refetch } = useWorkflowRun(service, runId, true, 5000)

  // Debug logs
  useEffect(() => {
    console.log('🎬 LivePipelineViewer mounted:', { 
      runId, 
      hasService: !!service,
      serviceType: service?.constructor?.name 
    })
  }, [runId, service])

  useEffect(() => {
    console.log('📊 LivePipelineViewer data:', { 
      hasRun: !!run, 
      jobsCount: jobs.length, 
      loading, 
      error,
      runStatus: run?.status,
      runName: run?.name
    })
  }, [run, jobs, loading, error])

  // Loading state
  if (loading && !run) {
    return (
      <div
        className="p-6 rounded-xl"
        style={{
          background: 'linear-gradient(135deg, rgba(88, 28, 135, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(168, 85, 247, 0.3)',
        }}
      >
        <div className="flex items-center justify-center h-48">
          <div className="text-center">
            <Loader2 size={40} className="text-purple-400 animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-400">Loading pipeline details...</p>
            <p className="text-xs text-gray-500 mt-1">Run ID: {runId}</p>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !run) {
    return (
      <div
        className="p-6 rounded-xl"
        style={{
          background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.15) 0%, rgba(239, 68, 68, 0.1) 100%)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <AlertCircle size={24} className="text-red-400" />
            <h3 className="text-base font-bold text-white">Failed to load pipeline details</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={18} className="text-gray-400 hover:text-white" />
          </button>
        </div>

        <div className="bg-black/30 rounded-lg p-4 mb-4">
          <p className="text-sm text-red-300 font-mono mb-2">
            {error || 'Unable to fetch run data'}
          </p>
          <div className="text-xs text-gray-400 space-y-1 mt-3">
            <p>Run ID: <span className="text-purple-400">{runId}</span></p>
            <p>Service: <span className="text-purple-400">{service ? '✅ Connected' : '❌ Not connected'}</span></p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => {
              console.log('🔄 Manual retry...')
              refetch()
            }}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:bg-purple-500/20"
            style={{
              border: '1px solid rgba(168, 85, 247, 0.4)',
              color: '#a855f7'
            }}
          >
            Retry
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:bg-white/10"
            style={{
              border: '1px solid rgba(107, 114, 128, 0.4)',
              color: '#9ca3af'
            }}
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  // Calculate progress
  const completedJobs = jobs.filter(j => j.status === 'completed').length
  const totalJobs = jobs.length
  const progress = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0
  const totalDuration = run.run_started_at
    ? formatDuration(run.run_started_at, run.updated_at)
    : '-'

  return (
    <div
      className="p-6 rounded-xl relative"
      style={{
        background: 'linear-gradient(135deg, rgba(88, 28, 135, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(168, 85, 247, 0.3)',
        boxShadow: '0 8px 32px rgba(168, 85, 247, 0.2)',
      }}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 transition-all"
        title="Close"
      >
        <X size={18} className="text-gray-400 hover:text-white" />
      </button>

      {/* Header */}
      <div className="mb-6 pr-12">
        <div className="flex items-center gap-3 mb-3">
          <StatusBadge status={run.status} conclusion={run.conclusion} size="lg" />
          <h2 className="text-lg font-bold text-white">{run.name}</h2>
        </div>

        <div className="flex items-center gap-4 text-xs text-gray-400 flex-wrap">
          <div className="flex items-center gap-1.5">
            <GitBranch size={14} />
            <span className="font-medium text-purple-300">{run.head_branch}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={14} />
            <span>{totalDuration}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar size={14} />
            <span>{formatRelativeTime(run.created_at)}</span>
          </div>
          <a
            href={run.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-purple-400 transition-colors"
          >
            <span>View on GitHub</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-gray-400 font-medium">Progress</span>
          <span className="text-purple-400 font-bold">{Math.round(progress)}%</span>
        </div>
        <div
          className="h-2 rounded-full overflow-hidden"
          style={{ background: 'rgba(0, 0, 0, 0.3)' }}
        >
          <div
            className="h-full transition-all duration-500 rounded-full"
            style={{
              width: `${progress}%`,
              background: run.status === 'completed' && run.conclusion === 'success'
                ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
                : run.status === 'completed' && run.conclusion === 'failure'
                ? 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)'
                : 'linear-gradient(90deg, #a855f7 0%, #9333ea 100%)',
              boxShadow: '0 0 10px rgba(168, 85, 247, 0.5)',
            }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-2">
          {completedJobs} / {totalJobs} jobs completed
        </p>
      </div>

      {/* Pipeline Stages */}
      {jobs.length > 0 ? (
        <>
          <div className="flex items-center gap-4 mb-6 overflow-x-auto pb-2">
            {jobs.map((job, index) => (
              <div key={job.id} className="flex items-center gap-4 flex-shrink-0">
                <PipelineStage job={job} />
                {index < jobs.length - 1 && (
                  <div 
                    className="w-8 h-0.5 flex-shrink-0"
                    style={{
                      background: completedJobs > index 
                        ? 'rgba(168, 85, 247, 0.6)' 
                        : 'rgba(255, 255, 255, 0.1)'
                    }}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Job Details */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              Job Details
            </h3>
            {jobs.map((job) => (
              <div
                key={job.id}
                className="p-3 rounded-lg transition-all hover:bg-white/5"
                style={{
                  background: 'rgba(0, 0, 0, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <StatusBadge status={job.status} conclusion={job.conclusion} size="sm" />
                    <span className="text-sm text-white font-medium">{job.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span>{job.steps?.length || 0} steps</span>
                    {job.started_at && job.completed_at && (
                      <span className="text-gray-500">
                        {formatDuration(job.started_at, job.completed_at)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <Loader2 size={32} className="text-purple-400 animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400">Waiting for jobs to start...</p>
        </div>
      )}

      {/* Auto-refresh indicator */}
      {run.status !== 'completed' && (
        <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-center gap-2 text-xs text-gray-500">
          <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse" />
          <span>Auto-refreshing every 5 seconds</span>
        </div>
      )}
    </div>
  )
}
