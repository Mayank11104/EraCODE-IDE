// src/components/panels/cicd/LogsViewer.tsx

import { useState, useEffect, useRef } from 'react'
import { GitHubActionsService } from '../../../services/github/github-actions.service'
import { Job } from '../../../types/github.types'
import { Terminal, Download, Copy, Check, Loader2 } from 'lucide-react'

interface LogsViewerProps {
  job: Job
  service: GitHubActionsService | null
}

export default function LogsViewer({ job, service }: LogsViewerProps) {
  const [logs, setLogs] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const logsEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchLogs()
  }, [job.id])

  const fetchLogs = async () => {
    if (!service) return

    setLoading(true)
    try {
      const logsData = await service.getJobLogs(job.id)
      setLogs(logsData || 'No logs available')
    } catch (error) {
      setLogs('Failed to fetch logs')
    } finally {
      setLoading(false)
    }
  }

  // Auto-scroll to bottom
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(logs)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([logs], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${job.name.replace(/\s+/g, '-')}-logs.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.95) 0%, rgba(31, 41, 55, 0.9) 100%)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center justify-between border-b"
        style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
      >
        <div className="flex items-center gap-2">
          <Terminal size={16} className="text-green-400" />
          <span className="text-sm font-bold text-white">{job.name} - Logs</span>
          {loading && <Loader2 size={14} className="text-purple-400 animate-spin" />}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="p-2 rounded-lg hover:bg-white/10 transition-all"
            title="Copy logs"
          >
            {copied ? (
              <Check size={14} className="text-green-400" />
            ) : (
              <Copy size={14} className="text-gray-400 hover:text-white" />
            )}
          </button>
          <button
            onClick={handleDownload}
            className="p-2 rounded-lg hover:bg-white/10 transition-all"
            title="Download logs"
          >
            <Download size={14} className="text-gray-400 hover:text-white" />
          </button>
        </div>
      </div>

      {/* Logs Content */}
      <div
        className="p-4 overflow-auto font-mono text-xs"
        style={{
          maxHeight: '400px',
          background: 'rgba(0, 0, 0, 0.3)',
        }}
      >
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 size={24} className="text-purple-400 animate-spin" />
          </div>
        ) : (
          <pre className="whitespace-pre-wrap break-words text-gray-300">
            {logs.split('\n').map((line, index) => (
              <div
                key={index}
                className="hover:bg-white/5 px-2 py-0.5 rounded transition-colors"
              >
                <span className="text-gray-600 select-none mr-4">{index + 1}</span>
                <span
                  className={
                    line.includes('error') || line.includes('ERROR')
                      ? 'text-red-400'
                      : line.includes('warning') || line.includes('WARN')
                      ? 'text-yellow-400'
                      : line.includes('success') || line.includes('✓')
                      ? 'text-green-400'
                      : 'text-gray-300'
                  }
                >
                  {line}
                </span>
              </div>
            ))}
            <div ref={logsEndRef} />
          </pre>
        )}
      </div>
    </div>
  )
}
