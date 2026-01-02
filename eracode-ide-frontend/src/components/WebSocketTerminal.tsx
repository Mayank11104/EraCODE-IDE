import { useEffect, useRef, useState } from 'react'
import { Terminal } from 'xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import { io, Socket } from 'socket.io-client'
import { Plus, X, Terminal as TerminalIcon, WifiOff, Wifi, ChevronDown } from 'lucide-react'
import { useFileSystemStore } from '../stores/fileSystemStore'
import 'xterm/css/xterm.css'

interface TerminalInstance {
  id: string
  name: string
  xterm: Terminal
  fitAddon: FitAddon
  isActive: boolean
  shellType: string
}

type ShellType = 'powershell' | 'cmd' | 'bash' | 'git-bash'

interface ShellOption {
  id: ShellType
  name: string
  icon: string
  shell: string
  args?: string[]
}

const BACKEND_URL = 'http://localhost:3001'

// Available shell types
const SHELL_OPTIONS: ShellOption[] = [
  {
    id: 'powershell',
    name: 'PowerShell',
    icon: '💙',
    shell: 'powershell.exe',
    args: []
  },
  {
    id: 'cmd',
    name: 'Command Prompt',
    icon: '⚫',
    shell: 'cmd.exe',
    args: []
  },
  {
    id: 'bash',
    name: 'Bash',
    icon: '🐧',
    shell: 'bash.exe',
    args: []
  },
  {
    id: 'git-bash',
    name: 'Git Bash',
    icon: '🦊',
    shell: 'C:\\Program Files\\Git\\bin\\bash.exe',
    args: []
  }
]

