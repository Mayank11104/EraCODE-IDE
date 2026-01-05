// src/components/WebSocketTerminal.tsx

import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react'
import { Terminal } from 'xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import { io, Socket } from 'socket.io-client'
import { Plus, X, Terminal as TerminalIcon, WifiOff, Wifi, Cloud, AlertTriangle } from 'lucide-react'
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
    instanceName: string
    publicIp: string
    region: string
  }
}

const BACKEND_URL = 'http://localhost:3001'

interface WebSocketTerminalProps {
  terminalType?: 'local' | 'cloud' | null
  cloudConfig?: {
    region: string
    mode?: 'new' | 'existing'
    customInstanceName?: string
    shouldSync?: boolean
  }
  onClosePanel?: () => void
}

// ✅ Export handle type for parent components
export interface WebSocketTerminalHandle {
  requestClose: () => boolean
}

const WebSocketTerminal = forwardRef<WebSocketTerminalHandle, WebSocketTerminalProps>(
  ({ terminalType, cloudConfig, onClosePanel }, ref) => {
  const [terminals, setTerminals] = useState<TerminalInstance[]>([])
  const [activeTerminalId, setActiveTerminalId] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [cloudStatus, setCloudStatus] = useState<string>('')
  const socketRef = useRef<Socket | null>(null)
  
  // ✅ REFS to prevent re-renders
  const terminalsRef = useRef<TerminalInstance[]>([])
  const activeTerminalIdRef = useRef<string | null>(null)
  const onClosePanelRef = useRef(onClosePanel)

  const [closeDialog, setCloseDialog] = useState<{ show: boolean; terminalId: string | null }>({ 
    show: false, 
    terminalId: null 
  })

  // ✅ NEW: Track if we're closing the panel
  const [pendingPanelClose, setPendingPanelClose] = useState(false)

  const [errorDialog, setErrorDialog] = useState<{ show: boolean; message: string; details: string }>({
    show: false,
    message: '',
    details: '',
  })

  // ✅ Keep refs in sync with state
  useEffect(() => {
    terminalsRef.current = terminals
  }, [terminals])

  useEffect(() => {
    activeTerminalIdRef.current = activeTerminalId
  }, [activeTerminalId])

  useEffect(() => {
    onClosePanelRef.current = onClosePanel
  }, [onClosePanel])

  // ✅ Expose method to parent for requesting close
  useImperativeHandle(ref, () => ({
    requestClose: () => {
      const cloudTerminals = terminalsRef.current.filter(t => t.type === 'cloud')
      
      if (cloudTerminals.length > 0) {
        // Show dialog for first cloud terminal
        setCloseDialog({ show: true, terminalId: cloudTerminals[0].id })
        setPendingPanelClose(true)
        return false // Cannot close yet
      }
      
      return true // Can close immediately
    }
  }))

  // ✅ Helper function that uses refs
  const removeTerminalByIdInternal = (id: string) => {
    setTerminals(prev => {
      const filtered = prev.filter(t => t.id !== id)
      if (activeTerminalIdRef.current === id && filtered.length > 0) {
        setActiveTerminalId(filtered[0].id)
      } else if (filtered.length === 0) {
        setActiveTerminalId(null)
      }
      return filtered
    })
  }

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
      removeTerminalByIdInternal(terminalId)
    })

    socket.on('terminal:error', (terminalId: string, error: string) => {
      console.error(`❌ Terminal ${terminalId} error:`, error)
      alert(`Terminal Error: ${error}`)
      removeTerminalByIdInternal(terminalId)
    })

    // Cloud terminal events
    socket.on('cloud-terminal:progress', (data: { stage: string, message: string, progress: number }) => {
      console.log(`☁️ ${data.stage}: ${data.message} (${data.progress}%)`)
      setCloudStatus(data.message)
      
      // ✅ USE REF
      const terminal = terminalsRef.current.find(t => t.type === 'cloud' && !t.cloudInfo)
      if (terminal) {
        terminal.xterm.writeln(`\r\x1b[36m☁️ ${data.message}\x1b[0m`)
      }
    })

  socket.on('cloud-terminal:ready', (info: any) => {
  console.log('✅ Cloud terminal ready:', info)
  console.log('📝 Instance name:', info.instanceName)
  setCloudStatus('')
  
  // Update terminal with cloud info
  setTerminals(prev => prev.map(t => {
    if (t.id === info.sessionId && t.type === 'cloud') {
      // ✅ WRITE IMMEDIATELY - NO setTimeout!
      const terminal = t.xterm
      
      terminal.writeln('\r\n\x1b[1;32m╔═══════════════════════════════════════════════════════╗\x1b[0m')
      terminal.writeln('\x1b[1;32m║  ✅ CLOUD TERMINAL READY                             ║\x1b[0m')
      terminal.writeln('\x1b[1;32m╚═══════════════════════════════════════════════════════╝\x1b[0m')
      terminal.writeln('')
      terminal.writeln(`\x1b[1;36m📝 Instance Name: \x1b[1;33m${info.instanceName}\x1b[0m`)
      terminal.writeln('')
      terminal.writeln('\x1b[1;93m⚠️  SAVE THIS NAME FOR LATER!\x1b[0m')
      terminal.writeln('\x1b[90m   Use this name to reconnect to this instance\x1b[0m')
      terminal.writeln('\x1b[90m   when you close and reopen the terminal.\x1b[0m')
      terminal.writeln('')
      terminal.writeln('\x1b[1;32m════════════════════════════════════════════════════════\x1b[0m\r\n')
      
      return {
        ...t,
        name: `☁️ ${info.instanceName || info.publicIp}`,
        cloudInfo: {
          instanceId: info.instanceId,
          instanceName: info.instanceName,
          publicIp: info.publicIp,
          region: info.region
        }
      }
    }
    return t
  }))
})


    socket.on('cloud-terminal:instance-not-found', (data: { customName: string, message: string }) => {
      console.error('❌ Instance not found:', data.message)
      
      setCloudStatus('')
      
      setErrorDialog({
        show: true,
        message: 'Instance Not Found',
        details: `Instance "${data.customName}" not found.\n\nPlease:\n• Check the spelling of the instance name\n• Create a new instance if it doesn't exist\n• Make sure the instance wasn't terminated`
      })

      setTerminals(prev => {
        const failedTerminals = prev.filter(t => t.type === 'cloud' && !t.cloudInfo)
        
        failedTerminals.forEach(term => {
          console.log('🗑️ Disposing failed terminal:', term.id)
          term.xterm.dispose()
        })
        
        const filtered = prev.filter(t => {
          if (t.type === 'local') return true
          if (t.type === 'cloud' && t.cloudInfo) return true
          return false
        })
        
        if (filtered.length === 0) {
          console.log('🚪 No terminals remaining. Closing terminal panel in 2 seconds...')
          setTimeout(() => {
            onClosePanelRef.current?.()
          }, 2000)
        }
        
        if (filtered.length > 0 && !filtered.find(t => t.id === activeTerminalIdRef.current)) {
          setActiveTerminalId(filtered[0].id)
        } else if (filtered.length === 0) {
          setActiveTerminalId(null)
        }
        
        console.log(`✅ Cleaned up ${failedTerminals.length} failed terminal(s). ${filtered.length} terminal(s) remaining.`)
        return filtered
      })
    })

    socket.on('cloud-terminal:instance-found', (data: any) => {
      console.log('✅ Instance found:', data)
      setCloudStatus(`Instance found: ${data.state}. ${data.state === 'stopped' ? 'Starting...' : 'Connecting...'}`)
    })

    socket.on('cloud-terminal:error', (sessionId: string, error: string) => {
      console.error(`❌ Cloud terminal ${sessionId} error:`, error)
      
      setCloudStatus('')
      
      setErrorDialog({
        show: true,
        message: 'Cloud Terminal Error',
        details: error
      })
      
      removeTerminalByIdInternal(sessionId)
      
      setTerminals(prev => {
        const filtered = prev.filter(t => t.id !== sessionId)
        if (filtered.length === 0) {
          setTimeout(() => {
            onClosePanelRef.current?.()
          }, 2000)
        }
        return filtered
      })
    })

    socket.on('cloud-terminal:exit', (sessionId: string) => {
      console.log(`❌ Cloud terminal ${sessionId} exited`)
      removeTerminalByIdInternal(sessionId)
    })

    socket.on('cloud-terminal:stopped', (data: { sessionId: string, instanceName: string, message: string }) => {
      console.log('⏸️ Instance stopped:', data.message)
      alert(`✅ ${data.message}`)
    })

    socket.on('cloud-terminal:terminated', (data: { sessionId: string, message: string }) => {
      console.log('🗑️ Instance terminated:', data.message)
    })

    return () => {
      console.log('🔌 Disconnecting socket')
      socket.disconnect()
    }
  }, []) // ✅ EMPTY DEPS - Socket stays connected!

  // Handle terminal data for both local and cloud
  useEffect(() => {
    const handleLocalData = (terminalId: string, data: string) => {
      // ✅ USE REF
      const terminal = terminalsRef.current.find(t => t.id === terminalId && t.type === 'local')
      if (terminal) {
        terminal.xterm.write(data)
      }
    }

    const handleCloudData = (sessionId: string, data: string) => {
      // ✅ USE REF
      const terminal = terminalsRef.current.find(t => t.id === sessionId && t.type === 'cloud')
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
  }, []) // ✅ EMPTY DEPS

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

    const type = terminalType || 'local'
    
    console.log(`📟 Creating ${type} terminal:`, terminalId)

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

    setTimeout(() => {
      const container = document.getElementById(`term-${terminalId}`)
      if (container) {
        xterm.open(container)
        fitAddon.fit()
        xterm.focus()

        if (type === 'local') {
          xterm.onData((data) => {
            socketRef.current?.emit('terminal:write', terminalId, data)
          })
          xterm.onResize(({ cols, rows }) => {
            socketRef.current?.emit('terminal:resize', terminalId, cols, rows)
          })

          const { rootDirectory } = useFileSystemStore.getState()
          socketRef.current?.emit('terminal:create', terminalId, {
            cols: 80,
            rows: 24,
            shell: 'cmd.exe',
            cwd: rootDirectory?.path
          })
        } else if (type === 'cloud') {
          xterm.onData((data) => {
            socketRef.current?.emit('cloud-terminal:write', terminalId, data)
          })
          xterm.onResize(({ cols, rows }) => {
            socketRef.current?.emit('cloud-terminal:resize', terminalId, cols, rows)
          })
          
          const { rootDirectory } = useFileSystemStore.getState()
          
          if (cloudConfig?.mode === 'existing') {
            setCloudStatus('🔍 Finding existing instance...')
            
            socketRef.current?.emit('cloud-terminal:find-instance', cloudConfig.customInstanceName)
            
            const handleInstanceFound = (data: any) => {
              socketRef.current?.off('cloud-terminal:instance-found', handleInstanceFound)
              
              socketRef.current?.emit('cloud-terminal:reconnect', terminalId, {
                instanceId: data.instanceId,
                customInstanceName: cloudConfig.customInstanceName,
                shouldSync: cloudConfig.shouldSync || false,
                localProjectPath: rootDirectory?.path,
                projectName: rootDirectory?.name
              })
            }
            
            socketRef.current?.on('cloud-terminal:instance-found', handleInstanceFound)
            
          } else {
            setCloudStatus('Launching cloud terminal...')
            
            socketRef.current?.emit('cloud-terminal:create', terminalId, {
              region: cloudConfig?.region,
              customInstanceName: cloudConfig?.customInstanceName,
              localProjectPath: rootDirectory?.path,
              projectName: rootDirectory?.name
            })
          }
          
          console.log('☁️ Cloud config:', {
            mode: cloudConfig?.mode,
            instanceName: cloudConfig?.customInstanceName,
            shouldSync: cloudConfig?.shouldSync,
            path: rootDirectory?.path,
            name: rootDirectory?.name
          })
        }
      }
    }, 100)
  }

  const handleCloudTerminalClose = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const terminal = terminals.find(t => t.id === id)
    
    if (terminal && terminal.type === 'cloud') {
      setCloseDialog({ show: true, terminalId: id })
    }
  }

  // ✅ UPDATED: Handle stop with panel close logic
  const handleStopInstance = () => {
    if (closeDialog.terminalId) {
      const terminal = terminals.find(t => t.id === closeDialog.terminalId)
      if (terminal) {
        terminal.xterm.dispose()
        socketRef.current?.emit('cloud-terminal:stop', closeDialog.terminalId)
        removeTerminalById(closeDialog.terminalId)
      }
      
      // Get remaining cloud terminals BEFORE closing dialog
      const remainingCloud = terminalsRef.current.filter(
        t => t.type === 'cloud' && t.id !== closeDialog.terminalId
      )
      
      setCloseDialog({ show: false, terminalId: null })
      
      // Check if we were trying to close panel
      if (pendingPanelClose) {
        if (remainingCloud.length > 0) {
          // More cloud terminals, show next dialog
          setTimeout(() => {
            setCloseDialog({ show: true, terminalId: remainingCloud[0].id })
          }, 100)
        } else {
          // All handled, close panel
          setPendingPanelClose(false)
          onClosePanelRef.current?.()
        }
      }
    }
  }

  // ✅ UPDATED: Handle terminate with panel close logic
  const handleTerminateInstance = () => {
    if (closeDialog.terminalId) {
      const terminal = terminals.find(t => t.id === closeDialog.terminalId)
      if (terminal) {
        terminal.xterm.dispose()
        socketRef.current?.emit('cloud-terminal:terminate', closeDialog.terminalId)
        removeTerminalById(closeDialog.terminalId)
      }
      
      // Get remaining cloud terminals BEFORE closing dialog
      const remainingCloud = terminalsRef.current.filter(
        t => t.type === 'cloud' && t.id !== closeDialog.terminalId
      )
      
      setCloseDialog({ show: false, terminalId: null })
      
      // Check if we were trying to close panel
      if (pendingPanelClose) {
        if (remainingCloud.length > 0) {
          // More cloud terminals, show next dialog
          setTimeout(() => {
            setCloseDialog({ show: true, terminalId: remainingCloud[0].id })
          }, 100)
        } else {
          // All handled, close panel
          setPendingPanelClose(false)
          onClosePanelRef.current?.()
        }
      }
    }
  }

  // Remove terminal
  const removeTerminal = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const terminal = terminals.find(t => t.id === id)
    if (terminal) {
      if (terminal.type === 'local') {
        terminal.xterm.dispose()
        socketRef.current?.emit('terminal:kill', id)
        removeTerminalById(id)
      } else if (terminal.type === 'cloud') {
        handleCloudTerminalClose(id, e)
        return
      }
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

  // Handle resize - BOTH window AND container
  useEffect(() => {
    const handleResize = () => {
      terminals.forEach(terminal => {
        if (terminal.isActive) {
          setTimeout(() => {
            try {
              terminal.fitAddon.fit()
            } catch (e) {
              console.log('Fit error:', e)
            }
          }, 10)
        }
      })
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    
    const containers = terminals.map(t => document.getElementById(`term-${t.id}`))
    const observers = containers.map(container => {
      if (container?.parentElement) {
        const observer = new ResizeObserver(handleResize)
        observer.observe(container.parentElement)
        return observer
      }
      return null
    })

    return () => {
      window.removeEventListener('resize', handleResize)
      observers.forEach(observer => observer?.disconnect())
    }
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
              title={terminal.cloudInfo?.instanceName || terminal.name}
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
            className={`absolute inset-0 ${terminal.isActive ? 'block' : 'hidden'} h-full w-full`}
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

      {/* Error Dialog */}
      {errorDialog.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#252526] border border-red-500 rounded-lg shadow-2xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-4 border-b border-[#3e3e42] bg-red-900/20">
              <h3 className="text-lg font-semibold text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                {errorDialog.message}
              </h3>
              <button
                onClick={() => {
                  setErrorDialog({ show: false, message: '', details: '' })
                  if (terminals.length === 0) {
                    onClosePanel?.()
                  }
                }}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="bg-[#1e1e1e] p-4 rounded-lg border border-red-500/30 mb-4">
                <p className="text-sm text-gray-300 whitespace-pre-line">
                  {errorDialog.details}
                </p>
              </div>
              <button
                onClick={() => {
                  setErrorDialog({ show: false, message: '', details: '' })
                  if (terminals.length === 0) {
                    onClosePanel?.()
                  }
                }}
                className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
              >
                OK, Got It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close Dialog */}
      {closeDialog.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#252526] border border-[#3e3e42] rounded-lg shadow-2xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-4 border-b border-[#3e3e42]">
              <h3 className="text-lg font-semibold text-white">☁️ Close Cloud Terminal</h3>
              <button
                onClick={() => {
                  setCloseDialog({ show: false, terminalId: null })
                  setPendingPanelClose(false) // ✅ Cancel panel close
                }}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="bg-[#1e1e1e] p-4 rounded-lg border border-yellow-500/30 mb-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
                  <div className="text-sm text-gray-300">
                    <p className="font-semibold text-yellow-400 mb-1">⚠️ Choose what to do with instance</p>
                    {pendingPanelClose && (
                      <p className="mb-2 text-yellow-300">
                        {terminalsRef.current.filter(t => t.type === 'cloud').length > 1 
                          ? `You have ${terminalsRef.current.filter(t => t.type === 'cloud').length} cloud terminals. Choose for each.`
                          : 'Choose what to do before closing terminal.'}
                      </p>
                    )}
                    <p className="text-xs text-gray-400">Default: Terminate (deletes instance)</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="bg-[#1e1e1e] p-4 rounded-lg border border-[#3e3e42]">
                  <h4 className="font-semibold text-white mb-1">⏸️ Stop</h4>
                  <p className="text-sm text-gray-400">
                    Save instance for later. Costs storage fees (~$0.10/month)
                  </p>
                </div>
                <div className="bg-[#1e1e1e] p-4 rounded-lg border border-[#3e3e42]">
                  <h4 className="font-semibold text-white mb-1">🗑️ Terminate</h4>
                  <p className="text-sm text-gray-400">
                    Delete instance completely. No charges. Cannot recover.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleStopInstance}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                >
                  ⏸️ Stop
                </button>
                <button
                  onClick={handleTerminateInstance}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                >
                  🗑️ Terminate
                </button>
              </div>
              <button
                onClick={() => {
                  setCloseDialog({ show: false, terminalId: null })
                  setPendingPanelClose(false) // ✅ Cancel panel close
                }}
                className="w-full mt-3 px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
})

WebSocketTerminal.displayName = 'WebSocketTerminal'

export default WebSocketTerminal
