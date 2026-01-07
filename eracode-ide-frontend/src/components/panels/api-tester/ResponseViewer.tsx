import { useState } from 'react'
import { Copy, Download, CheckCircle, XCircle, ChevronRight, ChevronDown } from 'lucide-react'

interface Props {
  response: string
  headers: Record<string, string>
  status: number | null
  responseTime: number | null
  error: string | null
}

export default function ResponseViewer({ response, headers, status, responseTime, error }: Props) {
  const [viewMode, setViewMode] = useState<'pretty' | 'raw' | 'headers'>('pretty')
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set())

  const copyResponse = () => {
    navigator.clipboard.writeText(response)
  }

  const downloadResponse = () => {
    const blob = new Blob([response], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `response-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getStatusColor = (code: number | null) => {
    if (!code) return 'text-red-400'
    if (code >= 200 && code < 300) return 'text-green-400'
    if (code >= 300 && code < 400) return 'text-blue-400'
    if (code >= 400 && code < 500) return 'text-yellow-400'
    return 'text-red-400'
  }

  const toggleExpand = (path: string) => {
    const newExpanded = new Set(expandedPaths)
    if (newExpanded.has(path)) {
      newExpanded.delete(path)
    } else {
      newExpanded.add(path)
    }
    setExpandedPaths(newExpanded)
  }

  const renderJsonTree = (obj: any, path = ''): JSX.Element => {
    if (obj === null) return <span className="text-gray-500">null</span>
    if (typeof obj !== 'object') {
      const color = typeof obj === 'string' ? 'text-green-400' : typeof obj === 'number' ? 'text-blue-400' : 'text-yellow-400'
      return <span className={color}>{typeof obj === 'string' ? `"${obj}"` : String(obj)}</span>
    }

    const isArray = Array.isArray(obj)
    const keys = Object.keys(obj)
    const isExpanded = expandedPaths.has(path)

    return (
      <div className="ml-4">
        <button
          onClick={() => toggleExpand(path)}
          className="flex items-center gap-1 text-text-secondary hover:text-white"
        >
          {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          <span className="text-gray-500">{isArray ? '[' : '{'}</span>
          {!isExpanded && <span className="text-text-secondary text-xs ml-1">{keys.length} items</span>}
        </button>
        {isExpanded && (
          <div className="ml-4">
            {keys.map((key, i) => (
              <div key={i} className="my-0.5">
                <span className="text-purple-400">"{key}"</span>
                <span className="text-gray-500">: </span>
                {renderJsonTree(obj[key], `${path}.${key}`)}
                {i < keys.length - 1 && <span className="text-gray-500">,</span>}
              </div>
            ))}
          </div>
        )}
        <span className="text-gray-500">{isArray ? ']' : '}'}</span>
      </div>
    )
  }

  let parsedJson: any = null
  try {
    parsedJson = JSON.parse(response)
  } catch (e) {
    // Not JSON
  }

  return (
    <div className="flex flex-col h-full bg-dark-bg">
      {/* Header */}
      <div className="px-4 py-3 border-b border-dark-border shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-white">Response</h3>
            {status !== null && (
              <div className="flex items-center gap-2">
                {status >= 200 && status < 300 ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400" />
                )}
                <span className={`text-sm font-medium ${getStatusColor(status)}`}>{status}</span>
              </div>
            )}
            {responseTime !== null && (
              <span className="text-xs text-text-secondary">{responseTime}ms</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button onClick={copyResponse} className="text-xs text-text-secondary hover:text-white flex items-center gap-1">
              <Copy className="w-3 h-3" /> Copy
            </button>
            <button onClick={downloadResponse} className="text-xs text-text-secondary hover:text-white flex items-center gap-1">
              <Download className="w-3 h-3" /> Save
            </button>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('pretty')}
            className={`px-3 py-1 text-xs rounded ${viewMode === 'pretty' ? 'bg-blue-500 text-white' : 'bg-dark-surface text-text-secondary hover:text-white'}`}
          >
            Pretty
          </button>
          <button
            onClick={() => setViewMode('raw')}
            className={`px-3 py-1 text-xs rounded ${viewMode === 'raw' ? 'bg-blue-500 text-white' : 'bg-dark-surface text-text-secondary hover:text-white'}`}
          >
            Raw
          </button>
          <button
            onClick={() => setViewMode('headers')}
            className={`px-3 py-1 text-xs rounded ${viewMode === 'headers' ? 'bg-blue-500 text-white' : 'bg-dark-surface text-text-secondary hover:text-white'}`}
          >
            Headers
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4">
        {error ? (
          <div className="text-red-400 text-sm">{error}</div>
        ) : viewMode === 'pretty' && parsedJson ? (
          <div className="text-sm font-mono text-text-secondary">
            {renderJsonTree(parsedJson)}
          </div>
        ) : viewMode === 'headers' ? (
          <div className="space-y-2">
            {Object.entries(headers).map(([key, value]) => (
              <div key={key} className="flex gap-2 text-sm">
                <span className="text-purple-400 font-mono">{key}:</span>
                <span className="text-text-secondary font-mono">{value}</span>
              </div>
            ))}
          </div>
        ) : (
          <pre className="text-sm font-mono text-text-secondary whitespace-pre-wrap">{response}</pre>
        )}
      </div>
    </div>
  )
}
