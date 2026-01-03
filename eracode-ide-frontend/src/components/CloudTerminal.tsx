import { useEffect, useRef, useState } from 'react'
import { Terminal } from 'xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import { io, Socket } from 'socket.io-client'
import { Plus, X, Terminal as TerminalIcon, WifiOff, Wifi, Cloud } from 'lucide-react'
import 'xterm/css/xterm.css'

interface CloudTerminalInstance {
  id: string
  name: string
  xterm: Terminal
  fitAddon: FitAddon
  isActive: boolean
  cloudInfo?: {
    instanceId: string
    publicIp: string
    region: string
    instanceType: string
  }
}

const BACKEND_URL = 'http://localhost:3001'

interface CloudTerminalProps {
  cloudConfig: {
    region: string
  }
}

export default function CloudTerminal({ cloudConfig }: CloudTerminalProps) {
  const [terminals, setTerminals] = useState<CloudTerminalInstance[]>([])
  const [activeTerminalId, setActiveTerminalId] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [cloudStatus, setCloudStatus] = useState('')
  const socketRef = useRef<Socket | null>(null)

  // Initialize Socket.IO connection
  useEffect(() => {
    console.log('☁️ Connecting to cloud terminal backend:', BACKEND_URL)
    
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
      console.log('✅ Connected to cloud terminal server')
      setIsConnected(true)
    })

    socket.on('connect_error', (error) => {
      console.error('❌ Cloud connection error:', error.message)
      setIsConnected(false)
    })

    socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from cloud server:', reason)
      setIsConnected(false)
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
        if (t.id === info.sessionId) {
          return {
            ...t,
            name: `☁️ ${info.region} - ${info.publicIp}`,
            cloudInfo: {
              instanceId: info.instanceId,
              publicIp: info.publicIp,
              region: info.region,
              instanceType: info.instanceType || 't3.micro'
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
      console.log('🔌 Disconnecting cloud socket')
      socket.disconnect()
    }
  }, [])

  // Handle cloud terminal data
  useEffect(() => {
    const handleCloudData = (sessionId: string, data: string) => {
      const terminal = terminals.find(t => t.id === sessionId)
      if (terminal) {
        terminal.xterm.write(data)
      }
    }

    socketRef.current?.on('cloud-terminal:data', handleCloudData)
    
    return () => {
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

  // Create cloud terminal
  const createCloudTerminal = () => {
    if (!socketRef.current?.connected) {
      alert('Not connected to backend server!')
      return
    }

    const terminalId = `cloud-${Date.now()}`
    const terminalNumber = terminals.length + 1

    console.log(`☁️ Creating cloud terminal:`, terminalId, cloudConfig)

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

    const newTerminal: CloudTerminalInstance = {
      id: terminalId,
      name: `☁️ Cloud ${terminalNumber}`,
      xterm,
      fitAddon,
      isActive: true,
    }

    setTerminals(prev => [
      ...prev.map(t => ({ ...t, isActive: false })),
      newTerminal
    ])
    setActiveTerminalId(terminalId)

    // Mount to DOM
    setTimeout(() => {
      const container = document.getElementById(`cloud-term-${terminalId}`)
      if (container) {
        xterm.open(container)
        fitAddon.fit()
        xterm.focus()

        setCloudStatus('☁️ Launching EC2 instance...')

        // Handle user input
        xterm.onData((data) => {
          socketRef.current?.emit('cloud-terminal:write', terminalId, data)
        })

        xterm.onResize(({ cols, rows }) => {
          socketRef.current?.emit('cloud-terminal:resize', terminalId, cols, rows)
        })

        // Send cloud creation request
        socketRef.current?.emit('cloud-terminal:create', terminalId, cloudConfig)
      }
    }, 100)
  }

  // Remove cloud terminal
  const removeCloudTerminal = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const terminal = terminals.find(t => t.id === id)
    if (terminal) {
      terminal.xterm.dispose()
      socketRef.current?.emit('cloud-terminal:close', id)
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
    <div className="h-full bg-[#1e1e1e] flex flex-col">
      {/* Header - Exact same style as local terminal */}
      <div className="h-9 bg-[#252526] border-b border-[#2d2d30] flex items-center justify-between px-2">
        {/* Left: Terminal Tabs */}
        <div className="flex items-center gap-1 flex-1 overflow-x-auto">
          {terminals.map(terminal => (
            <div
              key={terminal.id}
              onClick={() => switchTerminal(terminal.id)}
              className={`group flex items-center gap-2 px-3 py-1 rounded cursor-pointer transition-all ${
                terminal.isActive ? 'bg-[#1e1e1e] text-white' : 'text-[#969696] hover:bg-[#2d2d30]'
              }`}
            >
              <Cloud size={14} />
              <span className="text-xs whitespace-nowrap">{terminal.name}</span>
              <X
                size={14}
                onClick={(e) => removeCloudTerminal(terminal.id, e)}
                className="opacity-0 group-hover:opacity-100 hover:text-red-400"
              />
            </div>
          ))}

          {/* Add Button */}
          <button
            onClick={createCloudTerminal}
            className="p-1 hover:bg-[#2d2d30] rounded text-[#969696] hover:text-white"
            title="Launch new cloud terminal"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Right: Status */}
        <div className="flex items-center gap-2">
          {cloudStatus && (
            <div className="flex items-center gap-2 text-xs text-yellow-400">
              <div className="animate-pulse">
                <Cloud size={14} />
              </div>
              <span>{cloudStatus}</span>
            </div>
          )}
          
          {isConnected ? (
            <div className="flex items-center gap-1 text-xs text-green-400">
              <Wifi size={12} />
              <span>Connected</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-xs text-red-400">
              <WifiOff size={12} />
              <span>Reconnecting...</span>
            </div>
          )}
        </div>
      </div>

      {/* Terminal Containers */}
      <div className="flex-1 relative">
        {terminals.map(terminal => (
          <div
            key={terminal.id}
            id={`cloud-term-${terminal.id}`}
            className={`absolute inset-0 ${terminal.isActive ? '' : 'hidden'}`}
          />
        ))}

        {/* Empty State - Same style as local */}
        {terminals.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-[#969696]">
            <Cloud size={48} className="mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No Cloud Terminal Running</h3>
            <p className="text-sm mb-4">Click + to launch AWS EC2 terminal in {cloudConfig.region}</p>
            <button
              onClick={createCloudTerminal}
              className="flex items-center gap-2 px-4 py-2 bg-[#0e639c] text-white rounded hover:bg-[#1177bb] transition-colors"
            >
              <Cloud size={16} />
              Launch Cloud Terminal
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
