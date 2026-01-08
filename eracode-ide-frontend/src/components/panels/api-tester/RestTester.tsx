import { useState, useEffect } from 'react'
import { Send, Plus, Trash2, Loader2, Clock, Cookie, Key, Eye, EyeOff, Copy, CheckCircle, X, Zap, Shield, Globe } from 'lucide-react'

interface Header {
  key: string
  value: string
  enabled: boolean
}

interface StoredCredential {
  name: string
  value: string
  type: 'token' | 'apikey' | 'password'
}

interface CookieItem {
  name: string
  value: string
  domain: string
  path: string
  expires?: string
  maxAge?: string
  httpOnly?: boolean
  secure?: boolean
  sameSite?: string
  raw?: string
}

interface ExtractedToken {
  key: string
  value: string
  location: string
}

interface RequestTab {
  id: string
  name: string
  method: string
  url: string
  headers: Header[]
  bodyContent: string
  params: Header[]
  authType: 'none' | 'bearer' | 'basic'
  authToken: string
  cookies: CookieItem[]
  response: any
  responseBody: string
  responseHeaders: Record<string, string>
  responseCookies: CookieItem[]
  status: number | null
  responseTime: number | null
  error: string | null
  extractedTokens: ExtractedToken[]
  showTokenPanel: boolean
}

