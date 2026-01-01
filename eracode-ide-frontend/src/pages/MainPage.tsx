import { useState } from 'react'
import { Bot } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import AgentPanel from '../components/AgentPanel'

// Import LEFT panels only
import ExplorerPanel from '../components/panels/ExplorerPanel'
import SearchPanel from '../components/panels/SearchPanel'
import GitPanel from '../components/panels/GitPanel'
import DebugPanel from '../components/panels/DebugPanel'
import CICDPanel from '../components/panels/CICDPanel'
import DockerPanel from '../components/panels/DockerPanel'
import DeployPanel from '../components/panels/DeployPanel'
import MonitoringPanel from '../components/panels/MonitoringPanel'
import APITesterPanel from '../components/panels/APITesterPanel'
import DatabasePanel from '../components/panels/DatabasePanel'
import VisualizerPanel from '../components/panels/VisualizerPanel'

export default function MainPage() {
  const [activeLeftPanel, setActiveLeftPanel] = useState('explorer')
  const [showLeftPanel, setShowLeftPanel] = useState(true)
  const [showAgentPanel, setShowAgentPanel] = useState(false) // Start closed

  const handleSidebarClick = (panelId: string) => {
    if (activeLeftPanel === panelId) {
      setShowLeftPanel(!showLeftPanel)
    } else {
      setActiveLeftPanel(panelId)
      setShowLeftPanel(true)
    }
  }

  const renderLeftPanel = () => {
    switch (activeLeftPanel) {
      case 'explorer': return <ExplorerPanel />
      case 'search': return <SearchPanel />
      case 'git': return <GitPanel />
      case 'debug': return <DebugPanel />
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
      {/* Top Bar with AI Agent Button */}
      <div className="h-10 bg-dark-header border-b border-dark-border flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <span className="text-l font-bold text-text-primary">EraCODE IDE</span>
          
        </div>

        {/* AI Agent Toggle Button */}
        <button
          onClick={() => setShowAgentPanel(!showAgentPanel)}
          className={`
            flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all
            ${showAgentPanel
              ? 'bg-purple-500/20 border-2 border-purple-400 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.5)]'
              : 'bg-dark-surface border border-dark-border text-text-secondary hover:border-purple-400/50 hover:text-purple-400'
            }
          `}
          title="Toggle AI Agent"
        >
          <Bot 
            size={18} 
            className={`transition-all ${
              showAgentPanel 
                ? 'drop-shadow-[0_0_8px_rgba(168,85,247,1)]' 
                : ''
            }`}
          />
          <span className="text-xs font-medium">
            {showAgentPanel ? 'AI Agent Active' : 'Open AI Agent'}
          </span>
          <kbd className="px-1.5 py-0.5 bg-dark-base rounded text-[10px]">
            Ctrl+L
          </kbd>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Sidebar */}
        <Sidebar 
          onItemClick={handleSidebarClick}
          activeItem={showLeftPanel ? activeLeftPanel : ''}
        />

        {/* Left Panel (Dynamic) */}
        <div 
          className={`
            transition-all duration-300 ease-in-out overflow-hidden
            ${showLeftPanel ? 'opacity-100' : 'w-0 opacity-0'}
          `}
        >
          {renderLeftPanel()}
        </div>

        {/* Center: Editor Area */}
        <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
          <div className="flex-1 flex items-center justify-center bg-dark-surface">
            <div className="text-center space-y-4">
              <div className="w-24 h-24 mx-auto mb-4">
                <svg viewBox="0 0 100 100" className="w-full h-full text-white">
                  <path d="M50 10 L90 30 L90 70 L50 90 L10 70 L10 30 Z" fill="currentColor" />
                </svg>
              </div>
              <h1 className="text-5xl font-bold text-white">EraCODE IDE</h1>
              <p className="text-text-secondary text-lg">eracode_ide</p>
              
              <div className="mt-8 space-y-2 text-sm">
                <div className="flex items-center justify-center gap-4 text-text-secondary">
                  <span>Switch to Agent Manager</span>
                  <kbd className="px-2 py-1 bg-dark-hover rounded text-xs">Ctrl + E</kbd>
                </div>
                <div className="flex items-center justify-center gap-4 text-text-secondary">
                  <span>Code with Agent</span>
                  <kbd className="px-2 py-1 bg-dark-hover rounded text-xs">Ctrl + L</kbd>
                </div>
                <div className="flex items-center justify-center gap-4 text-text-secondary">
                  <span>Edit code inline</span>
                  <kbd className="px-2 py-1 bg-dark-hover rounded text-xs">Ctrl + I</kbd>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Agent Panel - Slide In/Out */}
        <div 
          className={`
            transition-all duration-300 ease-in-out overflow-hidden
            ${showAgentPanel ? 'w-[340px] opacity-100' : 'w-0 opacity-0'}
          `}
        >
          <AgentPanel />
        </div>
      </div>
    </div>
  )
}
