// src/components/panels/systemMonitor/CPUChart.tsx

import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Cpu } from 'lucide-react'

interface CPUChartProps {
  cpuData: {
    usage: number
    cores: number[]
  }
}

export default function CPUChart({ cpuData }: CPUChartProps) {
  const [history, setHistory] = useState<Array<{ time: string; usage: number }>>([])

  useEffect(() => {
    const now = new Date()
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
    
    setHistory(prev => {
      const updated = [...prev, { time: timeStr, usage: cpuData.usage }]
      // Keep last 30 data points
      return updated.slice(-30)
    })
  }, [cpuData.usage])

  return (
    <div 
      className="p-6 rounded-xl border backdrop-blur-sm"
      style={{
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.05) 100%)',
        borderColor: 'rgba(59, 130, 246, 0.2)'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/20">
            <Cpu size={20} className="text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">CPU Usage</h3>
            <p className="text-xs text-gray-400">{cpuData.cores.length} Cores</p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-400">{cpuData.usage}%</div>
          <div className="text-xs text-gray-400">Current</div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-48 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={history}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis 
              dataKey="time" 
              stroke="rgba(255,255,255,0.3)"
              tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
              tickLine={false}
            />
            <YAxis 
              domain={[0, 100]}
              stroke="rgba(255,255,255,0.3)"
              tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
              tickLine={false}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'rgba(17, 24, 39, 0.95)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '8px',
                color: '#fff'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="usage" 
              stroke="rgb(59, 130, 246)"
              strokeWidth={2}
              dot={false}
              animationDuration={300}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Core Usage Grid */}
      <div className="grid grid-cols-8 gap-2">
        {cpuData.cores.map((coreUsage, index) => (
          <div key={index} className="text-center">
            <div className="mb-1 h-1 rounded-full bg-gray-700 overflow-hidden">
              <div 
                className="h-full transition-all duration-300 rounded-full"
                style={{
                  width: `${coreUsage}%`,
                  background: coreUsage > 80 
                    ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                    : coreUsage > 50
                    ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                    : 'linear-gradient(90deg, #3b82f6, #2563eb)'
                }}
              />
            </div>
            <span className="text-xs text-gray-500">C{index}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
