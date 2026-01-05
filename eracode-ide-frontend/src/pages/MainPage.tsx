import { useState, useEffect, useRef } from 'react'
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

// ✅ Import handle type
import { WebSocketTerminalHandle } from '../components/WebSocketTerminal'

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
  
  // ✅ NEW: Terminal ref for handling close
  const terminalRef = useRef<WebSocketTerminalHandle>(null)
  
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

  // ✅ UPDATED - Handle terminal toggle with cloud terminal check
  const handleTerminalToggle = () => {
    if (showTerminal) {
      // Try to close - terminal will show dialogs if needed
      const canClose = terminalRef.current?.requestClose()
      if (canClose) {
        setShowTerminal(false)
        setTerminalType(null)
        setCloudConfig(undefined)
      }
      // If canClose is false, dialogs will be shown and terminal will close itself
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

  // ✅ NEW: Handle terminal panel close (called by WebSocketTerminal)
  const handleTerminalPanelClose = () => {
    setShowTerminal(false)
    setTerminalType(null)
    setCloudConfig(undefined)
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
    <div className="h-screen w-full flex flex-col bg-dark-surface text-text-primary overflow-hidden">
      {/* Top Bar with Terminal & AI Agent Buttons */}
      <div className="h-10 bg-dark-header border-b border-dark-border flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-text-primary">EraCODE IDE</h1>
        </div>

        <div className="flex items-center gap-3">
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
            <TerminalIcon 
              size={18} 
              className={`transition-all ${
                showTerminal 
                  ? 'drop-shadow-[0_0_8px_rgba(59,130,246,1)]' 
                  : ''
              }`}
            />
            <span className="text-xs font-medium">
              {showTerminal ? 'Terminal Active' : 'Open Terminal'}
            </span>
            <kbd className="px-1.5 py-0.5 bg-dark-base rounded text-[10px]">
              Ctrl+`
            </kbd>
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
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left: Sidebar (Always visible - 48px) */}
        <Sidebar 
          onItemClick={handleSidebarClick}
          activeItem={showLeftPanel ? activeLeftPanel : ''}
          onHoverChange={setIsSidebarHovered}
        />

        {/* Everything else to the right of sidebar */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel */}
          <div 
            className={`
              transition-all duration-300 ease-in-out overflow-hidden
              ${showLeftPanel ? 'opacity-100' : 'w-0 opacity-0'}
            `}
          >
            {renderLeftPanel()}
          </div>

          {/* Center: Welcome OR Editor */}
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
            className="absolute bottom-0 right-0 z-50 transition-all duration-200"
            style={{
              left: `${getTerminalLeftPosition()}px`,
              right: showAgentPanel ? '340px' : '0'
            }}
          >
            <TerminalPage 
              ref={terminalRef}
              onClose={handleTerminalPanelClose}
              agentPanelOpen={showAgentPanel}
              sidebarPanelOpen={showLeftPanel}
              terminalType={terminalType}
              cloudConfig={cloudConfig}
            />
          </div>
        )}
      </div>

    </div>
  )
}
