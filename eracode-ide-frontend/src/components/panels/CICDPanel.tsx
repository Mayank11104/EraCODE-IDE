// src/components/panels/CICDPanel.tsx

import { useState } from 'react'
import { Play, Clock, CheckCircle2, XCircle, Settings, Plus, GitBranch } from 'lucide-react'
import PipelineOverview from './cicd/PipelineOverview'
import PipelineBuilder from './cicd/PipelineBuilder'
import BuildHistory from './cicd/BuildHistory'

type Tab = 'overview' | 'builder' | 'history'

export default function CICDPanel() {
  const [activeTab, setActiveTab] = useState<Tab>('overview')

  const tabs = [
    { id: 'overview', label: 'Overview', icon: GitBranch },
    { id: 'builder', label: 'Pipeline Builder', icon: Settings },
    { id: 'history', label: 'Build History', icon: Clock },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="px-6 py-4 border-b flex items-center justify-between"
        style={{
          background: 'rgba(255, 255, 255, 0.02)',
          borderColor: 'rgba(255, 255, 255, 0.05)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="p-2 rounded-xl"
            style={{
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(147, 51, 234, 0.3) 100%)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
            }}
          >
            <Play size={20} className="text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">CI/CD Pipeline</h2>
            <p className="text-xs text-gray-400">Continuous Integration & Deployment</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <button
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2"
            style={{
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.8) 0%, rgba(147, 51, 234, 0.9) 100%)',
              border: '1px solid rgba(168, 85, 247, 0.6)',
              color: 'white',
              boxShadow: '0 4px 15px rgba(168, 85, 247, 0.3)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.02)'
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(168, 85, 247, 0.4)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(168, 85, 247, 0.3)'
            }}
          >
            <Plus size={16} />
            New Pipeline
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="px-6 py-3 border-b flex items-center gap-2"
        style={{
          background: 'rgba(255, 255, 255, 0.01)',
          borderColor: 'rgba(255, 255, 255, 0.05)',
        }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2"
              style={{
                background: isActive
                  ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(147, 51, 234, 0.3) 100%)'
                  : 'rgba(255, 255, 255, 0.04)',
                border: isActive
                  ? '1px solid rgba(168, 85, 247, 0.6)'
                  : '1px solid rgba(255, 255, 255, 0.1)',
                color: isActive ? 'rgb(168, 85, 247)' : 'rgba(255, 255, 255, 0.6)',
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'overview' && <PipelineOverview />}
        {activeTab === 'builder' && <PipelineBuilder />}
        {activeTab === 'history' && <BuildHistory />}
      </div>
    </div>
  )
}
