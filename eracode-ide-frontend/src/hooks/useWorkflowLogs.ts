// src/hooks/useWorkflowRuns.ts

import { useState, useEffect } from 'react'
import { WorkflowRun } from '../types/github.types'
import { GitHubActionsService } from '../services/github/github-actions.service'

export function useWorkflowRuns(
    service: GitHubActionsService | null,
    autoRefresh: boolean = true,
    refreshInterval: number = 10000 // 10 seconds
) {
    const [runs, setRuns] = useState<WorkflowRun[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchRuns = async () => {
        if (!service) return

        setLoading(true)
        setError(null)
        try {
            const data = await service.getWorkflowRuns(20)
            setRuns(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch runs')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchRuns()
    }, [service])

    // Auto-refresh
    useEffect(() => {
        if (!autoRefresh || !service) return

        const interval = setInterval(fetchRuns, refreshInterval)
        return () => clearInterval(interval)
    }, [autoRefresh, service, refreshInterval])

    return {
        runs,
        loading,
        error,
        refetch: fetchRuns,
    }
}
