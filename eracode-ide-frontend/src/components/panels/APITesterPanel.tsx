import { useState } from 'react'
import { 
  Send, 
  Plus, 
  Trash2, 
  Copy, 
  Download,
  ChevronDown,
  Clock,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react'

interface Header {
  key: string
  value: string
  enabled: boolean
}

interface RequestHistory {
  id: string
  method: string
  url: string
  status: number | null
  time: number | null
  timestamp: Date
}

export default function APITesterPanel() {
  // Request state
  const [method, setMethod] = useState('GET')
  const [url, setUrl] = useState('http://localhost:3000/api/')
  const [activeTab, setActiveTab] = useState<'headers' | 'body' | 'auth' | 'params'>('headers')
  
  // Headers
  const [headers, setHeaders] = useState<Header[]>([
    { key: 'Content-Type', value: 'application/json', enabled: true }
  ])
  
  // Body
  const [bodyType, setBodyType] = useState<'json' | 'form' | 'raw'>('json')
  const [bodyContent, setBodyContent] = useState('{\n  \n}')
  
  // Auth
  const [authType, setAuthType] = useState<'none' | 'bearer' | 'basic'>('none')
  const [authToken, setAuthToken] = useState('')
  
  // Query params
  const [params, setParams] = useState<Header[]>([])
  
  // Response state
  const [response, setResponse] = useState<any>(null)
  const [responseBody, setResponseBody] = useState('')
  const [responseHeaders, setResponseHeaders] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<number | null>(null)
  const [responseTime, setResponseTime] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // History
  const [history, setHistory] = useState<RequestHistory[]>([])
  const [showHistory, setShowHistory] = useState(false)

  // Add header
  const addHeader = () => {
    setHeaders([...headers, { key: '', value: '', enabled: true }])
  }

  // Remove header
  const removeHeader = (index: number) => {
    setHeaders(headers.filter((_, i) => i !== index))
  }

  // Update header
  const updateHeader = (index: number, field: 'key' | 'value' | 'enabled', value: any) => {
    const newHeaders = [...headers]
    newHeaders[index][field] = value
    setHeaders(newHeaders)
  }

  // Add param
  const addParam = () => {
    setParams([...params, { key: '', value: '', enabled: true }])
  }

  // Remove param
  const removeParam = (index: number) => {
    setParams(params.filter((_, i) => i !== index))
  }

  // Update param
  const updateParam = (index: number, field: 'key' | 'value' | 'enabled', value: any) => {
    const newParams = [...params]
    newParams[index][field] = value
    setParams(newParams)
  }

  // Build URL with params
  const buildUrl = () => {
    const enabledParams = params.filter(p => p.enabled && p.key)
    if (enabledParams.length === 0) return url
    
    const baseUrl = url.split('?')[0]
    const queryString = enabledParams
      .map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
      .join('&')
    
    return `${baseUrl}?${queryString}`
  }

  // Send request
  const handleSend = async () => {
    setLoading(true)
    setError(null)
    const startTime = Date.now()

    try {
      // Build headers
      const requestHeaders: Record<string, string> = {}
      headers
        .filter(h => h.enabled && h.key)
        .forEach(h => {
          requestHeaders[h.key] = h.value
        })

      // Add auth header
      if (authType === 'bearer' && authToken) {
        requestHeaders['Authorization'] = `Bearer ${authToken}`
      } else if (authType === 'basic' && authToken) {
        requestHeaders['Authorization'] = `Basic ${btoa(authToken)}`
      }

      // Build request options
      const options: RequestInit = {
        method,
        headers: requestHeaders
      }

      // Add body for POST/PUT/PATCH
      if (['POST', 'PUT', 'PATCH'].includes(method)) {
        if (bodyType === 'json') {
          options.body = bodyContent
        }
      }

      // Send request
      const finalUrl = buildUrl()
      const res = await fetch(finalUrl, options)
      const endTime = Date.now()

      // Parse response
      const contentType = res.headers.get('content-type')
      let data
      
      if (contentType?.includes('application/json')) {
        data = await res.json()
        setResponseBody(JSON.stringify(data, null, 2))
      } else {
        data = await res.text()
        setResponseBody(data)
      }

      // Extract headers
      const resHeaders: Record<string, string> = {}
      res.headers.forEach((value, key) => {
        resHeaders[key] = value
      })

      // Update state
      setResponse(data)
      setResponseHeaders(resHeaders)
      setStatus(res.status)
      setResponseTime(endTime - startTime)

      // Add to history
      const historyItem: RequestHistory = {
        id: Date.now().toString(),
        method,
        url: finalUrl,
        status: res.status,
        time: endTime - startTime,
        timestamp: new Date()
      }
      setHistory([historyItem, ...history.slice(0, 9)]) // Keep last 10

    } catch (err: any) {
      setError(err.message || 'Request failed')
      setStatus(null)
      setResponseTime(Date.now() - startTime)
      
      // Add failed request to history
      const historyItem: RequestHistory = {
        id: Date.now().toString(),
        method,
        url: buildUrl(),
        status: null,
        time: Date.now() - startTime,
        timestamp: new Date()
      }
      setHistory([historyItem, ...history.slice(0, 9)])
    } finally {
      setLoading(false)
    }
  }

  // Copy response
  const copyResponse = () => {
    navigator.clipboard.writeText(responseBody)
  }

  // Download response
  const downloadResponse = () => {
    const blob = new Blob([responseBody], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `response-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Get status color
  const getStatusColor = (code: number | null) => {
    if (!code) return 'text-red-400'
    if (code >= 200 && code < 300) return 'text-green-400'
    if (code >= 300 && code < 400) return 'text-blue-400'
    if (code >= 400 && code < 500) return 'text-yellow-400'
    return 'text-red-400'
  }

  // Get method color
  const getMethodColor = (m: string) => {
    switch (m) {
      case 'GET': return 'text-green-400 bg-green-400/10'
      case 'POST': return 'text-yellow-400 bg-yellow-400/10'
      case 'PUT': return 'text-blue-400 bg-blue-400/10'
      case 'PATCH': return 'text-purple-400 bg-purple-400/10'
      case 'DELETE': return 'text-red-400 bg-red-400/10'
      default: return 'text-gray-400 bg-gray-400/10'
    }
  }

  return (
    <div className="flex flex-col h-full bg-dark-surface">
      {/* Header */}
      <div className="px-4 py-3 border-b border-dark-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            🧪 API Tester
          </h2>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="text-xs text-text-secondary hover:text-white flex items-center gap-1"
          >
            <Clock className="w-3 h-3" />
            History
          </button>
        </div>

        {/* Method + URL */}
        <div className="flex gap-2">
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className={`w-28 px-3 py-2 rounded text-xs font-medium border border-dark-border ${getMethodColor(method)} focus:outline-none focus:ring-2 focus:ring-blue-500`}
          >
            <option>GET</option>
            <option>POST</option>
            <option>PUT</option>
            <option>PATCH</option>
            <option>DELETE</option>
            <option>HEAD</option>
            <option>OPTIONS</option>
          </select>

          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter request URL..."
            className="flex-1 bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm text-white placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          />

          <button
            onClick={handleSend}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded px-6 py-2 text-sm font-medium flex items-center gap-2 transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send
              </>
            )}
          </button>
        </div>
      </div>

      {/* History Sidebar */}
      {showHistory && (
        <div className="absolute right-0 top-16 w-64 bg-dark-bg border-l border-dark-border h-[calc(100%-4rem)] z-10 overflow-y-auto">
          <div className="p-3 border-b border-dark-border flex items-center justify-between">
            <h3 className="text-sm font-semibold">Request History</h3>
            <button
              onClick={() => setHistory([])}
              className="text-xs text-red-400 hover:text-red-300"
            >
              Clear
            </button>
          </div>
          <div className="divide-y divide-dark-border">
            {history.length === 0 ? (
              <div className="p-4 text-center text-text-secondary text-xs">
                No history yet
              </div>
            ) : (
              history.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setMethod(item.method)
                    setUrl(item.url)
                    setShowHistory(false)
                  }}
                  className="w-full p-3 text-left hover:bg-dark-surface transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-medium ${getMethodColor(item.method).split(' ')[0]}`}>
                      {item.method}
                    </span>
                    {item.status !== null ? (
                      <span className={`text-xs ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    ) : (
                      <span className="text-xs text-red-400">Failed</span>
                    )}
                  </div>
                  <div className="text-xs text-text-secondary truncate mb-1">
                    {item.url}
                  </div>
                  <div className="text-xs text-text-secondary flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    {item.time}ms
                    <span>•</span>
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-dark-border px-4">
        {(['params', 'headers', 'body', 'auth'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-text-secondary hover:text-white'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Params Tab */}
        {activeTab === 'params' && (
          <div className="p-4 space-y-2">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-text-secondary">Query Parameters</h3>
              <button
                onClick={addParam}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                Add
              </button>
            </div>
            
            {params.length === 0 ? (
              <div className="text-center py-8 text-text-secondary text-sm">
                No parameters yet. Click "Add" to create one.
              </div>
            ) : (
              params.map((param, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={param.enabled}
                    onChange={(e) => updateParam(index, 'enabled', e.target.checked)}
                    className="w-4 h-4"
                  />
                  <input
                    type="text"
                    value={param.key}
                    onChange={(e) => updateParam(index, 'key', e.target.value)}
                    placeholder="Key"
                    className="flex-1 bg-dark-bg border border-dark-border rounded px-3 py-1.5 text-sm"
                  />
                  <input
                    type="text"
                    value={param.value}
                    onChange={(e) => updateParam(index, 'value', e.target.value)}
                    placeholder="Value"
                    className="flex-1 bg-dark-bg border border-dark-border rounded px-3 py-1.5 text-sm"
                  />
                  <button
                    onClick={() => removeParam(index)}
                    className="text-red-400 hover:text-red-300 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Headers Tab */}
        {activeTab === 'headers' && (
          <div className="p-4 space-y-2">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-text-secondary">Request Headers</h3>
              <button
                onClick={addHeader}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                Add
              </button>
            </div>
            
            {headers.map((header, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={header.enabled}
                  onChange={(e) => updateHeader(index, 'enabled', e.target.checked)}
                  className="w-4 h-4"
                />
                <input
                  type="text"
                  value={header.key}
                  onChange={(e) => updateHeader(index, 'key', e.target.value)}
                  placeholder="Header name"
                  className="flex-1 bg-dark-bg border border-dark-border rounded px-3 py-1.5 text-sm"
                />
                <input
                  type="text"
                  value={header.value}
                  onChange={(e) => updateHeader(index, 'value', e.target.value)}
                  placeholder="Header value"
                  className="flex-1 bg-dark-bg border border-dark-border rounded px-3 py-1.5 text-sm"
                />
                <button
                  onClick={() => removeHeader(index)}
                  className="text-red-400 hover:text-red-300 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Body Tab */}
        {activeTab === 'body' && (
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-text-secondary">Body Type:</label>
              <select
                value={bodyType}
                onChange={(e) => setBodyType(e.target.value as any)}
                className="bg-dark-bg border border-dark-border rounded px-3 py-1.5 text-sm"
              >
                <option value="json">JSON</option>
                <option value="form">Form Data</option>
                <option value="raw">Raw</option>
              </select>
            </div>

            {bodyType === 'json' && (
              <textarea
                value={bodyContent}
                onChange={(e) => setBodyContent(e.target.value)}
                placeholder='{\n  "key": "value"\n}'
                className="w-full h-64 bg-dark-bg border border-dark-border rounded p-3 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}

            {bodyType === 'raw' && (
              <textarea
                value={bodyContent}
                onChange={(e) => setBodyContent(e.target.value)}
                placeholder="Enter raw body content..."
                className="w-full h-64 bg-dark-bg border border-dark-border rounded p-3 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
          </div>
        )}

        {/* Auth Tab */}
        {activeTab === 'auth' && (
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-text-secondary">Auth Type:</label>
              <select
                value={authType}
                onChange={(e) => setAuthType(e.target.value as any)}
                className="bg-dark-bg border border-dark-border rounded px-3 py-1.5 text-sm"
              >
                <option value="none">No Auth</option>
                <option value="bearer">Bearer Token</option>
                <option value="basic">Basic Auth</option>
              </select>
            </div>

            {authType === 'bearer' && (
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-2">
                  Bearer Token
                </label>
                <input
                  type="text"
                  value={authToken}
                  onChange={(e) => setAuthToken(e.target.value)}
                  placeholder="Enter your token..."
                  className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm"
                />
              </div>
            )}

            {authType === 'basic' && (
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-2">
                  Username:Password
                </label>
                <input
                  type="text"
                  value={authToken}
                  onChange={(e) => setAuthToken(e.target.value)}
                  placeholder="username:password"
                  className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Response Section */}
      {(response !== null || error) && (
        <div className="border-t border-dark-border bg-dark-bg">
          {/* Response Header */}
          <div className="px-4 py-3 border-b border-dark-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-semibold">Response</h3>
                {status !== null && (
                  <div className="flex items-center gap-2">
                    {status >= 200 && status < 300 ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400" />
                    )}
                    <span className={`text-sm font-medium ${getStatusColor(status)}`}>
                      {status}
                    </span>
                  </div>
                )}
                {responseTime !== null && (
                  <span className="text-xs text-text-secondary">
                    {responseTime}ms
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={copyResponse}
                  className="text-xs text-text-secondary hover:text-white flex items-center gap-1"
                  title="Copy response"
                >
                  <Copy className="w-3 h-3" />
                  Copy
                </button>
                <button
                  onClick={downloadResponse}
                  className="text-xs text-text-secondary hover:text-white flex items-center gap-1"
                  title="Download response"
                >
                  <Download className="w-3 h-3" />
                  Save
                </button>
              </div>
            </div>
          </div>

          {/* Response Body */}
          <div className="p-4 max-h-64 overflow-y-auto">
            {error ? (
              <div className="text-red-400 text-sm">{error}</div>
            ) : (
              <pre className="text-sm font-mono text-text-secondary whitespace-pre-wrap">
                {responseBody}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
