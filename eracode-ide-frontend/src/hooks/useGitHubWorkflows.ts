// src/hooks/useGitHubWorkflows.ts

import { useState, useEffect } from 'react'
import { Workflow } from '../types/github.types'
import { GitHubActionsService } from '../services/github/github-actions.service'

export function useGitHubWorkflows(service: GitHubActionsService | null) {
    const [workflows, setWorkflows] = useState<Workflow[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchWorkflows = async () => {
        if (!service) return

        setLoading(true)
        setError(null)
        try {
            const data = await service.listWorkflows()
            setWorkflows(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch workflows')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchWorkflows()
    }, [service])

    return {
        workflows,
        loading,
        error,
        refetch: fetchWorkflows,
    }
}
