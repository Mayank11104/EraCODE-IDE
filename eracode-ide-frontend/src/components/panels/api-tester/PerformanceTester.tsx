import { useState } from 'react'
import { Zap, Play, Square, TrendingUp, AlertCircle, Activity } from 'lucide-react'

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
    <div className="h-full flex flex-col relative overflow-hidden" style={{backgroundColor: '#1E1E1E'}}>
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-cyan-400/8 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-violet-400/8 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-fuchsia-400/5 rounded-full blur-3xl"></div>
      </div>

      {/* Header with Gradient */}
      <div className="relative flex items-center gap-3 px-6 py-5 border-b border-white/5 bg-gradient-to-r from-[#252525] to-[#2A2A2A] backdrop-blur-xl">
        <div className="relative">
          <Zap className="w-6 h-6 text-cyan-400 animate-pulse" />
          <div className="absolute inset-0 bg-cyan-400/30 blur-xl"></div>
        </div>
        <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
          Performance & Load Testing
        </h2>
        <div className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-[#2A2A2A] rounded-full border border-cyan-500/30">
          <Activity className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-medium text-gray-300">Live Monitor</span>
        </div>
      </div>

      <div className="relative flex-1 overflow-auto p-6 space-y-6">
        {/* Backend Proxy Toggle - Enhanced */}
        <div className="group bg-gradient-to-br from-[#252525] to-[#2A2A2A] backdrop-blur-xl border border-white/10 rounded-2xl p-4 hover:border-cyan-500/40 transition-all duration-300 shadow-lg hover:shadow-cyan-500/10">
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                checked={useProxy}
                onChange={(e) => setUseProxy(e.target.checked)}
                className="peer sr-only"
                disabled={isRunning}
              />
              <div className="w-14 h-7 bg-[#2A2A2A] peer-checked:bg-gradient-to-r peer-checked:from-cyan-500 peer-checked:to-violet-500 rounded-full transition-all duration-300 shadow-inner border border-white/10"></div>
              <div className="absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-all duration-300 peer-checked:translate-x-7 shadow-lg"></div>
            </div>
            <div className="flex items-center gap-3 flex-1">
              <span className={`text-base font-semibold transition-colors ${useProxy ? 'text-white' : 'text-gray-500'}`}>
                🔌 Backend Proxy
              </span>
              <span className="text-xs text-gray-400 bg-[#2A2A2A] px-2.5 py-1 rounded-lg border border-white/10">
                Bypasses CORS restrictions
              </span>
            </div>
            {useProxy ? (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/20 rounded-lg border border-cyan-400/50 shadow-lg shadow-cyan-500/20">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                <span className="text-xs font-semibold text-cyan-300">Active</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 rounded-lg border border-red-500/50">
                <AlertCircle className="w-3 h-3 text-red-400" />
                <span className="text-xs font-semibold text-red-300">CORS Risk</span>
              </div>
            )}
          </label>
        </div>

        {/* Configuration Card */}
        <div className="bg-gradient-to-br from-[#252525] to-[#2A2A2A] backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-5 shadow-2xl">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1 h-6 bg-gradient-to-b from-cyan-400 to-violet-500 rounded-full"></div>
            <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wide">Test Configuration</h3>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-cyan-400 rounded-full"></span>
              Target URL
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isRunning}
              placeholder="https://api.example.com/endpoint"
              className="w-full bg-[#2A2A2A] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder-gray-600 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-200 shadow-inner font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-violet-400 rounded-full"></span>
                Total Requests
              </label>
              <input
                type="number"
                value={totalRequests}
                onChange={(e) => setTotalRequests(Number(e.target.value))}
                disabled={isRunning}
                min={1}
                max={1000}
                className="w-full bg-[#2A2A2A] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all duration-200 shadow-inner font-semibold"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-fuchsia-400 rounded-full"></span>
                Concurrency
              </label>
              <input
                type="number"
                value={concurrency}
                onChange={(e) => setConcurrency(Number(e.target.value))}
                disabled={isRunning}
                min={1}
                max={50}
                className="w-full bg-[#2A2A2A] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 focus:border-fuchsia-500/50 transition-all duration-200 shadow-inner font-semibold"
              />
            </div>
          </div>

          {isRunning ? (
            <button
              onClick={stopTest}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl px-6 py-4 font-bold flex items-center justify-center gap-3 transition-all duration-200 shadow-lg shadow-red-500/20 hover:shadow-red-500/40 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Square className="w-5 h-5" />
              Stop Test
            </button>
          ) : (
            <button
              onClick={runTest}
              disabled={!url}
              className="w-full bg-gradient-to-r from-cyan-500 via-violet-500 to-fuchsia-500 hover:from-cyan-600 hover:via-violet-600 hover:to-fuchsia-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl px-6 py-4 font-bold flex items-center justify-center gap-3 transition-all duration-200 shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 disabled:shadow-none hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              <Play className="w-5 h-5 relative z-10" />
              <span className="relative z-10">Start Performance Test</span>
            </button>
          )}

          {isRunning && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400 font-medium">Progress</span>
                <span className="text-white font-bold text-base">{Math.round(progress)}%</span>
              </div>
              <div className="relative w-full bg-[#2A2A2A] rounded-full h-3 overflow-hidden border border-white/10 shadow-inner">
                <div
                  className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 transition-all duration-300 rounded-full shadow-lg"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 animate-pulse"></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        {results.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            <div className="group bg-gradient-to-br from-[#252525] to-[#2A2A2A] border border-emerald-500/30 rounded-2xl p-5 hover:border-emerald-400/50 transition-all duration-300 shadow-lg hover:shadow-emerald-500/20 hover:scale-[1.02]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-emerald-100">Success Rate</span>
                <div className="p-2 bg-emerald-500/20 rounded-lg ring-1 ring-emerald-400/30">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                </div>
              </div>
              <div className="text-3xl font-black bg-gradient-to-br from-emerald-300 to-emerald-500 bg-clip-text text-transparent mb-2">
                {Math.round((stats.success / stats.total) * 100)}%
              </div>
              <div className="text-xs text-emerald-300/70 font-medium">
                {stats.success}/{stats.total} requests succeeded
              </div>
            </div>

            <div className="group bg-gradient-to-br from-[#252525] to-[#2A2A2A] border border-amber-500/30 rounded-2xl p-5 hover:border-amber-400/50 transition-all duration-300 shadow-lg hover:shadow-amber-500/20 hover:scale-[1.02]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-amber-100">Avg Response</span>
                <div className="p-2 bg-amber-500/20 rounded-lg ring-1 ring-amber-400/30">
                  <Zap className="w-5 h-5 text-amber-400" />
                </div>
              </div>
              <div className="text-3xl font-black bg-gradient-to-br from-amber-300 to-amber-500 bg-clip-text text-transparent mb-2">
                {stats.avgTime}<span className="text-lg">ms</span>
              </div>
              <div className="text-xs text-amber-300/70 font-medium">
                Min: {stats.minTime}ms • Max: {stats.maxTime}ms
              </div>
            </div>

            <div className="group bg-gradient-to-br from-[#252525] to-[#2A2A2A] border border-red-500/30 rounded-2xl p-5 hover:border-red-400/50 transition-all duration-300 shadow-lg hover:shadow-red-500/20 hover:scale-[1.02]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-red-100">Failed</span>
                <div className="p-2 bg-red-500/20 rounded-lg ring-1 ring-red-400/30">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                </div>
              </div>
              <div className="text-3xl font-black bg-gradient-to-br from-red-300 to-red-500 bg-clip-text text-transparent mb-2">
                {stats.failed}
              </div>
              <div className="text-xs text-red-300/70 font-medium">
                {Math.round((stats.failed / stats.total) * 100)}% error rate
              </div>
            </div>
          </div>
        )}

        {/* Results Table */}
        <div className="bg-gradient-to-br from-[#252525] to-[#2A2A2A] backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          <div className="px-6 py-4 border-b border-white/5 bg-[#2A2A2A]">
            <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wide flex items-center gap-2">
              <div className="w-1 h-5 bg-gradient-to-b from-cyan-400 to-violet-500 rounded-full"></div>
              Request Results
            </h3>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {results.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-[#2A2A2A] rounded-2xl flex items-center justify-center border border-white/10">
                  <Activity className="w-8 h-8 text-gray-600" />
                </div>
                <p className="text-gray-400 font-medium">Configure and start a performance test</p>
                <p className="text-gray-600 text-sm mt-1">Results will appear here</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {results.map((result) => (
                  <div
                    key={result.requestNumber}
                    className="px-6 py-4 flex items-center justify-between hover:bg-[#2A2A2A] transition-all duration-150 group"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-gray-500 font-mono font-bold min-w-[3rem] px-2.5 py-1 bg-[#2A2A2A] rounded-lg border border-white/10">
                        #{result.requestNumber}
                      </span>
                      <span
                        className={`text-xs px-3 py-1.5 rounded-lg font-bold border shadow-sm ${
                          result.success
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                            : 'bg-red-500/20 text-red-300 border-red-500/50'
                        }`}
                      >
                        {result.status || 'ERR'}
                      </span>
                      {result.error && (
                        <span className="text-xs text-red-400 truncate max-w-xs bg-red-500/10 px-3 py-1 rounded-lg border border-red-500/30">
                          {result.error}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white font-mono font-bold px-3 py-1.5 bg-[#2A2A2A] rounded-lg border border-white/10 group-hover:border-cyan-500/50 transition-colors">
                        {result.responseTime}ms
                      </span>
                    </div>
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