// src/hooks/useGitHubConnection.ts

import { useState, useEffect } from 'react'
import { GitHubActionsService } from '../services/github/github-actions.service'

interface GitHubConfig {
    owner: string
    repo: string
    token: string
}

export function useGitHubConnection() {
    const [config, setConfig] = useState<GitHubConfig | null>(null)
    const [service, setService] = useState<GitHubActionsService | null>(null)
    const [isConnected, setIsConnected] = useState(false)
    const [isVerifying, setIsVerifying] = useState(false)

    // Load saved config from localStorage on mount
    useEffect(() => {
        console.log('🔍 Checking for saved GitHub config...')
        const saved = localStorage.getItem('github-config')

        if (saved) {
            try {
                const parsedConfig = JSON.parse(saved)
                console.log('✅ Found saved config:', {
                    owner: parsedConfig.owner,
                    repo: parsedConfig.repo,
                    hasToken: !!parsedConfig.token
                })

                // Validate config has all required fields
                if (parsedConfig.owner && parsedConfig.repo && parsedConfig.token) {
                    setConfig(parsedConfig)

                    // Create service
                    const newService = new GitHubActionsService(
                        parsedConfig.owner,
                        parsedConfig.repo,
                        parsedConfig.token
                    )
                    setService(newService)
                    setIsConnected(true)
                } else {
                    console.warn('⚠️ Saved config is incomplete, removing...')
                    localStorage.removeItem('github-config')
                }
            } catch (err) {
                console.error('❌ Failed to parse saved config:', err)
                localStorage.removeItem('github-config')
            }
        } else {
            console.log('ℹ️ No saved config found')
        }
    }, [])

    const connect = async (owner: string, repo: string, token: string) => {
        console.log('🔌 Attempting to connect:', { owner, repo, hasToken: !!token })

        setIsVerifying(true)

        try {
            // Create new service instance
            const newService = new GitHubActionsService(owner, repo, token)

            // Verify connection by fetching workflows
            console.log('🔍 Verifying connection...')
            await newService.getWorkflows()
            console.log('✅ Connection verified!')

            // Save config
            const newConfig = { owner, repo, token }
            localStorage.setItem('github-config', JSON.stringify(newConfig))
            console.log('💾 Config saved to localStorage')

            // Update state
            setConfig(newConfig)
            setService(newService)
            setIsConnected(true)

            console.log('🎉 Successfully connected!')
        } catch (error: any) {
            console.error('❌ Connection failed:', error)
            console.error('Error details:', {
                message: error?.message,
                status: error?.status,
                response: error?.response?.data
            })
            throw new Error(error?.message || 'Failed to connect to GitHub')
        } finally {
            setIsVerifying(false)
        }
    }

    const disconnect = () => {
        console.log('🔌 Disconnecting...')
        localStorage.removeItem('github-config')
        setConfig(null)
        setService(null)
        setIsConnected(false)
        console.log('✅ Disconnected')
    }

    return {
        config,
        service,
        isConnected,
        isVerifying,
        connect,
        disconnect,
    }
}
