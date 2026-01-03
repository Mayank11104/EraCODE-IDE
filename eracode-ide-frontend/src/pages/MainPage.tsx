import { useState, useEffect } from 'react'
import { Bot, Terminal as TerminalIcon } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import AgentPanel from '../components/AgentPanel'

import TerminalTypeSelector from '../components/TerminalTypeSelector'

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
import TerminalPage from './TerminalPage'

// Import store
import { useEditorStore } from '../stores/editorStore'

// Import types
import { TerminalType, CloudTerminalConfig } from '../types/terminal.types'

export default function MainPage() {
  // Store
  const openFiles = useEditorStore((state) => state.openFiles)

  // Left panel state
  const [activeLeftPanel, setActiveLeftPanel] = useState('explorer')
  const [showLeftPanel, setShowLeftPanel] = useState(true)

  // Right agent panel state
  const [showAgentPanel, setShowAgentPanel] = useState(false)

  // Terminal state
  const [showTerminal, setShowTerminal] = useState(false)
  const [showTerminalSelector, setShowTerminalSelector] = useState(false)
  const [terminalType, setTerminalType] = useState<TerminalType | null>(null)
  const [cloudConfig, setCloudConfig] = useState<CloudTerminalConfig>()

  // Center page state - starts as welcome, switches to editor once a file is opened
  const [showEditor, setShowEditor] = useState(false)

  // Track sidebar hover state
  const [isSidebarHovered, setIsSidebarHovered] = useState(false)

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

  // Handle terminal toggle with selector
  const handleTerminalToggle = () => {
    if (showTerminal) {
      // If terminal is already open, just close it
      setShowTerminal(false)
      setTerminalType(null)
      setCloudConfig(undefined)
    } else {
      // If opening terminal, show type selector first
      setShowTerminalSelector(true)
    }
  }

  // Handle terminal type selection
  const handleTerminalTypeSelect = (type: TerminalType, config?: CloudTerminalConfig) => {
    setTerminalType(type)
    setCloudConfig(config)
    setShowTerminalSelector(false)
    setShowTerminal(true)
  }

  // Handle terminal selector cancel
  const handleTerminalSelectorCancel = () => {
    setShowTerminalSelector(false)
  }

  // Calculate terminal left position dynamically
  const getTerminalLeftPosition = () => {
    const sidebarWidth = isSidebarHovered ? 145 : 48
    const panelWidth = showLeftPanel ? 250 : 0
    return sidebarWidth + panelWidth
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
    <div className="h-screen bg-dark-bg text-text-primary flex flex-col overflow-hidden">
      {/* Top Bar with Terminal & AI Agent Buttons */}
      <div className="h-9 bg-dark-surface border-b border-dark-border flex items-center justify-between px-2 shrink-0">
        <div className="text-xs font-semibold text-text-secondary">EraCODE IDE</div>

        <div className="flex items-center gap-2">
          {/* Terminal Toggle Button */}
          <button
            onClick={handleTerminalToggle}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all
              ${showTerminal
                ? 'bg-blue-500/20 border-2 border-blue-400 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)]'
                : 'bg-dark-surface border border-dark-border text-text-secondary hover:border-blue-400/50 hover:text-blue-400'
              }
            `}
            title="Toggle Terminal"
          >
            <TerminalIcon size={16} />
            <span className="text-xs">{showTerminal ? 'Terminal Active' : 'Open Terminal'}</span>
            <span className="text-[10px] opacity-60">Ctrl+`</span>
          </button>

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
            <Bot size={16} />
            <span className="text-xs">{showAgentPanel ? 'AI Agent Active' : 'Open AI Agent'}</span>
            <span className="text-[10px] opacity-60">Ctrl+L</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Sidebar (Always visible - 48px) */}
        <Sidebar
          activePanel={activeLeftPanel}
          onPanelClick={handleSidebarClick}
          onHoverChange={setIsSidebarHovered}
        />

        {/* Everything else to the right of sidebar */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel */}
          {renderLeftPanel()}

          {/* Center: Welcome OR Editor */}
          <div className="flex-1 overflow-hidden">
            {showEditor ? <EditorPage /> : <WelcomePage />}
          </div>

          {/* Right: Agent Panel */}
          {showAgentPanel && <AgentPanel onClose={() => setShowAgentPanel(false)} />}
        </div>
      </div>

      {/* Terminal Type Selector Modal */}
      {showTerminalSelector && (
        <TerminalTypeSelector
          onSelect={handleTerminalTypeSelect}
          onCancel={handleTerminalSelectorCancel}
        />
      )}

      {/* Bottom Section: Terminal - DYNAMIC POSITIONING */}
      {showTerminal && (
  <div
    className="fixed bottom-0 z-30 border-t border-[#2d2d30]"
    style={{ 
      left: `${getTerminalLeftPosition()}px`, 
      right: showAgentPanel ? '350px' : '0' 
    }}
  >
    <TerminalPage
      onClose={() => {
        setShowTerminal(false)
        setTerminalType(null)
        setCloudConfig(undefined)
      }}
      agentPanelOpen={showAgentPanel}
      sidebarPanelOpen={showLeftPanel}
      terminalType={terminalType}
      cloudConfig={cloudConfig}
    />
  </div>
)}

    </div>
  )
}
