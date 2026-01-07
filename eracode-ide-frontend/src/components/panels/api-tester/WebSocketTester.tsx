import { useState, useRef, useEffect } from 'react'
import { Link2, Send, Trash2, Play, Square } from 'lucide-react'

interface Message {
  id: string
  type: 'sent' | 'received' | 'error' | 'info'
  content: string
  timestamp: Date
}

export default function WebSocketTester() {
  const [url, setUrl] = useState('wss://echo.websocket.org')
  const [isConnected, setIsConnected] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [messageInput, setMessageInput] = useState('')
  const wsRef = useRef<WebSocket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const addMessage = (type: Message['type'], content: string) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date()
    }])
  }

  const connect = () => {
    try {
      const ws = new WebSocket(url)
      
      ws.onopen = () => {
        setIsConnected(true)
        addMessage('info', '✅ Connected to WebSocket server')
      }

      ws.onmessage = (event) => {
        addMessage('received', event.data)
      }

      ws.onerror = (error) => {
        addMessage('error', '❌ WebSocket error occurred')
      }

      ws.onclose = () => {
        setIsConnected(false)
        addMessage('info', '🔌 Disconnected from server')
      }

      wsRef.current = ws
    } catch (error: any) {
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [])

  const getMessageColor = (type: Message['type']) => {
    switch (type) {
      case 'sent': return 'bg-blue-500/10 border-blue-500/30 text-blue-400'
      case 'received': return 'bg-green-500/10 border-green-500/30 text-green-400'
      case 'error': return 'bg-red-500/10 border-red-500/30 text-red-400'
      case 'info': return 'bg-gray-500/10 border-gray-500/30 text-gray-400'
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Connection Bar */}
      <div className="p-3 border-b border-dark-border shrink-0">
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="wss://echo.websocket.org"
            disabled={isConnected}
            className="flex-1 bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm text-white placeholder-text-secondary disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          {!isConnected ? (
            <button
              onClick={connect}
              className="bg-green-600 hover:bg-green-700 text-white rounded px-6 py-2 text-sm font-medium flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              Connect
            </button>
          ) : (
            <button
              onClick={disconnect}
              className="bg-red-600 hover:bg-red-700 text-white rounded px-6 py-2 text-sm font-medium flex items-center gap-2"
            >
              <Square className="w-4 h-4" />
              Disconnect
            </button>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
            <span className="text-xs text-text-secondary">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          
          <button
            onClick={clearMessages}
            className="text-xs text-text-secondary hover:text-white flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3" />
            Clear
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-dark-bg">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-text-secondary text-sm">
            No messages yet. Connect and send a message to start.
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`p-3 rounded border ${getMessageColor(msg.type)}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold uppercase">
                  {msg.type === 'sent' ? '↑ Sent' : msg.type === 'received' ? '↓ Received' : msg.type}
                </span>
                <span className="text-xs opacity-60">
                  {msg.timestamp.toLocaleTimeString()}
                </span>
              </div>
              <pre className="text-sm font-mono whitespace-pre-wrap break-all">
                {msg.content}
              </pre>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      {isConnected && (
        <div className="p-3 border-t border-dark-border shrink-0">
          <div className="flex gap-2">
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
              className="flex-1 bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm text-white placeholder-text-secondary resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
            />
            <button
              onClick={sendMessage}
              disabled={!messageInput.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded px-4 text-sm font-medium flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Send
            </button>
          </div>
          <p className="text-xs text-text-secondary mt-2">
            💡 Try echoing messages with wss://echo.websocket.org
          </p>
        </div>
      )}
    </div>
  )
}
