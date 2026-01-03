import { useEffect, useRef, useState } from 'react'
import { Terminal } from 'xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import { io, Socket } from 'socket.io-client'
import { Plus, X, Terminal as TerminalIcon, WifiOff, Wifi, Cloud } from 'lucide-react'
import { useFileSystemStore } from '../stores/fileSystemStore'
import 'xterm/css/xterm.css'

interface TerminalInstance {
  id: string
  name: string
  xterm: Terminal
  fitAddon: FitAddon
  isActive: boolean
  type: 'local' | 'cloud'
  cloudInfo?: {
    instanceId: string
    publicIp: string
    region: string
  }
}

const BACKEND_URL = 'http://localhost:3001'

interface WebSocketTerminalProps {
  terminalType?: 'local' | 'cloud' | null
  cloudConfig?: {
    region: string
  }
}

export default function WebSocketTerminal({ terminalType, cloudConfig }: WebSocketTerminalProps) {
  const [terminals, setTerminals] = useState<TerminalInstance[]>([])
  const [activeTerminalId, setActiveTerminalId] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [cloudStatus, setCloudStatus] = useState<string>('')
  const socketRef = useRef<Socket | null>(null)

  // Initialize Socket.IO connection
  useEffect(() => {
    console.log('🔌 Connecting to backend:', BACKEND_URL)
    const socket = io(BACKEND_URL, {
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
      timeout: 20000,
    })

    socketRef.current = socket

    // Connection events
    socket.on('connect', () => {
      console.log('✅ Connected to terminal server')
      setIsConnected(true)
    })

    socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error.message)
      setIsConnected(false)
    })

    socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from server:', reason)
      setIsConnected(false)
    })

    // Local terminal events
    socket.on('terminal:created', (terminalId: string) => {
      console.log(`✅ Local terminal ${terminalId} created`)
    })

    socket.on('terminal:exit', (terminalId: string, exitCode: number) => {
      console.log(`❌ Terminal ${terminalId} exited with code ${exitCode}`)
      removeTerminalById(terminalId)
    })

    socket.on('terminal:error', (terminalId: string, error: string) => {
      console.error(`❌ Terminal ${terminalId} error:`, error)
      alert(`Terminal Error: ${error}`)
      removeTerminalById(terminalId)
    })

    // Cloud terminal events
    socket.on('cloud-terminal:progress', (data: { stage: string, message: string, progress: number }) => {
      console.log(`☁️ ${data.stage}: ${data.message} (${data.progress}%)`)
      setCloudStatus(data.message)
    })

    socket.on('cloud-terminal:ready', (info: any) => {
      console.log('✅ Cloud terminal ready:', info)
      setCloudStatus('')
      
      // Update terminal with cloud info
      setTerminals(prev => prev.map(t => {
        if (t.id === info.sessionId && t.type === 'cloud') {
          return {
            ...t,
            cloudInfo: {
              instanceId: info.instanceId,
              publicIp: info.publicIp,
              region: info.region
            }
          }
        }
        return t
      }))
    })

    socket.on('cloud-terminal:error', (sessionId: string, error: string) => {
      console.error(`❌ Cloud terminal ${sessionId} error:`, error)
      alert(`Cloud Terminal Error: ${error}`)
      setCloudStatus('')
      removeTerminalById(sessionId)
    })

    socket.on('cloud-terminal:exit', (sessionId: string) => {
      console.log(`❌ Cloud terminal ${sessionId} exited`)
      removeTerminalById(sessionId)
    })

    return () => {
      console.log('🔌 Disconnecting socket')
      socket.disconnect()
    }
  }, [])

  // Handle terminal data for both local and cloud
  useEffect(() => {
    const handleLocalData = (terminalId: string, data: string) => {
      const terminal = terminals.find(t => t.id === terminalId && t.type === 'local')
      if (terminal) {
        terminal.xterm.write(data)
      }
    }

    const handleCloudData = (sessionId: string, data: string) => {
      const terminal = terminals.find(t => t.id === sessionId && t.type === 'cloud')
      if (terminal) {
        terminal.xterm.write(data)
      }
    }

    socketRef.current?.on('terminal:data', handleLocalData)
    socketRef.current?.on('cloud-terminal:data', handleCloudData)

    return () => {
      socketRef.current?.off('terminal:data', handleLocalData)
      socketRef.current?.off('cloud-terminal:data', handleCloudData)
    }
  }, [terminals])

  const removeTerminalById = (id: string) => {
    setTerminals(prev => {
      const filtered = prev.filter(t => t.id !== id)
      if (activeTerminalId === id && filtered.length > 0) {
        setActiveTerminalId(filtered[0].id)
      } else if (filtered.length === 0) {
        setActiveTerminalId(null)
      }
      return filtered
    })
  }

  // Create terminal based on type
  const createTerminal = () => {
    if (!socketRef.current?.connected) {
      alert('Not connected to backend server!')
      return
    }

    const terminalId = `terminal-${Date.now()}`
    const terminalNumber = terminals.length + 1

    // Determine type
    const type = terminalType || 'local'
    
    console.log(`📟 Creating ${type} terminal:`, terminalId)

    // Create XTerm instance
    const xterm = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#ffffff',
      },
    })

    const fitAddon = new FitAddon()
    xterm.loadAddon(fitAddon)
    xterm.loadAddon(new WebLinksAddon())

    const newTerminal: TerminalInstance = {
      id: terminalId,
      name: type === 'cloud' ? `☁️ Cloud ${terminalNumber}` : `💻 Local ${terminalNumber}`,
      xterm,
      fitAddon,
      isActive: true,
      type,
    }

    setTerminals(prev => [
      ...prev.map(t => ({ ...t, isActive: false })),
      newTerminal
    ])
    setActiveTerminalId(terminalId)

    // Mount to DOM
    setTimeout(() => {
      const container = document.getElementById(`term-${terminalId}`)
      if (container) {
        xterm.open(container)
        fitAddon.fit()
        xterm.focus()

        // Handle user input
        if (type === 'local') {
          xterm.onData((data) => {
            socketRef.current?.emit('terminal:write', terminalId, data)
          })
          xterm.onResize(({ cols, rows }) => {
            socketRef.current?.emit('terminal:resize', terminalId, cols, rows)
          })

          // Send creation request
          const { rootDirectory } = useFileSystemStore.getState()
          socketRef.current?.emit('terminal:create', terminalId, {
            cols: 80,
            rows: 24,
            shell: 'cmd.exe',
            cwd: rootDirectory?.path
          })
        } else if (type === 'cloud') {
  setCloudStatus('Launching cloud terminal...')
  xterm.onData((data) => {
    socketRef.current?.emit('cloud-terminal:write', terminalId, data)
  })
  xterm.onResize(({ cols, rows }) => {
    socketRef.current?.emit('cloud-terminal:resize', terminalId, cols, rows)
  })
  
  // Get project info from fileSystemStore
  const { rootDirectory } = useFileSystemStore.getState()
  
  // Send cloud creation request WITH PROJECT INFO
  socketRef.current?.emit('cloud-terminal:create', terminalId, {
    ...cloudConfig,  // ✅ Keeps region
    localProjectPath: rootDirectory?.path,  // ✅ NEW: e.g., "C:\Users\asus\Desktop\myproject"
    projectName: rootDirectory?.name        // ✅ NEW: e.g., "myproject"
  })
  
  console.log('☁️ Launching cloud terminal with project:', {
    path: rootDirectory?.path,
    name: rootDirectory?.name
  })
}
      }
    }, 100)
  }

  // Remove terminal
  const removeTerminal = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const terminal = terminals.find(t => t.id === id)
    if (terminal) {
      terminal.xterm.dispose()
      
      if (terminal.type === 'local') {
        socketRef.current?.emit('terminal:kill', id)
      } else if (terminal.type === 'cloud') {
        socketRef.current?.emit('cloud-terminal:close', id)
      }
    }
    removeTerminalById(id)
  }

  // Switch terminal
  const switchTerminal = (id: string) => {
    setActiveTerminalId(id)
    setTerminals(prev => prev.map(t => ({ ...t, isActive: t.id === id })))
    const terminal = terminals.find(t => t.id === id)
    if (terminal) {
      setTimeout(() => {
        terminal.fitAddon.fit()
        terminal.xterm.focus()
      }, 0)
    }
  }

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      terminals.forEach(terminal => {
        if (terminal.isActive) {
          terminal.fitAddon.fit()
        }
      })
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [terminals])

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e]">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#252526] border-b border-[#2d2d30]">
        {/* Terminal Tabs */}
        <div className="flex items-center gap-1">
          {terminals.map(terminal => (
            <div
              key={terminal.id}
              onClick={() => switchTerminal(terminal.id)}
              className={`group flex items-center gap-2 px-3 py-1 rounded cursor-pointer transition-all ${
                terminal.isActive ? 'bg-[#1e1e1e] text-white' : 'text-[#969696] hover:bg-[#2d2d30]'
              }`}
            >
              {terminal.name}
              <X
                size={14}
                onClick={(e) => removeTerminal(terminal.id, e)}
                className="opacity-0 group-hover:opacity-100 hover:text-red-400"
              />
            </div>
          ))}
          
          {/* Add Button */}
          <button
            onClick={createTerminal}
            disabled={!isConnected}
            className="p-1 text-[#969696] hover:text-white hover:bg-[#2d2d30] rounded disabled:opacity-50"
            title={terminalType === 'cloud' ? 'Launch Cloud Terminal' : 'Open Local Terminal'}
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Status */}
        <div className="flex items-center gap-2 text-xs">
          {cloudStatus && (
            <span className="text-yellow-400">{cloudStatus}</span>
          )}
          {isConnected ? (
            <div className="flex items-center gap-1 text-green-400">
              <Wifi size={12} />
              Connected
            </div>
          ) : (
            <div className="flex items-center gap-1 text-red-400">
              <WifiOff size={12} />
              Reconnecting...
            </div>
          )}
        </div>
      </div>

      {/* Terminal Containers */}
      <div className="flex-1 relative">
        {terminals.map(terminal => (
          <div
            key={terminal.id}
            id={`term-${terminal.id}`}
            className={`absolute inset-0 ${terminal.isActive ? 'block' : 'hidden'}`}
          />
        ))}

        {/* Empty State */}
        {terminals.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-[#969696]">
            <TerminalIcon size={48} className="mb-4 opacity-50" />
            <p className="text-sm mb-2">No terminal open</p>
            <p className="text-xs mb-4">
              {terminalType === 'cloud' 
                ? 'Click + to launch a cloud terminal in AWS' 
                : 'Click + to open a local terminal'}
            </p>
            <button
              onClick={createTerminal}
              disabled={!isConnected}
              className="px-4 py-2 bg-[#007acc] text-white rounded hover:bg-[#005a9e] disabled:opacity-50 text-sm"
            >
              {terminalType === 'cloud' ? '☁️ Launch Cloud Terminal' : '💻 Open Local Terminal'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
