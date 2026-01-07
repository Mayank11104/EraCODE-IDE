import { useState, useEffect } from 'react'
import { Send, Plus, Trash2, Loader2, Clock, Cookie, Key, Eye, EyeOff, Copy, CheckCircle, X } from 'lucide-react'
import ResponseViewer from './ResponseViewer'

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

// ✅ NEW: Request Tab State
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
  
  // Response state
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

export default function RestTester() {
  const PROXY_URL = 'http://localhost:3001/api/proxy-request'
  const [useProxy, setUseProxy] = useState(true)
  
  // ✅ Tab Management
  const [tabs, setTabs] = useState<RequestTab[]>([])
  const [activeTabId, setActiveTabId] = useState<string>('')
  const [tabCounter, setTabCounter] = useState(1)
  
  const [activeSubTab, setActiveSubTab] = useState<'headers' | 'body' | 'auth' | 'params' | 'cookies' | 'credentials'>('headers')
  const [loading, setLoading] = useState(false)
  
  // Credentials (shared across all tabs)
  const [credentials, setCredentials] = useState<StoredCredential[]>([])
  const [showCredentialValues, setShowCredentialValues] = useState<Set<string>>(new Set())

  // ✅ Initialize with first tab
  useEffect(() => {
    if (tabs.length === 0) {
      createNewTab()
    }
  }, [])

  // ✅ Get current active tab
  const currentTab = tabs.find(t => t.id === activeTabId)

  // ✅ Create new tab
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

  // ✅ Close tab
  const closeTab = (tabId: string) => {
    const newTabs = tabs.filter(t => t.id !== tabId)
    setTabs(newTabs)
    
    if (activeTabId === tabId && newTabs.length > 0) {
      setActiveTabId(newTabs[newTabs.length - 1].id)
    }
  }

  // ✅ Update current tab
  const updateTab = (updates: Partial<RequestTab>) => {
    if (!currentTab) return
    
    setTabs(tabs.map(tab => 
      tab.id === activeTabId 
        ? { ...tab, ...updates }
        : tab
    ))
  }

  // ✅ Rename tab (double-click to edit)
  const renameTab = (tabId: string, newName: string) => {
    setTabs(tabs.map(tab =>
      tab.id === tabId ? { ...tab, name: newName } : tab
    ))
  }

  // Load credentials from localStorage
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
          tokens.push({
            key: key,
            value: value,
            location: currentPath
          })
        }

        if (typeof value === 'object' && value !== null) {
          tokens.push(...extractTokensFromResponse(value, currentPath))
        }
      })
    }

    return tokens
  }

  const addCredential = () => {
    const newCred: StoredCredential = {
      name: 'New Credential',
      value: '',
      type: 'token'
    }
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
        updateTab({ 
          headers: [...currentTab.headers, { key: 'X-API-Key', value: credential.value, enabled: true }]
        })
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
    const queryString = enabledParams
      .map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
      .join('&')
    return `${baseUrl}?${queryString}`
  }

  // ✅ MAIN REQUEST HANDLER
  const handleSend = async () => {
    if (!currentTab) return
    
    setLoading(true)
    updateTab({ 
      error: null, 
      responseCookies: [], 
      extractedTokens: [], 
      showTokenPanel: false 
    })
    
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

        const bodyText = typeof proxyData.body === 'string' 
          ? proxyData.body 
          : JSON.stringify(proxyData.body, null, 2)
        
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
      case 'GET': return 'text-green-400 bg-green-400/10'
      case 'POST': return 'text-yellow-400 bg-yellow-400/10'
      case 'PUT': return 'text-blue-400 bg-blue-400/10'
      case 'PATCH': return 'text-purple-400 bg-purple-400/10'
      case 'DELETE': return 'text-red-400 bg-red-400/10'
      default: return 'text-gray-400 bg-gray-400/10'
    }
  }

  if (!currentTab) return null

  return (
    <div className="flex flex-col h-full">
      {/* ✅ TAB BAR */}
      <div className="flex items-center gap-1 bg-dark-surface border-b border-dark-border px-2 py-1 overflow-x-auto">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`group flex items-center gap-2 px-3 py-1.5 rounded-t border-b-2 transition-all cursor-pointer min-w-[120px] max-w-[200px] ${
              activeTabId === tab.id
                ? 'bg-dark-bg border-blue-500 text-white'
                : 'bg-dark-surface/50 border-transparent text-text-secondary hover:bg-dark-bg/50 hover:text-white'
            }`}
            onClick={() => setActiveTabId(tab.id)}
          >
            <div className={`text-xs px-1.5 py-0.5 rounded font-medium ${getMethodColor(tab.method)}`}>
              {tab.method}
            </div>
            
            <span className="flex-1 text-sm truncate">
              {tab.name}
            </span>

            {tab.status && (
              <span className={`text-xs px-1 rounded ${
                tab.status >= 200 && tab.status < 300 ? 'bg-green-500/20 text-green-400' :
                tab.status >= 400 ? 'bg-red-500/20 text-red-400' :
                'bg-yellow-500/20 text-yellow-400'
              }`}>
                {tab.status}
              </span>
            )}
            
            <button
              onClick={(e) => {
                e.stopPropagation()
                closeTab(tab.id)
              }}
              className="opacity-0 group-hover:opacity-100 hover:bg-red-500/20 p-0.5 rounded transition-opacity"
            >
              <X className="w-3 h-3 text-red-400" />
            </button>
          </div>
        ))}
        
        <button
          onClick={createNewTab}
          className="flex items-center gap-1 px-3 py-1.5 text-xs text-blue-400 hover:bg-dark-bg rounded transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          New Tab
        </button>
      </div>

      {/* Request Section */}
      <div className="shrink-0 border-b border-dark-border">
        {/* Method + URL */}
        <div className="flex gap-2 p-3">
          <select
            value={currentTab.method}
            onChange={(e) => updateTab({ method: e.target.value })}
            className={`w-28 px-3 py-2 rounded text-xs font-medium border border-dark-border ${getMethodColor(currentTab.method)} focus:outline-none focus:ring-2 focus:ring-blue-500`}
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

        {/* Backend Proxy Toggle */}
        <div className="px-3 pb-2 border-t border-dark-border">
          <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-dark-surface p-2 rounded transition-colors">
            <input
              type="checkbox"
              checked={useProxy}
              onChange={(e) => setUseProxy(e.target.checked)}
              className="w-4 h-4 accent-blue-500 cursor-pointer"
            />
            <div className="flex items-center gap-2 flex-1">
              <span className={useProxy ? 'text-white font-medium' : 'text-text-secondary'}>
                🔌 Use Backend Proxy
              </span>
              <span className="text-xs text-text-secondary">
                (View cookies & bypass CORS)
              </span>
            </div>
            {useProxy && (
              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded flex items-center gap-1">
                <Cookie className="w-3 h-3" />
                Cookies Visible
              </span>
            )}
          </label>
        </div>

        {/* Token Detection Panel */}
        {currentTab.showTokenPanel && currentTab.extractedTokens.length > 0 && (
          <div className="mx-3 mb-3 bg-green-500/10 border-2 border-green-500/50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-green-400" />
                <span className="text-sm font-bold text-green-400">
                  🎉 {currentTab.extractedTokens.length} Token{currentTab.extractedTokens.length > 1 ? 's' : ''} Detected!
                </span>
              </div>
              <button
                onClick={() => updateTab({ showTokenPanel: false })}
                className="text-xs text-text-secondary hover:text-white"
              >
                ✕ Dismiss
              </button>
            </div>

            <div className="space-y-2">
              {currentTab.extractedTokens.map((token, i) => (
                <div key={i} className="bg-dark-surface rounded-lg p-3 border border-green-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-sm font-semibold text-white">{token.key}</div>
                      <div className="text-xs text-text-secondary">{token.location}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1 bg-dark-bg rounded px-3 py-2 font-mono text-xs text-green-400 overflow-x-auto whitespace-nowrap">
                      {token.value.substring(0, 60)}...
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => copyToken(token.value)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded px-3 py-1.5 text-xs font-medium flex items-center justify-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      Copy Token
                    </button>
                    <button
                      onClick={() => useToken(token.value)}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white rounded px-3 py-1.5 text-xs font-medium flex items-center justify-center gap-1"
                    >
                      <Key className="w-3 h-3" />
                      Use in Auth
                    </button>
                    <button
                      onClick={() => saveToken(token)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded px-3 py-1.5 text-xs font-medium flex items-center justify-center gap-1"
                    >
                      <CheckCircle className="w-3 h-3" />
                      Save
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sub-Tabs */}
        <div className="flex border-t border-dark-border px-3 overflow-x-auto">
          {(['params', 'headers', 'body', 'auth', 'cookies', 'credentials'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeSubTab === tab
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-text-secondary hover:text-white'
              }`}
            >
              {tab === 'cookies' && <Cookie className="w-3.5 h-3.5" />}
              {tab === 'credentials' && <Key className="w-3.5 h-3.5" />}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'credentials' && credentials.length > 0 && (
                <span className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">{credentials.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* Sub-Tab Content */}
        <div className="max-h-64 overflow-y-auto">
          {/* Params Tab */}
          {activeSubTab === 'params' && (
            <div className="p-3 space-y-2">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-text-secondary">Query Parameters</h3>
                <button 
                  onClick={() => updateTab({ params: [...currentTab.params, { key: '', value: '', enabled: true }] })}
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add
                </button>
              </div>
              {currentTab.params.map((param, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    checked={param.enabled} 
                    onChange={(e) => {
                      const newParams = [...currentTab.params]
                      newParams[i].enabled = e.target.checked
                      updateTab({ params: newParams })
                    }}
                    className="w-4 h-4 shrink-0" 
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
                    className="flex-1 min-w-0 bg-dark-bg border border-dark-border rounded px-3 py-1.5 text-sm text-white" 
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
                    className="flex-1 min-w-0 bg-dark-bg border border-dark-border rounded px-3 py-1.5 text-sm text-white" 
                  />
                  <button 
                    onClick={() => updateTab({ params: currentTab.params.filter((_, idx) => idx !== i) })}
                    className="text-red-400 hover:text-red-300 p-1 shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Headers Tab */}
          {activeSubTab === 'headers' && (
            <div className="p-3 space-y-2">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-text-secondary">Request Headers</h3>
                <button 
                  onClick={() => updateTab({ headers: [...currentTab.headers, { key: '', value: '', enabled: true }] })}
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add
                </button>
              </div>
              {currentTab.headers.map((header, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    checked={header.enabled} 
                    onChange={(e) => {
                      const newHeaders = [...currentTab.headers]
                      newHeaders[i].enabled = e.target.checked
                      updateTab({ headers: newHeaders })
                    }}
                    className="w-4 h-4 shrink-0" 
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
                    className="flex-1 min-w-0 bg-dark-bg border border-dark-border rounded px-3 py-1.5 text-sm text-white" 
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
                    className="flex-1 min-w-0 bg-dark-bg border border-dark-border rounded px-3 py-1.5 text-sm text-white" 
                  />
                  <button 
                    onClick={() => updateTab({ headers: currentTab.headers.filter((_, idx) => idx !== i) })}
                    className="text-red-400 hover:text-red-300 p-1 shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Body Tab */}
          {activeSubTab === 'body' && (
            <div className="p-3">
              <textarea
                value={currentTab.bodyContent}
                onChange={(e) => updateTab({ bodyContent: e.target.value })}
                placeholder='{\n  "email": "user@example.com",\n  "password": "password123"\n}'
                className="w-full h-32 bg-dark-bg border border-dark-border rounded p-3 text-sm font-mono text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Auth Tab */}
          {activeSubTab === 'auth' && (
            <div className="p-3 space-y-3">
              <select 
                value={currentTab.authType} 
                onChange={(e) => updateTab({ authType: e.target.value as any })}
                className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm text-white"
              >
                <option value="none">No Auth</option>
                <option value="bearer">Bearer Token</option>
                <option value="basic">Basic Auth</option>
              </select>
              {currentTab.authType !== 'none' && (
                <input
                  type="text"
                  value={currentTab.authToken}
                  onChange={(e) => updateTab({ authToken: e.target.value })}
                  placeholder={currentTab.authType === 'bearer' ? 'Enter token...' : 'username:password'}
                  className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm text-white font-mono"
                />
              )}
            </div>
          )}

          {/* Cookies Tab */}
          {activeSubTab === 'cookies' && (
            <div className="p-3 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-text-secondary">Request Cookies</h3>
                <button 
                  onClick={() => updateTab({ 
                    cookies: [...currentTab.cookies, { name: '', value: '', domain: '', path: '/' }]
                  })}
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add Cookie
                </button>
              </div>

              {!useProxy && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-2 text-xs text-yellow-400">
                  ⚠️ Enable "Use Backend Proxy" to see response cookies
                </div>
              )}

              {currentTab.cookies.length === 0 ? (
                <div className="text-center py-4 text-text-secondary text-sm">
                  No cookies added yet
                </div>
              ) : (
                currentTab.cookies.map((cookie, i) => (
                  <div key={i} className="bg-dark-bg border border-dark-border rounded p-2 space-y-2">
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
                        className="flex-1 bg-dark-surface border border-dark-border rounded px-2 py-1 text-sm text-white"
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
                        className="flex-1 bg-dark-surface border border-dark-border rounded px-2 py-1 text-sm text-white"
                      />
                      <button
                        onClick={() => updateTab({ cookies: currentTab.cookies.filter((_, idx) => idx !== i) })}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}

              {/* Response Cookies */}
              {currentTab.responseCookies.length > 0 && (
                <div className="mt-4 pt-4 border-t border-dark-border">
                  <h3 className="text-xs font-semibold text-green-400 mb-2 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    Cookies from Response ({currentTab.responseCookies.length})
                  </h3>
                  <div className="space-y-2">
                    {currentTab.responseCookies.map((cookie, i) => (
                      <div key={i} className="bg-green-500/10 border border-green-500/30 rounded p-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-mono text-green-400">{cookie.name}</span>
                          <div className="flex gap-2">
                            {cookie.httpOnly && (
                              <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded">
                                HttpOnly
                              </span>
                            )}
                            {cookie.secure && (
                              <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">
                                Secure
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-text-secondary font-mono truncate mb-2">{cookie.value}</div>
                        <div className="flex items-center justify-between text-xs text-text-secondary">
                          <div>
                            <span className="text-text-secondary/60">Domain:</span> {cookie.domain} | 
                            <span className="text-text-secondary/60"> Path:</span> {cookie.path}
                          </div>
                          <button
                            onClick={() => {
                              if (!currentTab.cookies.find(c => c.name === cookie.name)) {
                                updateTab({ cookies: [...currentTab.cookies, cookie] })
                              }
                            }}
                            className="text-blue-400 hover:text-blue-300"
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
            <div className="p-3 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-text-secondary">Saved Credentials</h3>
                <button 
                  onClick={addCredential}
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add
                </button>
              </div>

              {credentials.length === 0 ? (
                <div className="text-center py-4 text-text-secondary text-sm">
                  No credentials saved yet. Use "Save" button on detected tokens.
                </div>
              ) : (
                credentials.map((cred, i) => (
                  <div key={i} className="bg-dark-bg border border-dark-border rounded p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={cred.name}
                        onChange={(e) => updateCredential(i, 'name', e.target.value)}
                        placeholder="Credential name"
                        className="flex-1 bg-dark-surface border border-dark-border rounded px-2 py-1 text-sm text-white"
                      />
                      <select
                        value={cred.type}
                        onChange={(e) => updateCredential(i, 'type', e.target.value)}
                        className="bg-dark-surface border border-dark-border rounded px-2 py-1 text-xs text-white"
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
                        className="flex-1 bg-dark-surface border border-dark-border rounded px-2 py-1 text-sm text-white font-mono"
                      />
                      <button
                        onClick={() => toggleShowCredential(cred.name)}
                        className="text-text-secondary hover:text-white p-1"
                      >
                        {showCredentialValues.has(cred.name) ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => useCredential(cred)}
                        className="text-xs text-blue-400 hover:text-blue-300"
                      >
                        Use in Request →
                      </button>
                      <button
                        onClick={() => deleteCredential(i)}
                        className="text-xs text-red-400 hover:text-red-300"
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
        <div className="flex-1 overflow-hidden border-t border-dark-border">
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
