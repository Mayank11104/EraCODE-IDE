import { useState } from 'react'
import Sidebar from '../components/Sidebar'

// Import all panels
import ExplorerPanel from '../components/panels/ExplorerPanel'
import SearchPanel from '../components/panels/SearchPanel'
import GitPanel from '../components/panels/GitPanel'
import DebugPanel from '../components/panels/DebugPanel'
import AIAgentPanel from '../components/panels/AIAgentPanel'
import WorkflowsPanel from '../components/panels/WorkflowsPanel'
import CodeReviewPanel from '../components/panels/CodeReviewPanel'
import CICDPanel from '../components/panels/CICDPanel'
import DockerPanel from '../components/panels/DockerPanel'
import DeployPanel from '../components/panels/DeployPanel'
import MonitoringPanel from '../components/panels/MonitoringPanel'
import APITesterPanel from '../components/panels/APITesterPanel'
import DatabasePanel from '../components/panels/DatabasePanel'
import VisualizerPanel from '../components/panels/VisualizerPanel'

export default function MainPage() {
  const [activePanel, setActivePanel] = useState('explorer')
  const [showPanel, setShowPanel] = useState(true)

  // Handle sidebar icon clicks
  const handleSidebarClick = (panelId: string) => {
    if (activePanel === panelId) {
      // Toggle if clicking the same panel
      setShowPanel(!showPanel)
    } else {
      // Switch to new panel
      setActivePanel(panelId)
      setShowPanel(true)
    }
  }

  // Render the active panel
  const renderPanel = () => {
    switch (activePanel) {
      case 'explorer': return <ExplorerPanel />
      case 'search': return <SearchPanel />
      case 'git': return <GitPanel />
      case 'debug': return <DebugPanel />
      case 'agent': return <AIAgentPanel />
      case 'workflows': return <WorkflowsPanel />
      case 'review': return <CodeReviewPanel />
      case 'cicd': return <CICDPanel />
      case 'docker': return <DockerPanel />
      case 'deploy': return <DeployPanel />
      case 'monitoring': return <MonitoringPanel />
      case 'api': return <APITesterPanel />
      case 'database': return <DatabasePanel />
      case 'visualizer': return <VisualizerPanel />
      default: return <ExplorerPanel />
    }
  }

  return (
    <div className="h-screen w-full flex flex-col bg-dark-surface text-text-primary overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Sidebar */}
        <Sidebar 
          onItemClick={handleSidebarClick}
          activeItem={activePanel}
        />

        {/* Dynamic Panel (Animated) */}
        <div 
          className={`
            transition-all duration-300 ease-in-out overflow-hidden
            ${showPanel ? 'opacity-100' : 'w-0 opacity-0'}
          `}
        >
          {renderPanel()}
        </div>

        {/* Center: Editor Area */}
        <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
          <div className="flex-1 flex items-center justify-center bg-dark-surface">
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-bold">📝 EraCode IDE</h1>
              <p className="text-text-secondary">14 Panel Components Ready!</p>
              <div className="text-sm text-text-secondary bg-dark-hover p-4 rounded-lg border border-dark-border max-w-md">
                <p className="mb-2">✅ Sidebar - 14 items</p>
                <p className="mb-2">✅ 14 Panel Components</p>
                <p className="mb-2 text-green-400">✅ Dynamic Switching</p>
                <p className="text-xs mt-3 text-text-secondary">
                  Click any sidebar icon to see its panel!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
