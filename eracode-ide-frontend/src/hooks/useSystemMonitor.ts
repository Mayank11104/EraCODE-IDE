// src/hooks/useSystemMonitor.ts

import { useState, useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'

export interface SystemMetrics {
    timestamp: number
    cpu: {
        usage: number
        cores: number[]
    }
    memory: {
        total: number
        used: number
        free: number
        usagePercent: number
    }
    processes: Array<{
        pid: number
        name: string
        cpu: number
        mem: number
        command: string
    }>
    servers: Array<{
        port: number
        active: boolean
        process: string | null
    }>
    system: {
        uptime: string
        uptimeSeconds: number
        platform: string
        arch: string
        hostname: string
        totalCPUs: number
    }
}

export function useSystemMonitor() {
    const [metrics, setMetrics] = useState<SystemMetrics | null>(null)
    const [connected, setConnected] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const socketRef = useRef<Socket | null>(null)

    useEffect(() => {
        console.log('🔌 [System Monitor] Connecting to Socket.IO...')

        // Connect to Socket.IO namespace
        const socket = io('http://localhost:3001/system-monitor', {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5
        })

        socketRef.current = socket

        socket.on('connect', () => {
            console.log('✅ [System Monitor] Connected:', socket.id)
            setConnected(true)
            setError(null)
        })

        socket.on('metrics', (data: SystemMetrics) => {
            console.log('📊 [System Monitor] Metrics received:', {
                cpu: data.cpu.usage,
                memory: data.memory.usagePercent,
                processes: data.processes.length
            })
            setMetrics(data)
        })

        socket.on('error', (err: any) => {
            console.error('❌ [System Monitor] Error:', err)
            setError(err.message || 'Connection error')
        })

        socket.on('disconnect', () => {
            console.warn('🔌 [System Monitor] Disconnected')
            setConnected(false)
        })

        socket.on('connect_error', (err) => {
            console.error('❌ [System Monitor] Connection error:', err.message)
            setError('Failed to connect to monitoring service')
            setConnected(false)
        })

        // Cleanup on unmount
        return () => {
            console.log('🛑 [System Monitor] Disconnecting...')
            socket.disconnect()
        }
    }, [])

    const refresh = () => {
        if (socketRef.current && connected) {
            console.log('🔄 [System Monitor] Manual refresh')
            socketRef.current.emit('refresh')
        }
    }

    return {
        metrics,
        connected,
        error,
        refresh
    }
}
