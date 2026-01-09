// src/components/panels/CICDPanel.tsx

import { useState } from 'react'
import { useGitHubConnection } from '../../hooks/useGitHubConnection'
import { useGitHubWorkflows } from '../../hooks/useGitHubWorkflows'
import { useWorkflowRuns } from '../../hooks/useWorkflowRuns'
import { Workflow } from '../../types/github.types'
import GitHubConnection from './cicd/GitHubConnection'
import WorkflowsList from './cicd/WorkflowsList'
import RunHistory from './cicd/RunHistory'
import LivePipelineViewer from './cicd/LivePipelineViewer'
import WorkflowTriggerModal from './cicd/WorkflowTriggerModal'
import { RefreshCw, LogOut, History, FileCode, Activity } from 'lucide-react'

export default function CICDPanel() {
  // Tab state
  const [activeTab, setActiveTab] = useState<'workflows' | 'history'>('workflows')
  
  // Selected run for viewer
  const [selectedRunId, setSelectedRunId] = useState<number | null>(null)
  
  // Trigger modal state
  const [triggerModalWorkflow, setTriggerModalWorkflow] = useState<Workflow | null>(null)

  // GitHub connection
  const { config, isConnected, isVerifying, service, connect, disconnect } = useGitHubConnection()

  // Workflows
  const { workflows, loading: workflowsLoading, refetch: refetchWorkflows } = useGitHubWorkflows(service)

  // Runs history
  const { runs, loading: runsLoading, refetch: refetchRuns, activateBurstMode } = useWorkflowRuns(service, true, 5000)

  // Handle workflow trigger with modal
  const handleTriggerWithModal = async (workflowId: number, branch: string) => {
  if (!service) return
  
  try {
    await service.triggerWorkflow(workflowId, branch)
    
    // ⭐ Activate aggressive polling
    activateBurstMode()
    
  } catch (error) {
    console.error('Failed to trigger workflow:', error)
    throw error
  }
}
  // Handle disconnect
  const handleDisconnect = () => {
    disconnect()
    setSelectedRunId(null)
    setTriggerModalWorkflow(null)
  }

  // Handle refresh
  const handleRefresh = () => {
    if (activeTab === 'workflows') {
      refetchWorkflows()
    }
    refetchRuns()
  }

  // Not connected - show connection form
  if (!isConnected) {
    return <GitHubConnection onConnect={connect} isVerifying={isVerifying} />
  }

  return (
    <div className="flex flex-col h-full bg-dark-base">
      {/* Header */}
      <div className="px-6 py-4 border-b border-dark-border flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity size={20} className="text-purple-400" />
              CI/CD Pipeline
            </h2>
            <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-1">
              <span 
                className="inline-block w-2 h-2 rounded-full animate-pulse"
                style={{ 
                  background: 'rgb(34, 197, 94)',
                  boxShadow: '0 0 10px rgba(34, 197, 94, 0.5)'
                }}
              />
              Connected to{' '}
              <span className="font-medium text-purple-400">
                {config?.owner}/{config?.repo}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="p-2 rounded-lg transition-all hover:bg-white/5"
              title="Refresh"
            >
              <RefreshCw 
                size={16} 
                className={`text-gray-400 hover:text-purple-400 transition-colors ${
                  workflowsLoading || runsLoading ? 'animate-spin' : ''
                }`}
              />
            </button>
            <button
              onClick={handleDisconnect}
              className="p-2 rounded-lg transition-all hover:bg-white/5 group"
              title="Disconnect"
            >
              <LogOut size={16} className="text-gray-400 group-hover:text-red-400 transition-colors" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => {
              setActiveTab('workflows')
              setSelectedRunId(null)
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'workflows'
                ? 'text-purple-400 border border-purple-500/40'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
            style={{
              background: activeTab === 'workflows' 
                ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(147, 51, 234, 0.1) 100%)'
                : 'transparent'
            }}
          >
            <FileCode size={14} />
            Workflows {workflows.length > 0 && `(${workflows.length})`}
          </button>
          
          <button
            onClick={() => {
              setActiveTab('history')
              // Don't clear selectedRunId when switching to history
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'history'
                ? 'text-purple-400 border border-purple-500/40'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
            style={{
              background: activeTab === 'history' 
                ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(147, 51, 234, 0.1) 100%)'
                : 'transparent'
            }}
          >
            <History size={14} />
            History {runs.length > 0 && `(${runs.length})`}
          </button>
        </div>
      </div>

      {/* Content - Split into two sections */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Pipeline Viewer - Fixed at top when run is selected */}
        {selectedRunId && activeTab === 'history' && (
          <div className="flex-shrink-0 p-6 pb-0 overflow-y-auto max-h-[50vh]">
            <LivePipelineViewer
              runId={selectedRunId}
              service={service}
              onClose={() => setSelectedRunId(null)}
            />
          </div>
        )}

        {/* Main Content Area - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Workflows Tab */}
          {activeTab === 'workflows' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <WorkflowsList
                workflows={workflows}
                loading={workflowsLoading}
                service={service}
                onTriggerClick={(workflow) => setTriggerModalWorkflow(workflow)}
                onRefresh={handleRefresh}
              />
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <RunHistory
                runs={runs}
                loading={runsLoading}
                onRunClick={(runId) => {
                  console.log('🎯 Run clicked:', runId)
                  setSelectedRunId(runId)
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Workflow Trigger Modal */}
      {triggerModalWorkflow && (
        <WorkflowTriggerModal
          workflow={triggerModalWorkflow}
          onTrigger={handleTriggerWithModal}
          onClose={() => setTriggerModalWorkflow(null)}
        />
      )}
    </div>
  )
}
