// src/components/panels/systemMonitor/ServersList.tsx

import { Server, Circle } from 'lucide-react'

interface ServersListProps {
  servers: Array<{
    port: number
    active: boolean
    process: string | null
  }>
}

export default function ServersList({ servers }: ServersListProps) {
  if (servers.length === 0) {
    return null
  }

  return (
    <div 
      className="p-6 rounded-xl border backdrop-blur-sm"
      style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)',
        borderColor: 'rgba(16, 185, 129, 0.2)'
      }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-green-500/20">
          <Server size={20} className="text-green-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Active Dev Servers</h3>
          <p className="text-xs text-gray-400">{servers.length} running</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {servers.map((server) => (
          <div
            key={server.port}
            className="p-4 rounded-lg border border-green-500/20 bg-green-500/5 hover:bg-green-500/10 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-white">Port {server.port}</span>
              <Circle size={8} className="text-green-400 fill-green-400 animate-pulse" />
            </div>
            
            <div className="text-xs text-gray-400">
              {server.port === 3001 && '🔧 Backend Server'}
              {server.port === 5173 && '⚡ Vite Dev Server'}
              {server.port === 3000 && '⚛️ React Dev Server'}
              {server.port === 8080 && '🌐 Web Server'}
              {![3001, 5173, 3000, 8080].includes(server.port) && '🚀 Service'}
            </div>

            <div className="mt-2 px-2 py-1 rounded bg-white/5 text-xs text-gray-500 font-mono truncate">
              localhost:{server.port}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