// Mock ResponseViewer component
const ResponseViewer = ({ response, headers, status, responseTime, error, cookies }: any) => (
  <div className="h-full bg-[#1E1E1E] p-4 overflow-auto">
    <div className="space-y-4">
      {status && (
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1.5 rounded-lg font-semibold text-sm ${
            status >= 200 && status < 300 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
            status >= 400 ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
            'bg-amber-500/20 text-amber-400 border border-amber-500/30'
          }`}>
            {status} {status >= 200 && status < 300 ? '✓' : '✗'}
          </span>
          {responseTime && (
            <span className="px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 text-sm border border-blue-500/20 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {responseTime}ms
            </span>
          )}
        </div>
      )}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-rose-400">
          <span className="font-semibold">Error:</span> {error}
        </div>
      )}
      {response && (
        <pre className="bg-[#252525] border border-[#333] rounded-xl p-4 text-sm text-gray-300 overflow-auto font-mono">
          {response}
        </pre>
      )}
    </div>
  </div>
)

export default function RestTester() {
  const PROXY_URL = 'http://localhost:3001/api/proxy-request'
  const [useProxy, setUseProxy] = useState(true)
  const [tabs, setTabs] = useState<RequestTab[]>([])
  const [activeTabId, setActiveTabId] = useState<string>('')
  const [tabCounter, setTabCounter] = useState(1)
  const [activeSubTab, setActiveSubTab] = useState<'headers' | 'body' | 'auth' | 'params' | 'cookies' | 'credentials'>('headers')
  const [loading, setLoading] = useState(false)
  const [credentials, setCredentials] = useState<StoredCredential[]>([])
  const [showCredentialValues, setShowCredentialValues] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (tabs.length === 0) {
      createNewTab()
    }
  }, [])

  const currentTab = tabs.find(t => t.id === activeTabId)

  const createNewTab = () => {
    const newTab: RequestTab = {
      id: `tab-${Date.now()}`,
      name: `Request ${tabCounter}`,
      method: 'GET',
      url: 'https://jsonplaceholder.typicode.com/posts/1',
      headers: [{ key: 'Content-Type', value: 'application/json', enabled: true }],
      bodyContent: '{\n  \n}',
      params: [],
      authType: 'none',
      authToken: '',
      cookies: [],
      response: null,
      responseBody: '',
      responseHeaders: {},
      responseCookies: [],
      status: null,
      responseTime: null,
      error: null,
      extractedTokens: [],
      showTokenPanel: false
    }
    setTabs([...tabs, newTab])
    setActiveTabId(newTab.id)
    setTabCounter(tabCounter + 1)
  }

  const closeTab = (tabId: string) => {
    const newTabs = tabs.filter(t => t.id !== tabId)
    setTabs(newTabs)
    if (activeTabId === tabId && newTabs.length > 0) {
      setActiveTabId(newTabs[newTabs.length - 1].id)
    }
  }

  const updateTab = (updates: Partial<RequestTab>) => {
    if (!currentTab) return
    setTabs(tabs.map(tab => 
      tab.id === activeTabId ? { ...tab, ...updates } : tab
    ))
  }

  const renameTab = (tabId: string, newName: string) => {
    setTabs(tabs.map(tab =>
      tab.id === tabId ? { ...tab, name: newName } : tab
    ))
  }

  useEffect(() => {
    const stored = localStorage.getItem('api_tester_credentials')
    if (stored) {
      try {
        setCredentials(JSON.parse(stored))
      } catch (e) {
        console.error('Failed to load credentials')
      }
    }
  }, [])

  const saveCredentials = (newCreds: StoredCredential[]) => {
    setCredentials(newCreds)
    localStorage.setItem('api_tester_credentials', JSON.stringify(newCreds))
  }

  const extractTokensFromResponse = (data: any, path = ''): ExtractedToken[] => {
    const tokens: ExtractedToken[] = []
    const tokenKeys = [
      'token', 'access_token', 'accessToken', 'access-token',
      'refresh_token', 'refreshToken', 'refresh-token',
      'id_token', 'idToken', 'id-token',
      'auth_token', 'authToken', 'auth-token',
      'jwt', 'bearer', 'authorization',
      'api_key', 'apiKey', 'api-key',
      'session_token', 'sessionToken', 'session-token'
    ]

    if (typeof data === 'object' && data !== null) {
      Object.keys(data).forEach(key => {
        const currentPath = path ? `${path}.${key}` : key
        const value = data[key]

        if (tokenKeys.includes(key.toLowerCase()) && typeof value === 'string' && value.length > 10) {
          tokens.push({ key: key, value: value, location: currentPath })
        }

        if (typeof value === 'object' && value !== null) {
          tokens.push(...extractTokensFromResponse(value, currentPath))
        }
      })
    }
    return tokens
  }

  const addCredential = () => {
    const newCred: StoredCredential = { name: 'New Credential', value: '', type: 'token' }
    saveCredentials([...credentials, newCred])
  }

  const updateCredential = (index: number, field: keyof StoredCredential, value: string) => {
    const newCreds = [...credentials]
    newCreds[index] = { ...newCreds[index], [field]: value }
    saveCredentials(newCreds)
  }

  const deleteCredential = (index: number) => {
    saveCredentials(credentials.filter((_, i) => i !== index))
  }

  const toggleShowCredential = (name: string) => {
    const newSet = new Set(showCredentialValues)
    if (newSet.has(name)) {
      newSet.delete(name)
    } else {
      newSet.add(name)
    }
    setShowCredentialValues(newSet)
  }

  const useCredential = (credential: StoredCredential) => {
    if (!currentTab) return
    if (credential.type === 'token') {
      updateTab({ authType: 'bearer', authToken: credential.value })
      setActiveSubTab('auth')
    } else if (credential.type === 'apikey') {
      const existingHeader = currentTab.headers.find(h => h.key === 'X-API-Key')
      if (existingHeader) {
        const newHeaders = [...currentTab.headers]
        newHeaders[currentTab.headers.indexOf(existingHeader)].value = credential.value
        updateTab({ headers: newHeaders })
      } else {
        updateTab({ headers: [...currentTab.headers, { key: 'X-API-Key', value: credential.value, enabled: true }] })
      }
      setActiveSubTab('headers')
    }
  }

  const copyToken = (value: string) => {
    navigator.clipboard.writeText(value)
  }

  const saveToken = (token: ExtractedToken) => {
    if (!currentTab) return
    const newCred: StoredCredential = {
      name: `${token.key} from ${new URL(currentTab.url).hostname}`,
      value: token.value,
      type: 'token'
    }
    const exists = credentials.find(c => c.value === token.value)
    if (!exists) {
      saveCredentials([...credentials, newCred])
    }
  }

  const useToken = (value: string) => {
    updateTab({ authType: 'bearer', authToken: value })
    setActiveSubTab('auth')
  }

  const buildUrl = () => {
    if (!currentTab) return ''
    const enabledParams = currentTab.params.filter(p => p.enabled && p.key)
    if (enabledParams.length === 0) return currentTab.url
    const baseUrl = currentTab.url.split('?')[0]
    const queryString = enabledParams.map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`).join('&')
    return `${baseUrl}?${queryString}`
  }

  const handleSend = async () => {
    if (!currentTab) return
    setLoading(true)
    updateTab({ error: null, responseCookies: [], extractedTokens: [], showTokenPanel: false })
    const startTime = Date.now()

    try {
      const requestHeaders: Record<string, string> = {}
      currentTab.headers.filter(h => h.enabled && h.key).forEach(h => {
        requestHeaders[h.key] = h.value
      })

      if (currentTab.authType === 'bearer' && currentTab.authToken) {
        requestHeaders['Authorization'] = `Bearer ${currentTab.authToken}`
      } else if (currentTab.authType === 'basic' && currentTab.authToken) {
        requestHeaders['Authorization'] = `Basic ${btoa(currentTab.authToken)}`
      }

      if (currentTab.cookies.length > 0) {
        const cookieString = currentTab.cookies.map(c => `${c.name}=${c.value}`).join('; ')
        requestHeaders['Cookie'] = cookieString
      }

      const finalUrl = buildUrl()

      if (useProxy) {
        console.log('🔌 Using backend proxy for request...')
        const proxyResponse = await fetch(PROXY_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            method: currentTab.method,
            url: finalUrl,
            headers: requestHeaders,
            body: currentTab.bodyContent
          })
        })

        if (!proxyResponse.ok) {
          const errorData = await proxyResponse.json()
          throw new Error(errorData.error || `Proxy error: ${proxyResponse.status}`)
        }

        const proxyData = await proxyResponse.json()
        const endTime = Date.now()
        const bodyText = typeof proxyData.body === 'string' ? proxyData.body : JSON.stringify(proxyData.body, null, 2)
        const tokens = extractTokensFromResponse(proxyData.body)
        
        updateTab({
          responseBody: bodyText,
          response: proxyData.body,
          responseHeaders: proxyData.headers || {},
          responseCookies: proxyData.cookies || [],
          status: proxyData.status,
          responseTime: endTime - startTime,
          extractedTokens: tokens,
          showTokenPanel: tokens.length > 0
        })
      } else {
        console.log('⚠️ Using direct fetch (cookies hidden by browser)')
        const options: RequestInit = {
          method: currentTab.method,
          headers: requestHeaders,
          credentials: 'include'
        }

        if (['POST', 'PUT', 'PATCH'].includes(currentTab.method)) {
          options.body = currentTab.bodyContent
        }

        const res = await fetch(finalUrl, options)
        const endTime = Date.now()
        const contentType = res.headers.get('content-type')
        let data
        
        if (contentType?.includes('application/json')) {
          data = await res.json()
        } else {
          data = await res.text()
        }

        const resHeaders: Record<string, string> = {}
        res.headers.forEach((value, key) => {
          resHeaders[key] = value
        })

        const tokens = extractTokensFromResponse(data)
        
        updateTab({
          responseBody: typeof data === 'string' ? data : JSON.stringify(data, null, 2),
          response: data,
          responseHeaders: resHeaders,
          status: res.status,
          responseTime: endTime - startTime,
          extractedTokens: tokens,
          showTokenPanel: tokens.length > 0
        })
      }
    } catch (err: any) {
      console.error('Request error:', err)
      updateTab({
        error: err.message || 'Request failed',
        status: null,
        responseTime: Date.now() - startTime
      })
    } finally {
      setLoading(false)
    }
  }

  const getMethodColor = (m: string) => {
    switch (m) {
      case 'GET': return 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30'
      case 'POST': return 'text-amber-400 bg-amber-500/15 border-amber-500/30'
      case 'PUT': return 'text-blue-400 bg-blue-500/15 border-blue-500/30'
      case 'PATCH': return 'text-violet-400 bg-violet-500/15 border-violet-500/30'
      case 'DELETE': return 'text-rose-400 bg-rose-500/15 border-rose-500/30'
      default: return 'text-gray-400 bg-gray-500/15 border-gray-500/30'
    }
  }

  if (!currentTab) return null

  return (
    <div className="flex flex-col h-full bg-[#1E1E1E]">
      {/* Tab Bar with Gradient */}
      <div className="flex items-center gap-1 bg-gradient-to-r from-[#252525] to-[#2a2a2a] border-b border-[#333] px-3 py-2 overflow-x-auto shadow-lg">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`group flex items-center gap-2 px-4 py-2 rounded-lg border transition-all cursor-pointer min-w-[140px] max-w-[220px] ${
              activeTabId === tab.id
                ? 'bg-gradient-to-br from-blue-500/20 to-violet-500/20 border-blue-500/50 text-white shadow-lg shadow-blue-500/10'
                : 'bg-[#252525] border-[#333] text-gray-400 hover:bg-[#2a2a2a] hover:border-[#444] hover:text-white'
            }`}
            onClick={() => setActiveTabId(tab.id)}
          >
            <div className={`text-xs px-2 py-1 rounded-md font-bold border ${getMethodColor(tab.method)}`}>
              {tab.method}
            </div>
            
            <span className="flex-1 text-sm font-medium truncate">
              {tab.name}
            </span>

            {tab.status && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                tab.status >= 200 && tab.status < 300 ? 'bg-emerald-500/20 text-emerald-400' :
                tab.status >= 400 ? 'bg-rose-500/20 text-rose-400' :
                'bg-amber-500/20 text-amber-400'
              }`}>
                {tab.status}
              </span>
            )}
            
            <button
              onClick={(e) => {
                e.stopPropagation()
                closeTab(tab.id)
              }}
              className="opacity-0 group-hover:opacity-100 hover:bg-rose-500/20 p-1 rounded transition-all"
            >
              <X className="w-3.5 h-3.5 text-rose-400" />
            </button>
          </div>
        ))}
        
        <button
          onClick={createNewTab}
          className="flex items-center gap-2 px-4 py-2 text-sm text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-all border border-transparent hover:border-blue-500/30"
        >
          <Plus className="w-4 h-4" />
          <span className="font-medium">New</span>
        </button>
      </div>

      {/* Request Section */}
      <div className="shrink-0 border-b border-[#333]">
        {/* Method + URL with Gradient Background */}
        <div className="flex gap-3 p-4 bg-gradient-to-r from-[#252525] to-[#232323]">
          <select
            value={currentTab.method}
            onChange={(e) => updateTab({ method: e.target.value })}
            className={`w-32 px-4 py-3 rounded-xl text-sm font-bold border-2 ${getMethodColor(currentTab.method)} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer shadow-lg`}
          >
            <option>GET</option>
            <option>POST</option>
            <option>PUT</option>
            <option>PATCH</option>
            <option>DELETE</option>
          </select>

          <input
            type="text"
            value={currentTab.url}
            onChange={(e) => updateTab({ url: e.target.value })}
            placeholder="Enter request URL..."
            className="flex-1 bg-[#252525] border-2 border-[#333] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-inner"
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          />

          <button
            onClick={handleSend}
            disabled={loading}
            className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl px-8 py-3 text-sm font-bold flex items-center gap-2 transition-all shadow-lg hover:shadow-xl hover:shadow-blue-500/30 disabled:shadow-none"
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

        {/* Proxy Toggle with Enhanced Design */}
        <div className="px-4 pb-3 bg-gradient-to-r from-[#252525] to-[#232323]">
          <label className="flex items-center gap-3 cursor-pointer hover:bg-[#2a2a2a] p-3 rounded-xl transition-all border border-transparent hover:border-[#444] group">
            <input
              type="checkbox"
              checked={useProxy}
              onChange={(e) => setUseProxy(e.target.checked)}
              className="w-5 h-5 accent-blue-500 cursor-pointer rounded"
            />
            <div className="flex items-center gap-3 flex-1">
              <Globe className={`w-5 h-5 ${useProxy ? 'text-blue-400' : 'text-gray-500'} transition-colors`} />
              <span className={`font-semibold ${useProxy ? 'text-white' : 'text-gray-400'} transition-colors`}>
                Backend Proxy
              </span>
              <span className="text-xs text-gray-500">
                View cookies & bypass CORS
              </span>
            </div>
            {useProxy && (
              <span className="text-xs bg-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-full flex items-center gap-2 font-semibold border border-emerald-500/30">
                <Cookie className="w-3.5 h-3.5" />
                Active
              </span>
            )}
          </label>
        </div>

        {/* Token Detection Panel with Premium Design */}
        {currentTab.showTokenPanel && currentTab.extractedTokens.length > 0 && (
          <div className="mx-4 mb-4 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-2 border-emerald-500/40 rounded-2xl p-4 shadow-xl shadow-emerald-500/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-500/20 p-2 rounded-xl">
                  <Zap className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <span className="text-sm font-bold text-emerald-400 block">
                    Tokens Detected!
                  </span>
                  <span className="text-xs text-gray-400">
                    {currentTab.extractedTokens.length} token{currentTab.extractedTokens.length > 1 ? 's' : ''} found in response
                  </span>
                </div>
              </div>
              <button
                onClick={() => updateTab({ showTokenPanel: false })}
                className="text-gray-400 hover:text-white hover:bg-[#2a2a2a] p-2 rounded-lg transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {currentTab.extractedTokens.map((token, i) => (
                <div key={i} className="bg-[#252525] rounded-xl p-4 border border-emerald-500/20 hover:border-emerald-500/40 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-sm font-bold text-white">{token.key}</div>
                      <div className="text-xs text-gray-400 mt-1">{token.location}</div>
                    </div>
                  </div>

                  <div className="bg-[#1E1E1E] rounded-lg px-4 py-3 font-mono text-xs text-emerald-400 overflow-x-auto mb-3 border border-[#333]">
                    {token.value.substring(0, 60)}...
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => copyToken(token.value)}
                      className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-3 py-2 text-xs font-bold flex items-center justify-center gap-2 transition-all"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Copy
                    </button>
                    <button
                      onClick={() => useToken(token.value)}
                      className="bg-violet-600 hover:bg-violet-500 text-white rounded-lg px-3 py-2 text-xs font-bold flex items-center justify-center gap-2 transition-all"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      Use
                    </button>
                    <button
                      onClick={() => saveToken(token)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-3 py-2 text-xs font-bold flex items-center justify-center gap-2 transition-all"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Save
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sub-Tabs with Enhanced Design */}
        <div className="flex border-t border-[#333] px-4 overflow-x-auto bg-[#252525]">
          {(['params', 'headers', 'body', 'auth', 'cookies', 'credentials'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              className={`px-5 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
                activeSubTab === tab
                  ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                  : 'border-transparent text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
              }`}
            >
              {tab === 'cookies' && <Cookie className="w-4 h-4" />}
              {tab === 'credentials' && <Key className="w-4 h-4" />}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'credentials' && credentials.length > 0 && (
                <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">{credentials.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* Sub-Tab Content */}
        <div className="max-h-72 overflow-y-auto bg-[#1E1E1E]">
          {/* Params Tab */}
          {activeSubTab === 'params' && (
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-300">Query Parameters</h3>
                <button 
                  onClick={() => updateTab({ params: [...currentTab.params, { key: '', value: '', enabled: true }] })}
                  className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-2 hover:bg-blue-500/10 px-3 py-1.5 rounded-lg transition-all font-semibold"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>
              {currentTab.params.map((param, i) => (
                <div key={i} className="flex items-center gap-2 bg-[#252525] p-3 rounded-xl border border-[#333] hover:border-[#444] transition-all">
                  <input 
                    type="checkbox" 
                    checked={param.enabled} 
                    onChange={(e) => {
                      const newParams = [...currentTab.params]
                      newParams[i].enabled = e.target.checked
                      updateTab({ params: newParams })
                    }}
                    className="w-4 h-4 shrink-0 accent-blue-500 rounded" 
                  />
                  <input 
                    type="text" 
                    value={param.key} 
                    onChange={(e) => {
                      const newParams = [...currentTab.params]
                      newParams[i].key = e.target.value
                      updateTab({ params: newParams })
                    }}
                    placeholder="Key" 
                    className="flex-1 min-w-0 bg-[#1E1E1E] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" 
                  />
                  <input 
                    type="text" 
                    value={param.value} 
                    onChange={(e) => {
                      const newParams = [...currentTab.params]
                      newParams[i].value = e.target.value
                      updateTab({ params: newParams })
                    }}
                    placeholder="Value" 
                    className="flex-1 min-w-0 bg-[#1E1E1E] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" 
                  />
                  <button 
                    onClick={() => updateTab({ params: currentTab.params.filter((_, idx) => idx !== i) })}
                    className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 p-2 rounded-lg shrink-0 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Headers Tab */}
          {activeSubTab === 'headers' && (
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-300">Request Headers</h3>
                <button 
                  onClick={() => updateTab({ headers: [...currentTab.headers, { key: '', value: '', enabled: true }] })}
                  className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-2 hover:bg-blue-500/10 px-3 py-1.5 rounded-lg transition-all font-semibold"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>
              {currentTab.headers.map((header, i) => (
                <div key={i} className="flex items-center gap-2 bg-[#252525] p-3 rounded-xl border border-[#333] hover:border-[#444] transition-all">
                  <input 
                    type="checkbox" 
                    checked={header.enabled} 
                    onChange={(e) => {
                      const newHeaders = [...currentTab.headers]
                      newHeaders[i].enabled = e.target.checked
                      updateTab({ headers: newHeaders })
                    }}
                    className="w-4 h-4 shrink-0 accent-blue-500 rounded" 
                  />
                  <input 
                    type="text" 
                    value={header.key} 
                    onChange={(e) => {
                      const newHeaders = [...currentTab.headers]
                      newHeaders[i].key = e.target.value
                      updateTab({ headers: newHeaders })
                    }}
                    placeholder="Header" 
                    className="flex-1 min-w-0 bg-[#1E1E1E] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" 
                  />
                  <input 
                    type="text" 
                    value={header.value} 
                    onChange={(e) => {
                      const newHeaders = [...currentTab.headers]
                      newHeaders[i].value = e.target.value
                      updateTab({ headers: newHeaders })
                    }}
                    placeholder="Value" 
                    className="flex-1 min-w-0 bg-[#1E1E1E] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" 
                  />
                  <button 
                    onClick={() => updateTab({ headers: currentTab.headers.filter((_, idx) => idx !== i) })}
                    className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 p-2 rounded-lg shrink-0 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Body Tab */}
          {activeSubTab === 'body' && (
            <div className="p-4">
              <textarea
                value={currentTab.bodyContent}
                onChange={(e) => updateTab({ bodyContent: e.target.value })}
                placeholder='{\n  "email": "user@example.com",\n  "password": "password123"\n}'
                className="w-full h-40 bg-[#252525] border-2 border-[#333] rounded-xl p-4 text-sm font-mono text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-inner"
              />
            </div>
          )}

          {/* Auth Tab */}
          {activeSubTab === 'auth' && (
            <div className="p-4 space-y-4">
              <select 
                value={currentTab.authType} 
                onChange={(e) => updateTab({ authType: e.target.value as any })}
                className="w-full bg-[#252525] border-2 border-[#333] rounded-xl px-4 py-3 text-sm text-white font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
              >
                <option value="none">No Authentication</option>
                <option value="bearer">Bearer Token</option>
                <option value="basic">Basic Auth</option>
              </select>
              {currentTab.authType !== 'none' && (
                <input
                  type="text"
                  value={currentTab.authToken}
                  onChange={(e) => updateTab({ authToken: e.target.value })}
                  placeholder={currentTab.authType === 'bearer' ? 'Enter token...' : 'username:password'}
                  className="w-full bg-[#252525] border-2 border-[#333] rounded-xl px-4 py-3 text-sm text-white font-mono focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
                />
              )}
            </div>
          )}

          {/* Cookies Tab */}
          {activeSubTab === 'cookies' && (
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-300">Request Cookies</h3>
                <button 
                  onClick={() => updateTab({ 
                    cookies: [...currentTab.cookies, { name: '', value: '', domain: '', path: '/' }]
                  })}
                  className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-2 hover:bg-blue-500/10 px-3 py-1.5 rounded-lg transition-all font-semibold"
                >
                  <Plus className="w-4 h-4" /> Add Cookie
                </button>
              </div>

              {!useProxy && (
                <div className="bg-amber-500/10 border-2 border-amber-500/30 rounded-xl p-3 text-sm text-amber-400 flex items-center gap-2">
                  <span className="text-xl">⚠️</span>
                  <span>Enable "Backend Proxy" to see response cookies</span>
                </div>
              )}

              {currentTab.cookies.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No cookies added yet
                </div>
              ) : (
                currentTab.cookies.map((cookie, i) => (
                  <div key={i} className="bg-[#252525] border border-[#333] rounded-xl p-3 space-y-3 hover:border-[#444] transition-all">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={cookie.name}
                        onChange={(e) => {
                          const newCookies = [...currentTab.cookies]
                          newCookies[i].name = e.target.value
                          updateTab({ cookies: newCookies })
                        }}
                        placeholder="Cookie name"
                        className="flex-1 bg-[#1E1E1E] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      />
                      <input
                        type="text"
                        value={cookie.value}
                        onChange={(e) => {
                          const newCookies = [...currentTab.cookies]
                          newCookies[i].value = e.target.value
                          updateTab({ cookies: newCookies })
                        }}
                        placeholder="Cookie value"
                        className="flex-1 bg-[#1E1E1E] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      />
                      <button
                        onClick={() => updateTab({ cookies: currentTab.cookies.filter((_, idx) => idx !== i) })}
                        className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 p-2 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}

              {/* Response Cookies */}
              {currentTab.responseCookies.length > 0 && (
                <div className="mt-6 pt-6 border-t border-[#333]">
                  <h3 className="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Response Cookies ({currentTab.responseCookies.length})
                  </h3>
                  <div className="space-y-3">
                    {currentTab.responseCookies.map((cookie, i) => (
                      <div key={i} className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-2 border-emerald-500/30 rounded-xl p-4 hover:border-emerald-500/50 transition-all">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-bold font-mono text-emerald-400">{cookie.name}</span>
                          <div className="flex gap-2">
                            {cookie.httpOnly && (
                              <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded-full font-semibold border border-orange-500/30">
                                HttpOnly
                              </span>
                            )}
                            {cookie.secure && (
                              <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full font-semibold border border-blue-500/30">
                                Secure
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-gray-400 font-mono truncate mb-3 bg-[#1E1E1E] px-3 py-2 rounded-lg">{cookie.value}</div>
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <div>
                            <span className="text-gray-500">Domain:</span> <span className="text-white">{cookie.domain}</span> | 
                            <span className="text-gray-500"> Path:</span> <span className="text-white">{cookie.path}</span>
                          </div>
                          <button
                            onClick={() => {
                              if (!currentTab.cookies.find(c => c.name === cookie.name)) {
                                updateTab({ cookies: [...currentTab.cookies, cookie] })
                              }
                            }}
                            className="text-blue-400 hover:text-blue-300 font-semibold hover:bg-blue-500/10 px-3 py-1 rounded-lg transition-all"
                          >
                            Use in Request →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Credentials Tab */}
          {activeSubTab === 'credentials' && (
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-300">Saved Credentials</h3>
                <button 
                  onClick={addCredential}
                  className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-2 hover:bg-blue-500/10 px-3 py-1.5 rounded-lg transition-all font-semibold"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>

              {credentials.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm bg-[#252525] rounded-xl border border-[#333] p-6">
                  <Key className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                  <p>No credentials saved yet</p>
                  <p className="text-xs mt-2">Use "Save" button on detected tokens</p>
                </div>
              ) : (
                credentials.map((cred, i) => (
                  <div key={i} className="bg-[#252525] border border-[#333] rounded-xl p-4 space-y-3 hover:border-[#444] transition-all">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={cred.name}
                        onChange={(e) => updateCredential(i, 'name', e.target.value)}
                        placeholder="Credential name"
                        className="flex-1 bg-[#1E1E1E] border border-[#333] rounded-lg px-3 py-2 text-sm text-white font-semibold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      />
                      <select
                        value={cred.type}
                        onChange={(e) => updateCredential(i, 'type', e.target.value)}
                        className="bg-[#1E1E1E] border border-[#333] rounded-lg px-3 py-2 text-xs text-white font-semibold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer"
                      >
                        <option value="token">Token</option>
                        <option value="apikey">API Key</option>
                        <option value="password">Password</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type={showCredentialValues.has(cred.name) ? 'text' : 'password'}
                        value={cred.value}
                        onChange={(e) => updateCredential(i, 'value', e.target.value)}
                        placeholder="Enter value..."
                        className="flex-1 bg-[#1E1E1E] border border-[#333] rounded-lg px-3 py-2 text-sm text-white font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      />
                      <button
                        onClick={() => toggleShowCredential(cred.name)}
                        className="text-gray-400 hover:text-white hover:bg-[#2a2a2a] p-2 rounded-lg transition-all"
                      >
                        {showCredentialValues.has(cred.name) ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#333]">
                      <button
                        onClick={() => useCredential(cred)}
                        className="text-sm text-blue-400 hover:text-blue-300 font-semibold hover:bg-blue-500/10 px-3 py-1.5 rounded-lg transition-all"
                      >
                        Use in Request →
                      </button>
                      <button
                        onClick={() => deleteCredential(i)}
                        className="text-sm text-rose-400 hover:text-rose-300 font-semibold hover:bg-rose-500/10 px-3 py-1.5 rounded-lg transition-all"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Response Section */}
      {(currentTab.response !== null || currentTab.error) && (
        <div className="flex-1 overflow-hidden border-t-2 border-[#333]">
          <ResponseViewer
            response={currentTab.responseBody}
            headers={currentTab.responseHeaders}
            status={currentTab.status}
            responseTime={currentTab.responseTime}
            error={currentTab.error}
            cookies={currentTab.responseCookies}
          />  
        </div>
      )}
    </div>
  )
}