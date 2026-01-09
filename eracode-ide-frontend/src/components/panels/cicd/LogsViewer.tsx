// src/components/panels/cicd/LogsViewer.tsx

import { useState, useEffect, useRef } from 'react'
import { Terminal, Download, Search, X } from 'lucide-react'

interface LogsViewerProps {
  pipelineId: string
  isLive?: boolean
}

export default function LogsViewer({ pipelineId, isLive = true }: LogsViewerProps) {
  const [logs, setLogs] = useState<string[]>([
    '[2026-01-09 11:30:00] 🚀 Pipeline started',
    '[2026-01-09 11:30:01] 📦 Installing dependencies...',
    '[2026-01-09 11:30:15] ✓ npm install completed',
    '[2026-01-09 11:30:16] 🔨 Building project...',
    '[2026-01-09 11:30:45] ✓ Build successful',
    '[2026-01-09 11:30:46] 🧪 Running tests...',
  ])
  const [filter, setFilter] = useState('')
  const logsEndRef = useRef<HTMLDivElement>(null)

  // Simulate live logs
  useEffect(() => {
    if (!isLive) return

    const interval = setInterval(() => {
      const newLogs = [
        '✓ Test suite passed',
        '📊 Code coverage: 87%',
        '🔍 Running security scan...',
        '✓ No vulnerabilities found',
        '🚀 Deploying to staging...',
      ]
      const randomLog = newLogs[Math.floor(Math.random() * newLogs.length)]
      setLogs((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] ${randomLog}`,
      ])
    }, 3000)

    return () => clearInterval(interval)
  }, [isLive])

  // Auto-scroll to bottom
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const filteredLogs = filter
    ? logs.filter((log) => log.toLowerCase().includes(filter.toLowerCase()))
    : logs

  const getLogColor = (log: string) => {
    if (log.includes('✓') || log.includes('success')) return 'text-green-400'
    if (log.includes('✗') || log.includes('error') || log.includes('failed')) return 'text-red-400'
    if (log.includes('⚠') || log.includes('warning')) return 'text-yellow-400'
    if (log.includes('🚀') || log.includes('started')) return 'text-purple-400'
    return 'text-gray-300'
  }

  return (
    <div
      className="flex flex-col h-[600px] rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(0, 0, 0, 0.4)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 border-b flex items-center justify-between"
        style={{
          background: 'rgba(255, 255, 255, 0.02)',
          borderColor: 'rgba(255, 255, 255, 0.05)',
        }}
      >
        <div className="flex items-center gap-3">
          <Terminal size={16} className="text-purple-400" />
          <span className="text-sm font-bold text-white">Pipeline Logs</span>
          {isLive && (
            <span className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-green-400 font-medium">Live</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter logs..."
              className="pl-9 pr-8 py-1.5 rounded-lg text-white text-xs focus:outline-none w-48"
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            />
            {filter && (
              <button
                onClick={() => setFilter('')}
                className="absolute right-2 top-1/2 -translate-y-1/2"
              >
                <X size={12} className="text-gray-400 hover:text-white" />
              </button>
            )}
          </div>

          <button
            className="p-2 rounded-lg transition-all duration-200 hover:bg-white/10"
            title="Download logs"
          >
            <Download size={14} className="text-gray-400" />
          </button>
        </div>
      </div>

      {/* Logs Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1 font-mono text-xs">
        {filteredLogs.map((log, index) => (
          <div key={index} className={`${getLogColor(log)} leading-relaxed`}>
            {log}
          </div>
        ))}
        <div ref={logsEndRef} />
      </div>

      {/* Footer */}
      <div
        className="px-4 py-2 border-t flex items-center justify-between text-xs"
        style={{
          background: 'rgba(255, 255, 255, 0.02)',
          borderColor: 'rgba(255, 255, 255, 0.05)',
        }}
      >
        <span className="text-gray-400">
          {filteredLogs.length} lines {filter && `(filtered from ${logs.length})`}
        </span>
        <span className="text-gray-500">Press Ctrl+F to search</span>
      </div>
    </div>
  )
}
