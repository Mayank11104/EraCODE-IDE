// src/components/panels/cicd/WorkflowsList.tsx

import { useState } from 'react'
import { Workflow } from '../../../types/github.types'
import { GitHubActionsService } from '../../../services/github/github-actions.service'
import WorkflowCard from './WorkflowCard'
import { Loader2, FileCode } from 'lucide-react'

interface WorkflowsListProps {
  workflows: Workflow[]
  loading: boolean
  service: GitHubActionsService | null
  onTriggerClick: (workflow: Workflow) => void  // ⭐ Changed from onRefresh
  onRefresh: () => void  // ⭐ Added separate onRefresh
}

export default function WorkflowsList({ 
  workflows, 
  loading, 
  service, 
  onTriggerClick,  // ⭐ New prop
  onRefresh 
}: WorkflowsListProps) {

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="text-purple-400 animate-spin" />
      </div>
    )
  }

  if (workflows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <FileCode size={48} className="text-gray-600 mb-4" />
        <h3 className="text-sm font-bold text-white mb-2">No Workflows Found</h3>
        <p className="text-xs text-gray-400 max-w-xs">
          This repository doesn't have any GitHub Actions workflows yet.
          <br />
          Add a workflow file to <code className="text-purple-400">.github/workflows/</code>
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {workflows.map((workflow) => (
        <WorkflowCard
          key={workflow.id}
          workflow={workflow}
          onTrigger={() => onTriggerClick(workflow)}  // ⭐ Changed
        />
      ))}
    </div>
  )
}
