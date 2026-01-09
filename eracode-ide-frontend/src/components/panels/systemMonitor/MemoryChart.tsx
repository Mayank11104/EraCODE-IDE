// src/components/panels/systemMonitor/MemoryChart.tsx

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { HardDrive } from 'lucide-react'
import { formatBytes } from '../../../utils/formatBytes'

interface MemoryChartProps {
  memoryData: {
    total: number
    used: number
    free: number
    usagePercent: number
  }
}

export default function MemoryChart({ memoryData }: MemoryChartProps) {
  const data = [
    { name: 'Used', value: memoryData.used },
    { name: 'Free', value: memoryData.free }
  ]

  const COLORS = ['#8b5cf6', '#1f2937']

  return (
    <div 
      className="p-6 rounded-xl border backdrop-blur-sm"
      style={{
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(236, 72, 153, 0.05) 100%)',
        borderColor: 'rgba(139, 92, 246, 0.2)'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/20">
            <HardDrive size={20} className="text-purple-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Memory Usage</h3>
            <p className="text-xs text-gray-400">{formatBytes(memoryData.total)} Total</p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-2xl font-bold text-purple-400">{memoryData.usagePercent}%</div>
          <div className="text-xs text-gray-400">Used</div>
        </div>
      </div>

      {/* Donut Chart */}
      <div className="h-48 relative flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center Text */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
          <div className="text-3xl font-bold text-white">{memoryData.usagePercent}%</div>
          <div className="text-xs text-gray-400">Memory</div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/5">
        <div>
          <div className="text-xs text-gray-400 mb-1">Used</div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-purple-500" />
            <span className="text-sm font-semibold text-white">{formatBytes(memoryData.used)}</span>
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-400 mb-1">Available</div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-gray-700" />
            <span className="text-sm font-semibold text-white">{formatBytes(memoryData.free)}</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-4">
        <div className="h-2 rounded-full bg-gray-700 overflow-hidden">
          <div 
            className="h-full transition-all duration-500 rounded-full"
            style={{
              width: `${memoryData.usagePercent}%`,
              background: memoryData.usagePercent > 90 
                ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                : memoryData.usagePercent > 75
                ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                : 'linear-gradient(90deg, #8b5cf6, #7c3aed)'
            }}
          />
        </div>
      </div>
    </div>
  )
}
