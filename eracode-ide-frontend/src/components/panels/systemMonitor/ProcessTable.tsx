// src/components/panels/systemMonitor/ProcessTable.tsx

import { Activity } from 'lucide-react'

interface ProcessTableProps {
  processes: Array<{
    pid: number
    name: string
    cpu: number
    mem: number
    command: string
  }>
}

export default function ProcessTable({ processes }: ProcessTableProps) {
  return (
    <div 
      className="p-6 rounded-xl border backdrop-blur-sm"
      style={{
        background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.1) 0%, rgba(249, 115, 22, 0.05) 100%)',
        borderColor: 'rgba(251, 146, 60, 0.2)'
      }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-orange-500/20">
          <Activity size={20} className="text-orange-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Top Processes</h3>
          <p className="text-xs text-gray-400">By CPU usage</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-xs text-gray-400 border-b border-white/5">
              <th className="text-left py-2 px-3 font-medium">PID</th>
              <th className="text-left py-2 px-3 font-medium">Name</th>
              <th className="text-right py-2 px-3 font-medium">CPU %</th>
              <th className="text-right py-2 px-3 font-medium">Memory %</th>
              <th className="text-left py-2 px-3 font-medium">Command</th>
            </tr>
          </thead>
          <tbody>
            {processes.map((process) => (
              <tr 
                key={process.pid}
                className="text-xs border-b border-white/5 hover:bg-white/5 transition-colors"
              >
                <td className="py-3 px-3">
                  <span className="font-mono text-gray-400">{process.pid}</span>
                </td>
                <td className="py-3 px-3">
                  <span className="text-white font-medium">{process.name}</span>
                </td>
                <td className="py-3 px-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-12 h-1.5 rounded-full bg-gray-700 overflow-hidden">
                      <div 
                        className="h-full transition-all duration-300 rounded-full"
                        style={{
                          width: `${Math.min(process.cpu, 100)}%`,
                          background: process.cpu > 50 
                            ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                            : process.cpu > 25
                            ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                            : 'linear-gradient(90deg, #10b981, #059669)'
                        }}
                      />
                    </div>
                    <span className={`font-semibold ${
                      process.cpu > 50 ? 'text-red-400' : 
                      process.cpu > 25 ? 'text-orange-400' : 
                      'text-green-400'
                    }`}>
                      {process.cpu.toFixed(1)}%
                    </span>
                  </div>
                </td>
                <td className="py-3 px-3 text-right">
                  <span className="text-gray-400">{process.mem.toFixed(1)}%</span>
                </td>
                <td className="py-3 px-3 max-w-xs">
                  <span className="text-gray-500 truncate block font-mono text-[10px]">
                    {process.command}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