export default function WebSocketTerminal() {
  const [terminals, setTerminals] = useState<TerminalInstance[]>([])
  const [activeTerminalId, setActiveTerminalId] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [selectedShell, setSelectedShell] = useState<ShellType>('cmd')
  const [showShellDropdown, setShowShellDropdown] = useState(false)
  const socketRef = useRef<Socket | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowShellDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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

    socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Reconnected after', attemptNumber, 'attempts')
      setIsConnected(true)
    })

    // Terminal events
    socket.on('terminal:created', (terminalId: string, info: any) => {
      console.log(`✅ Terminal ${terminalId} created:`, info)
    })

    socket.on('terminal:exit', (terminalId: string, exitCode: number) => {
      console.log(`❌ Terminal ${terminalId} exited with code ${exitCode}`)
      setTerminals(prev => prev.filter(t => t.id !== terminalId))
      if (activeTerminalId === terminalId) {
        const remaining = terminals.filter(t => t.id !== terminalId)
        setActiveTerminalId(remaining.length > 0 ? remaining[0].id : null)
      }
    })

    socket.on('terminal:error', (terminalId: string, error: string) => {
      console.error(`❌ Terminal ${terminalId} error:`, error)
      alert(`Terminal Error: ${error}`)
      
      // Remove failed terminal
      setTerminals(prev => prev.filter(t => t.id !== terminalId))
      if (activeTerminalId === terminalId) {
        setActiveTerminalId(null)
      }
    })

    return () => {
      console.log('🔌 Disconnecting socket')
      socket.disconnect()
    }
  }, [])

  // Update terminals when list changes
  useEffect(() => {
    const handleTerminalData = (terminalId: string, data: string) => {
      const terminal = terminals.find(t => t.id === terminalId)
      if (terminal) {
        terminal.xterm.write(data)
      }
    }

    socketRef.current?.on('terminal:data', handleTerminalData)

    return () => {
      socketRef.current?.off('terminal:data', handleTerminalData)
    }
  }, [terminals])

  // Create new terminal with specific shell type
  const createTerminal = (shellType?: ShellType) => {
    if (!socketRef.current?.connected) {
      alert('Not connected to backend server! Please wait for connection...')
      return
    }

    const shell = shellType || selectedShell
    const shellOption = SHELL_OPTIONS.find(opt => opt.id === shell)
    
    if (!shellOption) {
      alert('Invalid shell type!')
      return
    }

    const terminalId = `terminal-${Date.now()}`
    console.log('📟 Creating terminal:', terminalId, 'Shell:', shellOption.name)

    // ✅ GET FOLDER PATH FROM FILE SYSTEM STORE
    const { rootDirectory } = useFileSystemStore.getState()
    let workingDir: string | undefined = undefined
    
    if (rootDirectory && rootDirectory.path) {
      workingDir = rootDirectory.path
      console.log('📂 Using folder path:', workingDir)
    } else {
      console.log('📂 No folder path provided, using default directory')
    }

    // Create XTerm instance
    const xterm = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#ffffff',
        black: '#000000',
        red: '#cd3131',
        green: '#0dbc79',
        yellow: '#e5e510',
        blue: '#2472c8',
        magenta: '#bc3fbc',
        cyan: '#11a8cd',
        white: '#e5e5e5',
        brightBlack: '#666666',
        brightRed: '#f14c4c',
        brightGreen: '#23d18b',
        brightYellow: '#f5f543',
        brightBlue: '#3b8eea',
        brightMagenta: '#d670d6',
        brightCyan: '#29b8db',
        brightWhite: '#e5e5e5',
      }
    })

    // Add addons
    const fitAddon = new FitAddon()
    xterm.loadAddon(fitAddon)
    xterm.loadAddon(new WebLinksAddon())

    // Handle user input
    xterm.onData((data) => {
      socketRef.current?.emit('terminal:write', terminalId, data)
    })

    // Handle resize
    xterm.onResize(({ cols, rows }) => {
      socketRef.current?.emit('terminal:resize', terminalId, cols, rows)
    })

    const newTerminal: TerminalInstance = {
      id: terminalId,
      name: `${shellOption.icon} ${shellOption.name}`,
      xterm,
      fitAddon,
      isActive: true,
      shellType: shell
    }

    setTerminals(prev => [
      ...prev.map(t => ({ ...t, isActive: false })),
      newTerminal
    ])
    setActiveTerminalId(terminalId)

    // ✅ SEND WORKING DIRECTORY TO BACKEND
    console.log('🚀 Sending to backend:', {
      terminalId,
      cwd: workingDir,
      shell: shellOption.shell
    })

    socketRef.current?.emit('terminal:create', terminalId, {
      cols: 80,
      rows: 24,
      shell: shellOption.shell,
      shellArgs: shellOption.args || [],
      cwd: workingDir  // ← CRITICAL: This sends the directory path!
    })

    // Mount to DOM
    setTimeout(() => {
      const container = document.getElementById(`term-${terminalId}`)
      if (container) {
        xterm.open(container)
        fitAddon.fit()
        xterm.focus()
      }
    }, 100)
  }

  // Remove terminal
  const removeTerminal = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()

    const terminal = terminals.find(t => t.id === id)
    if (terminal) {
      terminal.xterm.dispose()
      socketRef.current?.emit('terminal:kill', id)
    }

    const filtered = terminals.filter(t => t.id !== id)
    setTerminals(filtered)

    if (activeTerminalId === id) {
      const newActive = filtered.length > 0 ? filtered[filtered.length - 1].id : null
      setActiveTerminalId(newActive)
    }
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

  // Handle window resize
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
    <div className="h-full flex flex-col bg-dark-base">
      {/* Header with connection status */}
      <div className="h-9 flex items-center justify-between bg-dark-surface border-b border-dark-border px-2 z-10 relative">
        {/* Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {terminals.map(terminal => (
            <div
              key={terminal.id}
              onClick={() => switchTerminal(terminal.id)}
              className={`
                group flex items-center gap-2 px-3 py-1 rounded-t cursor-pointer transition-all whitespace-nowrap
                ${terminal.isActive 
                  ? 'bg-dark-base text-text-primary' 
                  : 'bg-transparent text-text-secondary hover:bg-dark-hover'}
              `}
            >
              <span className="text-[13px] font-medium">{terminal.name}</span>
              <button
                onClick={(e) => removeTerminal(terminal.id, e)}
                className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity"
              >
                <X size={14} />
              </button>
            </div>
          ))}

          {/* Shell Type Dropdown + Add Button */}
          <div className="flex items-center gap-1">
            {/* Shell Selector Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowShellDropdown(!showShellDropdown)}
                disabled={!isConnected}
                className="flex items-center gap-1 px-2 py-1 text-text-secondary hover:text-text-primary hover:bg-dark-hover rounded disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                title="Select Terminal Type"
              >
                <span className="text-sm">
                  {SHELL_OPTIONS.find(s => s.id === selectedShell)?.icon}
                </span>
                <ChevronDown size={14} />
              </button>

              {/* Dropdown Menu */}
              {showShellDropdown && (
                <div className="absolute bottom-full left-0 mb-1 bg-dark-surface border border-dark-border rounded shadow-lg py-1 min-w-[180px] z-50">
                  {SHELL_OPTIONS.map((shellOption) => (
                    <button
                      key={shellOption.id}
                      onClick={() => {
                        setSelectedShell(shellOption.id)
                        setShowShellDropdown(false)
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-text-primary hover:bg-dark-hover flex items-center gap-2 transition-colors"
                    >
                      <span className="text-base">{shellOption.icon}</span>
                      <span className="flex-1">{shellOption.name}</span>
                      {selectedShell === shellOption.id && (
                        <span className="text-primary">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Add Terminal Button */}
            <button
              onClick={() => createTerminal()}
              disabled={!isConnected}
              className="flex items-center gap-1 px-2 py-1 text-text-secondary hover:text-text-primary hover:bg-dark-hover rounded disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              title={isConnected ? `New ${SHELL_OPTIONS.find(s => s.id === selectedShell)?.name} Terminal` : 'Not connected to backend'}
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Connection status */}
        <div className="flex items-center gap-2 px-2">
          {isConnected ? (
            <div className="flex items-center gap-1 text-green-400 text-[11px]">
              <Wifi size={14} />
              <span>Connected</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-red-400 text-[11px]">
              <WifiOff size={14} />
              <span>Reconnecting...</span>
            </div>
          )}
        </div>
      </div>

      {/* ✅ FIXED: Terminal containers */}
      <div className="flex-1 relative overflow-hidden">
        {terminals.map(terminal => (
          <div
            key={terminal.id}
            id={`term-${terminal.id}`}
            className={`w-full h-full p-2 ${terminal.isActive ? 'block' : 'hidden'}`}
          />
        ))}

        {/* Empty state */}
        {terminals.length === 0 && (
          <div className="flex items-center justify-center h-full text-text-secondary">
            <div className="text-center">
              <TerminalIcon size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-sm mb-2">No terminal open</p>
              <p className="text-xs text-text-secondary mb-4">
                {isConnected ? 'Select a terminal type and click + to start' : 'Waiting for backend connection...'}
              </p>
              <button
                onClick={() => createTerminal()}
                disabled={!isConnected}
                className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isConnected ? `Open ${SHELL_OPTIONS.find(s => s.id === selectedShell)?.name}` : 'Connecting...'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
