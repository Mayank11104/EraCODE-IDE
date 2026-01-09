// src/hooks/useWorkflowRuns.ts

import { useState, useEffect, useRef } from 'react'
import { WorkflowRun } from '../types/github.types'
import { GitHubActionsService } from '../services/github/github-actions.service'

export function useWorkflowRuns(
    service: GitHubActionsService | null,
    autoRefresh: boolean = true,
    refreshInterval: number = 5000 // Normal: 5 seconds
) {
    const [runs, setRuns] = useState<WorkflowRun[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [burstMode, setBurstMode] = useState(false) // ⭐ Aggressive polling after trigger
    const lastFetchTime = useRef<number>(0)
    const burstTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    const fetchRuns = async (showLoading = true) => {
        if (!service) return

        // Prevent multiple simultaneous fetches
        const now = Date.now()
        if (now - lastFetchTime.current < 500) {
            console.log('⏭️ Skipping fetch - too soon')
            return
        }
        lastFetchTime.current = now

        if (showLoading) setLoading(true)
        setError(null)

        try {
            const data = await service.getWorkflowRuns(20)
            console.log(`✅ [${new Date().toLocaleTimeString()}] Runs fetched: ${data.length}`)

            // Check for in-progress runs
            const inProgressRuns = data.filter(r => r.status !== 'completed')
            if (inProgressRuns.length > 0) {
                console.log('⏳ In-progress:', inProgressRuns.map(r => `${r.name} (${r.status})`).join(', '))
            }

            setRuns(data)
        } catch (err) {
            console.error('❌ Failed to fetch runs:', err)
            setError(err instanceof Error ? err.message : 'Failed to fetch runs')
        } finally {
            if (showLoading) setLoading(false)
        }
    }

    // ⭐ Activate burst mode for 30 seconds
    const activateBurstMode = () => {
        console.log('🚀 BURST MODE ACTIVATED - Polling every 1 second for 30s')
        setBurstMode(true)

        // Clear any existing burst timeout
        if (burstTimeoutRef.current) {
            clearTimeout(burstTimeoutRef.current)
        }

        // Deactivate after 30 seconds
        burstTimeoutRef.current = setTimeout(() => {
            console.log('🔄 Returning to normal polling (5s)')
            setBurstMode(false)
        }, 30000) // 30 seconds

        // Immediate fetch
        fetchRuns(false)
    }

    // Initial fetch
    useEffect(() => {
        if (service) {
            console.log('🎬 Initial workflow runs fetch')
            fetchRuns()
        }
    }, [service])

    // Auto-refresh with burst mode support
    useEffect(() => {
        if (!autoRefresh || !service) return

        const interval = burstMode ? 1000 : refreshInterval // ⭐ 1s in burst, 5s normal

        const timer = setInterval(() => {
            fetchRuns(false)
        }, interval)

        console.log(`🔄 Polling: every ${interval}ms ${burstMode ? '(BURST MODE)' : ''}`)

        return () => clearInterval(timer)
    }, [autoRefresh, service, refreshInterval, burstMode])

    // Refresh when tab becomes visible
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && service) {
                console.log('👁️ Tab visible - refreshing')
                fetchRuns(false)
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
    }, [service])

    // Cleanup burst timeout on unmount
    useEffect(() => {
        return () => {
            if (burstTimeoutRef.current) {
                clearTimeout(burstTimeoutRef.current)
            }
        }
    }, [])

    return {
        runs,
        loading,
        error,
        refetch: () => fetchRuns(true),
        activateBurstMode, // ⭐ Export this to call when triggering workflows
    }
}
