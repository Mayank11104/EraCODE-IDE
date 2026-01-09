// src/utils/github-helpers.ts

export function formatDuration(startTime: string, endTime?: string): string {
    const start = new Date(startTime).getTime()
    const end = endTime ? new Date(endTime).getTime() : Date.now()
    const diffMs = end - start

    const seconds = Math.floor(diffMs / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) {
        return `${hours}h ${minutes % 60}m`
    } else if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`
    } else {
        return `${seconds}s`
    }
}

export function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHour = Math.floor(diffMin / 60)
    const diffDay = Math.floor(diffHour / 24)

    if (diffSec < 60) return 'just now'
    if (diffMin < 60) return `${diffMin} min ago`
    if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`
    return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`
}

export function getStatusColor(status: string, conclusion?: string | null): {
    bg: string
    border: string
    text: string
    glow: string
} {
    if (status === 'in_progress') {
        return {
            bg: 'rgba(59, 130, 246, 0.15)',
            border: 'rgba(59, 130, 246, 0.4)',
            text: 'text-blue-400',
            glow: '0 0 20px rgba(59, 130, 246, 0.3)',
        }
    }

    if (status === 'queued') {
        return {
            bg: 'rgba(156, 163, 175, 0.1)',
            border: 'rgba(156, 163, 175, 0.3)',
            text: 'text-gray-400',
            glow: 'none',
        }
    }

    // Completed status - check conclusion
    if (conclusion === 'success') {
        return {
            bg: 'rgba(34, 197, 94, 0.15)',
            border: 'rgba(34, 197, 94, 0.4)',
            text: 'text-green-400',
            glow: '0 0 20px rgba(34, 197, 94, 0.2)',
        }
    }

    if (conclusion === 'failure') {
        return {
            bg: 'rgba(239, 68, 68, 0.15)',
            border: 'rgba(239, 68, 68, 0.4)',
            text: 'text-red-400',
            glow: '0 0 20px rgba(239, 68, 68, 0.2)',
        }
    }

    if (conclusion === 'cancelled') {
        return {
            bg: 'rgba(234, 179, 8, 0.15)',
            border: 'rgba(234, 179, 8, 0.4)',
            text: 'text-yellow-400',
            glow: 'none',
        }
    }

    // Default
    return {
        bg: 'rgba(156, 163, 175, 0.1)',
        border: 'rgba(156, 163, 175, 0.3)',
        text: 'text-gray-400',
        glow: 'none',
    }
}

export function getStatusIcon(status: string, conclusion?: string | null): string {
    if (status === 'in_progress') return '⏳'
    if (status === 'queued') return '⏸️'
    if (conclusion === 'success') return '✅'
    if (conclusion === 'failure') return '❌'
    if (conclusion === 'cancelled') return '🚫'
    return '⭕'
}
