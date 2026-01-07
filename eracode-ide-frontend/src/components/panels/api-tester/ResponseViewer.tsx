import { useState } from 'react'
import { Copy, Download, CheckCircle, XCircle, ChevronRight, ChevronDown, Sparkles, Clock } from 'lucide-react'

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
  const [copied, setCopied] = useState(false)

  const copyResponse = () => {
    navigator.clipboard.writeText(response)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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
    if (code >= 200 && code < 300) return 'text-emerald-400'
    if (code >= 300 && code < 400) return 'text-cyan-400'
    if (code >= 400 && code < 500) return 'text-amber-400'
    return 'text-red-400'
  }

  const getStatusBgColor = (code: number | null) => {
    if (!code) return 'bg-red-500/20 border-red-500/50'
    if (code >= 200 && code < 300) return 'bg-emerald-500/20 border-emerald-500/50'
    if (code >= 300 && code < 400) return 'bg-cyan-500/20 border-cyan-500/50'
    if (code >= 400 && code < 500) return 'bg-amber-500/20 border-amber-500/50'
    return 'bg-red-500/20 border-red-500/50'
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
      const color = typeof obj === 'string' ? 'text-emerald-400' : typeof obj === 'number' ? 'text-cyan-400' : 'text-amber-400'
      return <span className={color}>{typeof obj === 'string' ? `"${obj}"` : String(obj)}</span>
    }

    const isArray = Array.isArray(obj)
    const keys = Object.keys(obj)
    const isExpanded = expandedPaths.has(path)

    return (
      <div className="ml-4">
        <button
          onClick={() => toggleExpand(path)}
          className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors group"
        >
          {isExpanded ? <ChevronDown className="w-3 h-3 text-violet-400" /> : <ChevronRight className="w-3 h-3 text-violet-400" />}
          <span className="text-gray-500">{isArray ? '[' : '{'}</span>
          {!isExpanded && <span className="text-gray-500 text-xs ml-1 group-hover:text-gray-400">{keys.length} items</span>}
        </button>
        {isExpanded && (
          <div className="ml-4 border-l border-white/5 pl-3 py-1">
            {keys.map((key, i) => (
              <div key={i} className="my-1 hover:bg-[#2A2A2A] rounded px-2 py-0.5 transition-colors">
                <span className="text-fuchsia-400 font-semibold">"{key}"</span>
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
    <div className="flex flex-col h-full" style={{backgroundColor: '#1E1E1E'}}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/10 shrink-0 bg-gradient-to-r from-[#252525] to-[#2A2A2A]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">Response</h3>
            </div>
            {status !== null && (
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${getStatusBgColor(status)}`}>
                {status >= 200 && status < 300 ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400" />
                )}
                <span className={`text-sm font-bold ${getStatusColor(status)}`}>{status}</span>
              </div>
            )}
            {responseTime !== null && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#2A2A2A] border border-white/10">
                <Clock className="w-3.5 h-3.5 text-violet-400" />
                <span className="text-xs font-semibold text-gray-300">{responseTime}ms</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={copyResponse} 
              className="px-3 py-2 text-xs font-medium text-gray-300 hover:text-white bg-[#2A2A2A] hover:bg-[#2F2F2F] rounded-lg flex items-center gap-2 transition-all border border-white/10 hover:border-cyan-500/50"
            >
              <Copy className="w-3.5 h-3.5" />
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button 
              onClick={downloadResponse} 
              className="px-3 py-2 text-xs font-medium text-gray-300 hover:text-white bg-[#2A2A2A] hover:bg-[#2F2F2F] rounded-lg flex items-center gap-2 transition-all border border-white/10 hover:border-violet-500/50"
            >
              <Download className="w-3.5 h-3.5" />
              Save
            </button>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('pretty')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              viewMode === 'pretty' 
                ? 'bg-gradient-to-r from-cyan-500 to-violet-500 text-white shadow-lg shadow-cyan-500/30' 
                : 'bg-[#2A2A2A] text-gray-400 hover:text-white hover:bg-[#2F2F2F] border border-white/10'
            }`}
          >
            Pretty
          </button>
          <button
            onClick={() => setViewMode('raw')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              viewMode === 'raw' 
                ? 'bg-gradient-to-r from-cyan-500 to-violet-500 text-white shadow-lg shadow-cyan-500/30' 
                : 'bg-[#2A2A2A] text-gray-400 hover:text-white hover:bg-[#2F2F2F] border border-white/10'
            }`}
          >
            Raw
          </button>
          <button
            onClick={() => setViewMode('headers')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              viewMode === 'headers' 
                ? 'bg-gradient-to-r from-cyan-500 to-violet-500 text-white shadow-lg shadow-cyan-500/30' 
                : 'bg-[#2A2A2A] text-gray-400 hover:text-white hover:bg-[#2F2F2F] border border-white/10'
            }`}
          >
            Headers
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6">
        {error ? (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
            <XCircle className="w-5 h-5 text-red-400 shrink-0" />
            <span className="text-red-300 text-sm font-medium">{error}</span>
          </div>
        ) : viewMode === 'pretty' && parsedJson ? (
          <div className="bg-[#252525] rounded-xl p-5 border border-white/10 shadow-lg">
            <div className="text-sm font-mono text-gray-300">
              {renderJsonTree(parsedJson)}
            </div>
          </div>
        ) : viewMode === 'headers' ? (
          <div className="space-y-2">
            {Object.entries(headers).length > 0 ? (
              Object.entries(headers).map(([key, value]) => (
                <div 
                  key={key} 
                  className="flex gap-3 p-3 rounded-lg bg-[#252525] border border-white/10 hover:border-cyan-500/30 transition-colors group"
                >
                  <span className="text-fuchsia-400 font-mono font-semibold min-w-[120px]">{key}:</span>
                  <span className="text-gray-300 font-mono flex-1 break-all group-hover:text-white transition-colors">{value}</span>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-[#252525] rounded-2xl flex items-center justify-center border border-white/10">
                  <Sparkles className="w-8 h-8 text-gray-600" />
                </div>
                <p className="text-gray-500 text-sm">No headers available</p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-[#252525] rounded-xl p-5 border border-white/10 shadow-lg overflow-x-auto">
            <pre className="text-sm font-mono text-gray-300 whitespace-pre-wrap">{response}</pre>
          </div>
        )}
      </div>
    </div>
  )
}