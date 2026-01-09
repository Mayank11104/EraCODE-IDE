import { useState, useRef, useEffect } from 'react'
import {
  Play,
  Square,
  RefreshCw,
  Box,
  Trash2,
  Hammer,
  Layers,
  Terminal,
  Cpu,
  XCircle,
  Info,
  ChevronRight,
  Activity
} from 'lucide-react'

// --- Types ---
type ContainerStatus = 'running' | 'stopped' | 'error' | 'building'

interface Container {
  id: string
  name: string
  image: string
  status: ContainerStatus
  port?: string
  uptime?: string
}

interface LogEntry {
  id: string
  timestamp: string
  message: string
  type: 'info' | 'error' | 'success'
}

// Real file system store
import { useFileSystemStore } from '../../stores/fileSystemStore'

// --- Components ---

const ActionButton = ({
  icon: Icon,
  label,
  onClick,
  variant = 'primary',
  disabled = false,
  loading = false
}: {
  icon: any
  label: string
  onClick: () => void
  variant?: 'primary' | 'danger' | 'neutral'
  disabled?: boolean
  loading?: boolean
}) => {
  const variants = {
    primary: "text-text-primary hover:bg-dark-hover hover:text-white border-dark-border",
    danger: "text-text-secondary hover:bg-red-500/10 hover:text-red-400 border-dark-border",
    neutral: "text-text-secondary hover:bg-dark-hover hover:text-text-primary border-dark-border"
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        relative group px-3 py-2 rounded-md border border-transparent transition-all duration-200
        ${variants[variant]}
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'active:scale-95'}
        flex flex-col items-center gap-1.5 min-w-[70px]
      `}
      title={label}
    >
      <div className="relative">
        {loading ? (
          <RefreshCw size={18} className="animate-spin" />
        ) : (
          <Icon size={18} />
        )}
      </div>
      <span className="text-[10px] font-medium tracking-wide uppercase">{label}</span>
    </button>
  )
}

const StatusBadge = ({ status }: { status: ContainerStatus }) => {
  const styles = {
    running: "bg-green-500/10 text-green-400 border-green-500/20",
    stopped: "bg-gray-500/10 text-gray-400 border-gray-500/20",
    error: "bg-red-500/10 text-red-400 border-red-500/20",
    building: "bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse"
  }

  const icons = {
    running: <Activity size={10} className="animate-pulse" />,
    stopped: <Square size={10} />,
    error: <XCircle size={10} />,
    building: <RefreshCw size={10} className="animate-spin" />
  }

  return (
    <span className={`
      inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full border border-transparent
      ${styles[status]} font-medium uppercase tracking-wider
    `}>
      {icons[status]}
      {status}
    </span>
  )
}

const SmartModal = ({ isOpen, onClose, onRun }: { isOpen: boolean; onClose: () => void; onRun: (config: any) => void }) => {
  if (!isOpen) return null

  const [port, setPort] = useState('3000')
  const [volume, setVolume] = useState('./src:/app/src')
  const [envFile] = useState('.env.local')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-dark-surface border border-dark-border shadow-2xl rounded-lg w-[440px] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-dark-border flex items-center justify-between bg-dark-header">
          <div className="flex items-center gap-3">
            <h2 className="font-semibold text-text-primary text-base">Run Container</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded hover:bg-dark-hover flex items-center justify-center transition-colors group"
          >
            <XCircle size={18} className="text-text-secondary group-hover:text-text-primary transition-colors" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-semibold uppercase text-text-secondary tracking-wider">
              <ChevronRight size={12} />
              Port Mapping
            </label>
            <input
              type="text"
              value={port}
              onChange={(e) => setPort(e.target.value)}
              placeholder="e.g., 3000:3000"
              className="w-full bg-dark-base border border-dark-border focus:border-primary rounded px-3 py-2 text-sm text-text-primary placeholder-text-secondary outline-none transition-all duration-200"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-semibold uppercase text-text-secondary tracking-wider">
              <ChevronRight size={12} />
              Volume Mount
            </label>
            <input
              type="text"
              value={volume}
              onChange={(e) => setVolume(e.target.value)}
              placeholder="e.g., ./src:/app/src"
              className="w-full bg-dark-base border border-dark-border focus:border-primary rounded px-3 py-2 text-sm text-text-primary placeholder-text-secondary outline-none transition-all duration-200"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-semibold uppercase text-text-secondary tracking-wider">
              <ChevronRight size={12} />
              Environment File
            </label>
            <div className="flex items-center gap-3 bg-dark-base border border-dark-border rounded px-3 py-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm text-text-primary flex-1">{envFile}</span>
              <span className="text-xs text-green-500 font-medium uppercase tracking-wider px-2 py-0.5 bg-green-500/10 rounded-full">Detected</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-dark-border flex justify-end gap-3 bg-dark-base">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-dark-hover transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => onRun({ port, volume, envFile })}
            className="px-4 py-2 bg-primary hover:bg-blue-600 text-white rounded text-sm font-medium shadow-sm transition-all duration-200 flex items-center gap-2"
          >
            <Play size={14} fill="currentColor" />
            Run Container
          </button>
        </div>
      </div>
    </div>
  )
}

export default function DockerPanel() {
  const { rootDirectory } = useFileSystemStore()
  const [containers, setContainers] = useState<Container[]>([])
  const [selectedContainer, setSelectedContainer] = useState<string | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [showModal, setShowModal] = useState(false)
  const [isBuilding, setIsBuilding] = useState(false)
  const [agentMessage, setAgentMessage] = useState<string | null>("Ready to build and deploy containers")
  const logsEndRef = useRef<HTMLDivElement>(null)

  const addLog = (message: string, type: 'info' | 'error' | 'success' = 'info') => {
    setLogs(prev => [...prev.slice(-99), {
      id: Math.random().toString(36),
      timestamp: new Date().toLocaleTimeString(),
      message,
      type
    }])
  }

  // ✅ FETCH CONTAINERS (Restored)
  const fetchContainers = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/docker/containers')
      const data = await res.json()
      setContainers(data)
    } catch (err) {
      // console.error('Failed to fetch containers', err) 
      // Silent fail to avoid spamming console
    }
  }

  useEffect(() => {
    fetchContainers()
    const interval = setInterval(fetchContainers, 3000) // Poll every 3s
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const handleBuild = async () => {
    setIsBuilding(true)
    addLog('Starting build process...', 'info')
    setAgentMessage(`Building image from ${rootDirectory?.name || 'project root'}...`)

    try {
      if (!rootDirectory?.path) {
        throw new Error('No active project found')
      }

      const projectName = rootDirectory.name.toLowerCase().replace(/[^a-z0-9-_]/g, '-')
      const imageTag = `${projectName}:latest`

      const res = await fetch('http://localhost:3001/api/docker/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tag: imageTag,
          contextPath: rootDirectory.path
        })
      })
      const data = await res.json()

      if (res.ok) {
        addLog(`Successfully built image: ${imageTag}`, 'success')
        setAgentMessage('Build complete. Ready to run.')
      } else {
        addLog(`Build failed: ${data.details}`, 'error')
        setAgentMessage('Build failed. Check logs.')
      }
    } catch (err: any) {
      addLog(`Build error: ${err.message || 'Unknown error'}`, 'error')
    } finally {
      setIsBuilding(false)
    }
  }

  const handleRunConfig = async (config: any) => {
    setShowModal(false)
    addLog(`Starting container on port ${config.port}...`, 'info')
    setAgentMessage(`Starting container on port ${config.port}...`)

    try {
      const res = await fetch('http://localhost:3001/api/docker/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: 'nginx:latest', // Note: Ideally dynamic
          name: `demo-${Date.now()}`,
          port: config.port
        })
      })
      const result = await res.json()
      if (result.status === 'started') {
        addLog(`Container ${result.id.substring(0, 12)} started successfully`, 'success')
        setAgentMessage('Container running successfully.')
        fetchContainers()
      } else {
        addLog('Failed to start container', 'error')
        setAgentMessage('Failed to start container.')
      }
    } catch (err) {
      addLog('API Error: Failed to run container', 'error')
    }
  }

  const toggleContainer = async (id: string, currentStatus: string) => {
    if (currentStatus === 'running') {
      try {
        await fetch(`http://localhost:3001/api/docker/stop/${id}`, { method: 'POST' })
        addLog(`Stopping container ${id}...`, 'info')
        fetchContainers()
      } catch (err) {
        addLog('Failed to stop container', 'error')
      }
    } else {
      try {
        addLog(`Restarting container ${id}...`, 'info')
        await fetch(`http://localhost:3001/api/docker/restart/${id}`, { method: 'POST' })
        addLog(`Container ${id} restarted`, 'success')
        fetchContainers()
      } catch (err) {
        addLog('Failed to restart container', 'error')
      }
    }
  }

  return (
    <div className="h-screen flex flex-col bg-dark-surface relative overflow-hidden text-sm">
      <SmartModal isOpen={showModal} onClose={() => setShowModal(false)} onRun={handleRunConfig} />

      {/* Header */}
      <div className="relative z-10 px-4 py-3 border-b border-dark-border bg-dark-header">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <h1 className="text-sm font-bold text-text-primary uppercase tracking-wider">Docker Manager</h1>
            <span className="text-[10px] text-text-secondary bg-dark-base px-1.5 py-0.5 rounded border border-dark-border">v1.0</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              <span className="text-[10px] font-medium text-text-secondary">Connected</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <ActionButton icon={Hammer} label="Build" onClick={handleBuild} loading={isBuilding} />
          <ActionButton icon={Play} label="Run" onClick={() => setShowModal(true)} />
          <ActionButton icon={Layers} label="Compose" onClick={() => addLog('Running docker-compose up...', 'info')} />
          <div className="w-px h-6 bg-dark-border mx-1" />
          <ActionButton icon={RefreshCw} label="Rebuild" onClick={() => addLog('Rebuilding...', 'info')} variant="neutral" />
          <ActionButton icon={Trash2} label="Prune" onClick={() => addLog('Pruning system...', 'info')} variant="danger" />
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 overflow-hidden flex flex-col bg-dark-surface">
        {/* Containers Section */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase text-text-secondary tracking-wider flex items-center gap-2">
              <Box size={14} />
              Active Containers ({containers.length})
            </h2>
          </div>

          <div className="grid gap-2">
            {containers.map(container => (
              <div
                key={container.id}
                onClick={() => setSelectedContainer(container.id)}
                className={`
                  group relative rounded border p-3 cursor-pointer transition-all duration-200
                  ${selectedContainer === container.id
                    ? 'bg-dark-hover border-primary/50 shadow-sm'
                    : 'bg-dark-base border-dark-border hover:border-text-secondary/30'}
                `}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${selectedContainer === container.id
                      ? 'bg-primary/20 text-primary'
                      : 'bg-dark-surface text-text-secondary'
                      }`}>
                      <Box size={16} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-text-primary mb-0.5 truncate">{container.name}</h3>
                      <p className="text-xs text-text-secondary font-mono truncate" title={container.image}>
                        {container.image.startsWith('sha256:') ? container.image.substring(0, 12) : container.image}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 ml-2">
                    <StatusBadge status={container.status} />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex gap-4 text-xs font-mono text-text-secondary">
                    {container.port && (
                      <div className="flex items-center gap-1.5">
                        <Terminal size={12} />
                        <span>{container.port}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {container.status === 'running' ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleContainer(container.id, 'running') }}
                        className="p-1 hover:bg-red-500/10 hover:text-red-400 text-text-secondary rounded transition-colors"
                        title="Stop"
                      >
                        <Square size={14} fill="currentColor" />
                      </button>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleContainer(container.id, 'stopped') }}
                        className="p-1 hover:bg-green-500/10 hover:text-green-400 text-text-secondary rounded transition-colors"
                        title="Start"
                      >
                        <Play size={14} fill="currentColor" />
                      </button>
                    )}
                    <button
                      className="p-1 hover:bg-dark-hover hover:text-text-primary text-text-secondary rounded transition-colors"
                      title="Logs"
                    >
                      <Terminal size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Logs Panel */}
        <div className="h-48 border-t border-dark-border bg-dark-base flex flex-col">
          {/* Agent Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-dark-border bg-dark-header">
            <div className="flex items-center gap-2">
              <Cpu size={14} className="text-primary" />
              <span className="text-xs font-semibold text-text-primary">System Output</span>
            </div>
            <button className="text-[10px] text-primary hover:text-blue-300 font-medium px-2 py-1 bg-primary/10 rounded hover:bg-primary/20 transition-all">
              Clear Logs
            </button>
          </div>

          {/* Agent Message */}
          {agentMessage && (
            <div className="px-3 py-2 bg-primary/5 border-b border-dark-border flex items-start gap-2">
              <Info size={14} className="text-primary mt-0.5 flex-shrink-0" />
              <p className="text-xs text-text-primary leading-relaxed">{agentMessage}</p>
            </div>
          )}

          {/* Logs */}
          <div className="flex-1 overflow-y-auto px-3 py-2 font-mono text-xs space-y-0.5">
            {logs.length === 0 && (
              <div className="h-full flex items-center justify-center">
                <span className="text-text-secondary opacity-50">No logs available</span>
              </div>
            )}
            {logs.map(log => (
              <div
                key={log.id}
                className="flex gap-2 text-text-secondary hover:bg-dark-surface px-1 py-0.5 rounded transition-colors"
              >
                <span className="opacity-50 select-none min-w-[60px] text-[10px]">{log.timestamp}</span>
                <span className={`flex-1 break-all ${log.type === 'error' ? 'text-red-400' :
                  log.type === 'success' ? 'text-green-400' :
                    'text-text-primary'
                  }`}>
                  {log.message}
                </span>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        </div>
      </div>
    </div>
  )
}