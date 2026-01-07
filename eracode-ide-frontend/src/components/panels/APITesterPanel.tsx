import { useState } from 'react'
import { 
  Send, 
  Plus, 
  Trash2, 
  Copy, 
  Download,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Zap,
  Activity,
  FileJson,
  Link2,
  Play,
  Square
} from 'lucide-react'

// Import sub-components
import RestTester from './api-tester/RestTester'
import WebSocketTester from './api-tester/WebSocketTester'
import PerformanceTester from './api-tester/PerformanceTester'
import SchemaValidator from './api-tester/SchemaValidator'
import ResponseViewer from './api-tester/ResponseViewer'

type TesterMode = 'rest' | 'websocket' | 'performance' | 'schema'

export default function APITesterPanel() {
  const [mode, setMode] = useState<TesterMode>('rest')

  return (
    <div className="flex flex-col h-full w-full bg-dark-surface overflow-hidden">
      {/* Header with Mode Selector */}
      <div className="px-4 py-3 border-b border-dark-border shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            🧪 API Tester
          </h2>
        </div>

        {/* Mode Tabs */}
        <div className="flex gap-1 bg-dark-bg rounded-lg p-1">
          <button
            onClick={() => setMode('rest')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded text-xs font-medium transition-all ${
              mode === 'rest'
                ? 'bg-blue-500 text-white shadow-lg'
                : 'text-text-secondary hover:text-white hover:bg-dark-surface'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            REST API
          </button>
          
          <button
            onClick={() => setMode('websocket')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded text-xs font-medium transition-all ${
              mode === 'websocket'
                ? 'bg-green-500 text-white shadow-lg'
                : 'text-text-secondary hover:text-white hover:bg-dark-surface'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            WebSocket
          </button>
          
          <button
            onClick={() => setMode('performance')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded text-xs font-medium transition-all ${
              mode === 'performance'
                ? 'bg-yellow-500 text-white shadow-lg'
                : 'text-text-secondary hover:text-white hover:bg-dark-surface'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Performance
          </button>
          
          <button
            onClick={() => setMode('schema')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded text-xs font-medium transition-all ${
              mode === 'schema'
                ? 'bg-purple-500 text-white shadow-lg'
                : 'text-text-secondary hover:text-white hover:bg-dark-surface'
            }`}
          >
            <FileJson className="w-3.5 h-3.5" />
            Schema
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {mode === 'rest' && <RestTester />}
        {mode === 'websocket' && <WebSocketTester />}
        {mode === 'performance' && <PerformanceTester />}
        {mode === 'schema' && <SchemaValidator />}
      </div>
    </div>
  )
}
