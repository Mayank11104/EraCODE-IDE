import { useState, useEffect } from 'react'
import { Bot } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import AgentPanel from '../components/AgentPanel'

// Import LEFT panels
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

// Import CENTER pages
import WelcomePage from './WelcomePage'
import EditorPage from './EditorPage'

// Import store
import { useEditorStore } from '../stores/editorStore'

export default function MainPage() {
  // Store
  const openFiles = useEditorStore((state) => state.openFiles)
  
  // Left panel state
  const [activeLeftPanel, setActiveLeftPanel] = useState('explorer')
  const [showLeftPanel, setShowLeftPanel] = useState(true)
  
  // Right agent panel state
  const [showAgentPanel, setShowAgentPanel] = useState(false)
  
  // Center page state - starts as welcome, switches to editor once a file is opened
  const [showEditor, setShowEditor] = useState(false)

  // Auto-switch to Editor when a file is opened (PERMANENT for session)
  useEffect(() => {
    if (openFiles.length > 0 && !showEditor) {
      setShowEditor(true)
    }
  }, [openFiles.length, showEditor])

  const handleSidebarClick = (panelId: string) => {
    if (activeLeftPanel === panelId) {
      setShowLeftPanel(!showLeftPanel)
    } else {
      setActiveLeftPanel(panelId)
      setShowLeftPanel(true)
    }
  }

  // Render left panel based on active selection
  const renderLeftPanel = () => {
    if (!showLeftPanel) return null

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
      <div className="h-10 bg-dark-header border-b border-dark-border flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-text-primary">EraCODE IDE</h1>
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

        {/* Left Panel */}
        <div 
          className={`
            transition-all duration-300 ease-in-out overflow-hidden
            ${showLeftPanel ? 'opacity-100' : 'w-0 opacity-0'}
          `}
        >
          {renderLeftPanel()}
        </div>

        {/* Center: Welcome OR Editor (permanent switch) */}
        <div className="flex-1 flex flex-col min-w-0">
          {showEditor ? <EditorPage /> : <WelcomePage />}
        </div>

        {/* Right: Agent Panel */}
        <div 
          className={`
            transition-all duration-300 ease-in-out overflow-hidden
            ${showAgentPanel ? 'w-[340px] opacity-100' : 'w-0 opacity-0'}
          `}
        >
          {showAgentPanel && <AgentPanel onClose={() => setShowAgentPanel(false)} />}
        </div>
      </div>
    </div>
  )
}
