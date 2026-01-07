import { useState } from 'react'
import { Zap, Play, Square, TrendingUp, AlertCircle } from 'lucide-react'

interface TestResult {
  requestNumber: number
  status: number | null
  responseTime: number
  success: boolean
  error?: string
}

export default function PerformanceTester() {
  // ✅ Backend Proxy Configuration
  const PROXY_URL = 'http://localhost:3001/api/proxy-request'
  const [useProxy, setUseProxy] = useState(true)
  
  const [url, setUrl] = useState('https://jsonplaceholder.typicode.com/posts/1')
  const [totalRequests, setTotalRequests] = useState(10)
  const [concurrency, setConcurrency] = useState(1)
  const [results, setResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState(0)

  const runTest = async () => {
    setIsRunning(true)
    setResults([])
    setProgress(0)

    const allResults: TestResult[] = []
    let completed = 0

    // ✅ UPDATED: Use backend proxy for requests
    const runRequest = async (requestNumber: number): Promise<TestResult> => {
      const startTime = Date.now()

      try {
        if (useProxy) {
          // ✅ Use backend proxy - bypasses CORS
          const proxyResponse = await fetch(PROXY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              method: 'GET',
              url: url,
              headers: {},
              body: ''
            })
          })

          const responseTime = Date.now() - startTime

          if (!proxyResponse.ok) {
            const errorData = await proxyResponse.json()
            return {
              requestNumber,
              status: null,
              responseTime,
              success: false,
              error: errorData.error || 'Proxy error'
            }
          }

          const proxyData = await proxyResponse.json()

          return {
            requestNumber,
            status: proxyData.status,
            responseTime,
            success: proxyData.status >= 200 && proxyData.status < 400
          }

        } else {
          // Direct fetch (will have CORS issues with external URLs)
          const res = await fetch(url)
          const responseTime = Date.now() - startTime

          return {
            requestNumber,
            status: res.status,
            responseTime,
            success: res.ok
          }
        }

      } catch (error: any) {
        return {
          requestNumber,
          status: null,
          responseTime: Date.now() - startTime,
          success: false,
          error: error.message || 'Request failed'
        }
      }
    }

    // Run in batches based on concurrency
    for (let i = 0; i < totalRequests; i += concurrency) {
      const batch = []
      for (let j = 0; j < concurrency && i + j < totalRequests; j++) {
        batch.push(runRequest(i + j + 1))
      }

      const batchResults = await Promise.all(batch)
      allResults.push(...batchResults)
      completed += batchResults.length
      setProgress((completed / totalRequests) * 100)
      setResults([...allResults])
    }

    setIsRunning(false)
  }

  const stopTest = () => {
    setIsRunning(false)
  }

  const stats = {
    total: results.length,
    success: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    avgTime: results.length > 0
      ? Math.round(results.reduce((sum, r) => sum + r.responseTime, 0) / results.length)
      : 0,
    minTime: results.length > 0 ? Math.min(...results.map(r => r.responseTime)) : 0,
    maxTime: results.length > 0 ? Math.max(...results.map(r => r.responseTime)) : 0
  }

  return (
    <div className="h-full flex flex-col bg-dark-surface">
      <div className="flex items-center gap-2 p-4 border-b border-dark-border">
        <Zap className="w-5 h-5 text-yellow-400" />
        <h2 className="text-lg font-semibold text-white">Performance & Load Testing</h2>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* ✅ Backend Proxy Toggle */}
        <div className="bg-dark-bg border border-dark-border rounded-lg p-3">
          <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-dark-surface p-2 rounded transition-colors">
            <input
              type="checkbox"
              checked={useProxy}
              onChange={(e) => setUseProxy(e.target.checked)}
              className="w-4 h-4 accent-blue-500 cursor-pointer"
              disabled={isRunning}
            />
            <div className="flex items-center gap-2 flex-1">
              <span className={useProxy ? 'text-white font-medium' : 'text-text-secondary'}>
                🔌 Use Backend Proxy
              </span>
              <span className="text-xs text-text-secondary">
                (Required for external URLs & CORS bypass)
              </span>
            </div>
            {useProxy ? (
              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                ✅ Enabled
              </span>
            ) : (
              <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">
                ⚠️ CORS Issues Expected
              </span>
            )}
          </label>
        </div>

        {/* Configuration */}
        <div className="bg-dark-bg border border-dark-border rounded-lg p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Target URL
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isRunning}
              placeholder="https://api.example.com/endpoint"
              className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Total Requests
              </label>
              <input
                type="number"
                value={totalRequests}
                onChange={(e) => setTotalRequests(Number(e.target.value))}
                disabled={isRunning}
                min={1}
                max={1000}
                className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Concurrency
              </label>
              <input
                type="number"
                value={concurrency}
                onChange={(e) => setConcurrency(Number(e.target.value))}
                disabled={isRunning}
                min={1}
                max={50}
                className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {isRunning ? (
            <button
              onClick={stopTest}
              className="w-full bg-red-600 hover:bg-red-700 text-white rounded px-4 py-2 font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <Square className="w-4 h-4" />
              Stop Test
            </button>
          ) : (
            <button
              onClick={runTest}
              disabled={!url}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded px-4 py-2 font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <Play className="w-4 h-4" />
              Start Performance Test
            </button>
          )}

          {isRunning && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">Progress</span>
                <span className="text-white font-medium">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-dark-surface rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-500 h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        {results.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-text-secondary">Success Rate</span>
                <TrendingUp className="w-4 h-4 text-green-400" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {Math.round((stats.success / stats.total) * 100)}%
              </div>
              <div className="text-xs text-text-secondary">
                {stats.success}/{stats.total} requests
              </div>
            </div>

            <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-text-secondary">Avg Time</span>
                <Zap className="w-4 h-4 text-yellow-400" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {stats.avgTime}ms
              </div>
              <div className="text-xs text-text-secondary">
                Min: {stats.minTime}ms, Max: {stats.maxTime}ms
              </div>
            </div>

            <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-text-secondary">Failed</span>
                <AlertCircle className="w-4 h-4 text-red-400" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {stats.failed}
              </div>
              <div className="text-xs text-text-secondary">
                {Math.round((stats.failed / stats.total) * 100)}% error rate
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        <div className="bg-dark-bg border border-dark-border rounded-lg overflow-hidden">
          <div className="p-3 border-b border-dark-border">
            <h3 className="text-sm font-semibold text-white">Request Results</h3>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {results.length === 0 ? (
              <div className="p-8 text-center text-text-secondary">
                Configure and start a performance test
              </div>
            ) : (
              <div className="divide-y divide-dark-border">
                {results.map((result) => (
                  <div
                    key={result.requestNumber}
                    className="p-3 flex items-center justify-between hover:bg-dark-surface transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-text-secondary font-mono">
                        #{result.requestNumber}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded font-medium ${
                          result.success
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {result.status || 'ERR'}
                      </span>
                      {result.error && (
                        <span className="text-xs text-red-400 truncate max-w-xs">
                          {result.error}
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-white font-mono">
                      {result.responseTime}ms
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
