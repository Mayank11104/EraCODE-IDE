import { useState, useRef, useEffect } from 'react'
import { Link2, Send, Trash2, Play, Square, Zap, MessageCircle } from 'lucide-react'

interface Message {
  id: string
  type: 'sent' | 'received' | 'error' | 'info'
  content: string
  timestamp: Date
}

// ✅ FIX: Generate truly unique IDs using crypto API
const generateUniqueId = () => {
  return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export default function WebSocketTester() {
  const [url, setUrl] = useState('wss://echo.websocket.org')
  const [isConnected, setIsConnected] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [messageInput, setMessageInput] = useState('')
  const wsRef = useRef<WebSocket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const addMessage = (type: Message['type'], content: string) => {
    setMessages(prev => [...prev, {
      id: generateUniqueId(), // ✅ Always unique
      type,
      content,
      timestamp: new Date()
    }])
  }

  const connect = () => {
    try {
      let wsUrl = url

      // ✅ If testing external WebSocket through proxy
      // (Uncomment this if you want to use proxy for external WebSockets)
      /*
      if (url !== 'ws://localhost:3001/ws-echo' && !url.includes('localhost:3001')) {
        const encodedTarget = encodeURIComponent(url)
        wsUrl = `ws://localhost:3001/ws-proxy?target=${encodedTarget}`
        console.log('🔌 Using proxy:', wsUrl)
      }
      */

      console.log('🔌 Connecting to:', wsUrl)
      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        console.log('✅ Connected')
        setIsConnected(true)
        addMessage('info', '✅ Connected to WebSocket server')
      }

      ws.onmessage = (event) => {
        console.log('📨 Received:', event.data)
        
        // Try to parse JSON messages
        try {
          const parsed = JSON.parse(event.data)
          if (parsed.type === 'proxy-connected') {
            addMessage('info', `🔗 Proxy connected to: ${parsed.target}`)
          } else if (parsed.type === 'proxy-error') {
            addMessage('error', `❌ Proxy error: ${parsed.error}`)
          } else if (parsed.type === 'welcome' || parsed.type === 'echo') {
            addMessage('received', JSON.stringify(parsed, null, 2))
          } else {
            addMessage('received', event.data)
          }
        } catch {
          // Not JSON, just display as-is
          addMessage('received', event.data)
        }
      }

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error)
        addMessage('error', '❌ WebSocket error occurred')
      }

      ws.onclose = (event) => {
        console.log('🔌 Disconnected. Code:', event.code, 'Reason:', event.reason)
        setIsConnected(false)
        addMessage('info', `🔌 Disconnected from server (Code: ${event.code})`)
      }

      wsRef.current = ws
    } catch (error: any) {
      console.error('❌ Connection failed:', error)
      addMessage('error', `Failed to connect: ${error.message}`)
    }
  }

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
  }

  const sendMessage = () => {
    if (wsRef.current && messageInput.trim()) {
      wsRef.current.send(messageInput)
      addMessage('sent', messageInput)
      setMessageInput('')
    }
  }

  const clearMessages = () => {
    setMessages([])
  }

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [])

  const getMessageColor = (type: Message['type']) => {
    switch (type) {
      case 'sent': return 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
      case 'received': return 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
      case 'error': return 'bg-red-500/20 border-red-500/50 text-red-300'
      case 'info': return 'bg-violet-500/20 border-violet-500/50 text-violet-300'
    }
  }

  // Quick URL presets
  const quickUrls = [
    { label: 'Echo Server (Public)', url: 'wss://echo.websocket.org' },
    { label: 'Echo Server (Local)', url: 'ws://localhost:3001/ws-echo' },
    { label: 'Postman Echo', url: 'wss://ws.postman-echo.com/raw' },
  ]

  return (
    <div className="flex flex-col h-full" style={{backgroundColor: '#1E1E1E'}}>
      {/* Connection Bar */}
      <div className="p-6 border-b border-white/10 space-y-4 bg-gradient-to-r from-[#252525] to-[#2A2A2A]">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="relative">
            <Zap className="w-5 h-5 text-cyan-400 animate-pulse" />
            <div className="absolute inset-0 bg-cyan-400/30 blur-xl"></div>
          </div>
          <h3 className="text-base font-bold bg-gradient-to-r from-cyan-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
            WebSocket Tester
          </h3>
        </div>

        {/* URL Input */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/20 rounded-lg ring-1 ring-cyan-400/30">
            <Link2 size={16} className="text-cyan-400" />
          </div>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="wss://echo.websocket.org"
            disabled={isConnected}
            className="flex-1 bg-[#2A2A2A] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all font-mono"
          />
          {!isConnected ? (
            <button
              onClick={connect}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Play size={14} />
              Connect
            </button>
          ) : (
            <button
              onClick={disconnect}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-red-500/30 hover:shadow-red-500/50 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Square size={14} />
              Disconnect
            </button>
          )}
          <div className={`px-4 py-2 rounded-xl text-xs font-bold border shadow-lg flex items-center gap-2 ${
            isConnected 
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-emerald-500/20' 
              : 'bg-gray-500/20 text-gray-400 border-gray-500/50'
          }`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`}></div>
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
          <button
            onClick={clearMessages}
            className="p-3 hover:bg-[#2A2A2A] rounded-xl transition-all border border-white/10 hover:border-red-500/50 group"
            title="Clear Messages"
          >
            <Trash2 size={16} className="text-gray-400 group-hover:text-red-400 transition-colors" />
          </button>
        </div>

        {/* Quick URL Presets */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Quick URLs:</span>
          {quickUrls.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => !isConnected && setUrl(preset.url)}
              disabled={isConnected}
              className="px-3 py-1.5 text-xs font-medium bg-[#2A2A2A] border border-white/10 rounded-lg hover:bg-[#2F2F2F] hover:border-cyan-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-gray-300 hover:text-white"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-3">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-20 h-20 bg-gradient-to-br from-[#252525] to-[#2A2A2A] rounded-2xl flex items-center justify-center border border-white/10 shadow-lg">
              <MessageCircle className="w-10 h-10 text-gray-600" />
            </div>
            <div>
              <p className="text-gray-400 font-medium mb-2">No messages yet</p>
              <p className="text-gray-600 text-sm">Connect and send a message to start</p>
            </div>
            <div className="px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
              <p className="text-xs text-cyan-300 font-medium">
                💡 Try the local echo server: ws://localhost:3001/ws-echo
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`border rounded-xl p-4 shadow-lg transition-all hover:scale-[1.01] ${getMessageColor(msg.type)}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wide flex items-center gap-2">
                  {msg.type === 'sent' ? (
                    <>
                      <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></div>
                      ↑ Sent
                    </>
                  ) : msg.type === 'received' ? (
                    <>
                      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
                      ↓ Received
                    </>
                  ) : (
                    <>
                      <div className="w-1.5 h-1.5 bg-current rounded-full"></div>
                      {msg.type}
                    </>
                  )}
                </span>
                <span className="text-xs opacity-70 font-mono">
                  {msg.timestamp.toLocaleTimeString()}
                </span>
              </div>
              <div className="text-sm break-words whitespace-pre-wrap font-mono bg-black/20 rounded-lg p-3 border border-white/5">
                {msg.content}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      {isConnected && (
        <div className="p-6 border-t border-white/10 bg-gradient-to-r from-[#252525] to-[#2A2A2A]">
          <div className="flex gap-3">
            <textarea
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage()
                }
              }}
              placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
              className="flex-1 bg-[#2A2A2A] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
              style={{
                caretColor: '#A78BFA'
              }}
              rows={3}
            />
            <button
              onClick={sendMessage}
              disabled={!messageInput.trim()}
              className="px-5 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 hover:from-violet-600 hover:via-fuchsia-600 hover:to-pink-600 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center"
            >
              <Send size={18} />
            </button>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
            <span>💡 Press</span>
            <kbd className="px-2 py-1 bg-[#2A2A2A] rounded border border-white/10 text-gray-300 font-mono font-semibold">Enter</kbd>
            <span>to send,</span>
            <kbd className="px-2 py-1 bg-[#2A2A2A] rounded border border-white/10 text-gray-300 font-mono font-semibold">Shift+Enter</kbd>
            <span>for new line</span>
          </div>
        </div>
      )}
    </div>
  )
}