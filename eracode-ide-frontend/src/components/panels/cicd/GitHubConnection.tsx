// src/components/panels/cicd/GitHubConnection.tsx

import { useState } from 'react'
import { Github, Loader2, AlertCircle } from 'lucide-react'

interface GitHubConnectionProps {
  onConnect: (owner: string, repo: string, token: string) => Promise<void>
  isVerifying: boolean
}

export default function GitHubConnection({ onConnect, isVerifying }: GitHubConnectionProps) {
  const [owner, setOwner] = useState('')
  const [repo, setRepo] = useState('')
  const [token, setToken] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // ⭐ Validate inputs
    if (!owner.trim() || !repo.trim() || !token.trim()) {
      setError('All fields are required')
      return
    }

    try {
      // ⭐ Trim whitespace from all inputs
      await onConnect(owner.trim(), repo.trim(), token.trim())
    } catch (err: any) {
      console.error('Connection error:', err)
      setError(err?.message || 'Failed to connect. Please check your credentials.')
    }
  }

  return (
    <div className="flex items-center justify-center h-full bg-dark-base p-6">
      <div 
        className="w-full max-w-md p-8 rounded-2xl"
        style={{
          background: 'linear-gradient(135deg, rgba(88, 28, 135, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div 
            className="inline-flex p-4 rounded-2xl mb-4"
            style={{
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(147, 51, 234, 0.3) 100%)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
            }}
          >
            <Github size={32} className="text-purple-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Connect to GitHub</h2>
          <p className="text-sm text-gray-400">
            Enter your repository details to start monitoring CI/CD pipelines
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div 
            className="mb-6 p-4 rounded-lg flex items-start gap-3"
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
            }}
          >
            <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Repository Owner */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">
              Repository Owner
            </label>
            <input
              type="text"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              placeholder="e.g., Mayank11104"
              disabled={isVerifying}
              className="w-full px-4 py-3 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all disabled:opacity-50"
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            />
          </div>

          {/* Repository Name */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">
              Repository Name
            </label>
            <input
              type="text"
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              placeholder="e.g., cicd-test"
              disabled={isVerifying}
              className="w-full px-4 py-3 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all disabled:opacity-50"
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            />
          </div>

          {/* Personal Access Token */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">
              Personal Access Token
            </label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              disabled={isVerifying}
              className="w-full px-4 py-3 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all disabled:opacity-50"
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            />
            <p className="text-xs text-gray-500 mt-2">
              Token needs <code className="text-purple-400">repo</code> and{' '}
              <code className="text-purple-400">workflow</code> scopes
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isVerifying}
            className="w-full py-3 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.9) 0%, rgba(147, 51, 234, 1) 100%)',
              border: '1px solid rgba(168, 85, 247, 0.5)',
              color: 'white',
              boxShadow: isVerifying ? 'none' : '0 4px 20px rgba(168, 85, 247, 0.4)',
            }}
          >
            {isVerifying ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={18} className="animate-spin" />
                Connecting...
              </span>
            ) : (
              'Connect to GitHub'
            )}
          </button>
        </form>

        {/* Help Text */}
        <div className="mt-6 pt-6 border-t border-white/10">
          <p className="text-xs text-gray-500 text-center">
            Don't have a token?{' '}
            <a
              href="https://github.com/settings/tokens/new"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 hover:text-purple-300 transition-colors"
            >
              Create one here
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
