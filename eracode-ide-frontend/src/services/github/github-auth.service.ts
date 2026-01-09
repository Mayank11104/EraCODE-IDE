// src/services/github/github-auth.service.ts

import { GitHubConfig } from '../../types/github.types'

const STORAGE_KEY = 'github-cicd-config'

export class GitHubAuthService {
    static saveConfig(config: GitHubConfig): void {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
    }

    static getConfig(): GitHubConfig | null {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (!stored) return null

        try {
            return JSON.parse(stored) as GitHubConfig
        } catch {
            return null
        }
    }

    static clearConfig(): void {
        localStorage.removeItem(STORAGE_KEY)
    }

    static isConfigured(): boolean {
        const config = this.getConfig()
        return !!(config?.owner && config?.repo && config?.token)
    }

    static validateToken(token: string): boolean {
        // Basic validation - GitHub tokens start with 'ghp_', 'gho_', or 'github_pat_'
        return /^(ghp_|gho_|github_pat_)[a-zA-Z0-9]{36,}$/.test(token)
    }
}
