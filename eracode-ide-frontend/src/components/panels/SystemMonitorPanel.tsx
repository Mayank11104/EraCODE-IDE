// src/components/panels/SystemMonitorPanel.tsx

import { useState } from 'react'
import { useSystemMonitor } from '../../hooks/useSystemMonitor'
import { Activity, Cpu, HardDrive, Server, RefreshCw, AlertCircle } from 'lucide-react'
import CPUChart from './systemMonitor/CPUChart'
import MemoryChart from './systemMonitor/MemoryChart'
import ProcessTable from './systemMonitor/ProcessTable'
import ServersList from './systemMonitor/ServersList'
import SystemStats from './systemMonitor/SystemStats'

export default function SystemMonitorPanel() {
  const { metrics, connected, error, refresh } = useSystemMonitor()
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = () => {
    setRefreshing(true)
    refresh()
    setTimeout(() => setRefreshing(false), 500)
  }

  return (
    <div className="flex flex-col h-full bg-dark-base">
      {/* Header */}
      <div className="px-6 py-4 border-b border-dark-border flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity size={20} className="text-green-400" />
              System Monitor
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span 
                className="inline-block w-2 h-2 rounded-full animate-pulse"
                style={{ 
                  background: connected ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)',
                  boxShadow: connected 
                    ? '0 0 10px rgba(34, 197, 94, 0.5)' 
                    : '0 0 10px rgba(239, 68, 68, 0.5)'
                }}
              />
              <p className="text-xs text-gray-400">
                {connected ? 'Live Monitoring' : 'Disconnected'}
              </p>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            disabled={!connected}
            className="p-2 rounded-lg transition-all hover:bg-white/5 disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw 
              size={16} 
              className={`text-gray-400 hover:text-green-400 transition-colors ${
                refreshing ? 'animate-spin' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {error && (
          <div className="mb-4 p-4 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-3">
            <AlertCircle size={20} className="text-red-400" />
            <div>
              <p className="text-sm font-medium text-red-400">Connection Error</p>
              <p className="text-xs text-gray-400 mt-1">{error}</p>
            </div>
          </div>
        )}

        {!metrics && connected && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw size={32} className="text-gray-400 animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-400">Loading metrics...</p>
            </div>
          </div>
        )}

        {metrics && (
          <div className="space-y-6">
            {/* System Stats Cards */}
            <SystemStats metrics={metrics} />

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CPUChart cpuData={metrics.cpu} />
              <MemoryChart memoryData={metrics.memory} />
            </div>

            {/* Active Servers */}
            <ServersList servers={metrics.servers} />

            {/* Process Table */}
            <ProcessTable processes={metrics.processes} />
          </div>
        )}
      </div>
    </div>
  )
}
