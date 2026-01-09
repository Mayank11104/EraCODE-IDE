// src/hooks/useWorkflowRun.ts

import { useState, useEffect } from 'react'
import { WorkflowRun, Job } from '../types/github.types'
import { GitHubActionsService } from '../services/github/github-actions.service'

export function useWorkflowRun(
    service: GitHubActionsService | null,
    runId: number | null,
    autoRefresh: boolean = true,
    refreshInterval: number = 5000 // 5 seconds
) {
    const [run, setRun] = useState<WorkflowRun | null>(null)
    const [jobs, setJobs] = useState<Job[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchRunDetails = async () => {
        if (!service || !runId) return

        setLoading(true)
        setError(null)
        try {
            // Fetch run details
            const runData = await service.getWorkflowRun(runId)
            setRun(runData)

            // Fetch jobs for this run
            const jobsData = await service.getWorkflowJobs(runId)
            setJobs(jobsData)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch run details')
        } finally {
            setLoading(false)
        }
    }

    // Initial fetch
    useEffect(() => {
        if (runId) {
            fetchRunDetails()
        }
    }, [service, runId])

    // Auto-refresh (only if run is still in progress)
    useEffect(() => {
        if (!autoRefresh || !service || !runId || !run) return

        // Only auto-refresh if run is in progress
        if (run.status === 'completed') return

        const interval = setInterval(fetchRunDetails, refreshInterval)
        return () => clearInterval(interval)
    }, [autoRefresh, service, runId, run?.status, refreshInterval])

    return {
        run,
        jobs,
        loading,
        error,
        refetch: fetchRunDetails,
    }
}
