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
import ProjectsPanel from '../components/panels/ProjectsPanel'

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
  const [previousPanel, setPreviousPanel] = useState<string | null>(null) // ⭐ NEW - Track previous panel

  // ✅ API Tester width state - Default 616px, Range 455-800px
  const [apiPanelWidth, setApiPanelWidth] = useState(616)
  const [isResizingApi, setIsResizingApi] = useState(false)
  // ✅ Visualizer width state - Default 800px
  const [visualizerPanelWidth, setVisualizerPanelWidth] = useState(1000)
  const [isResizingVisualizer, setIsResizingVisualizer] = useState(false)
  // ✅ Docker width state - Default 600px
  const [dockerPanelWidth, setDockerPanelWidth] = useState(1000)
  const [isResizingDocker, setIsResizingDocker] = useState(false)

  // Right agent panel state
  const [showAgentPanel, setShowAgentPanel] = useState(false)

  // Terminal state
  const [showTerminal, setShowTerminal] = useState(false)
  const [showTerminalSelector, setShowTerminalSelector] = useState(false)
  const [terminalType, setTerminalType] = useState<TerminalType | null>(null)
  const [cloudConfig, setCloudConfig] = useState<CloudTerminalConfig>()

  // ✅ Terminal ref for handling close
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

  // ✅ Handle API panel resize - Min 455px, Max 800px
  const handleApiResizeStart = (e: React.MouseEvent) => {
    setIsResizingApi(true)
    e.preventDefault()
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingApi && !isResizingVisualizer && !isResizingDocker) return

      const sidebarWidth = isSidebarHovered ? 145 : 48
      const newWidth = e.clientX - sidebarWidth

      if (isResizingApi) {
        // ✅ Min: 455px, Max: 800px
        const clampedWidth = Math.max(1000, Math.min(newWidth, 1000))
        setApiPanelWidth(clampedWidth)
      } else if (isResizingVisualizer) {
        // ✅ Min: 455px, Max: 1200px (Visualizer needs more space)
        const clampedWidth = Math.max(1000, Math.min(newWidth, 1200))
        setVisualizerPanelWidth(clampedWidth)
      } else if (isResizingDocker) {
        // ✅ Min: 400px, Max: 1000px
        const clampedWidth = Math.max(400, Math.min(newWidth, 1000))
        setDockerPanelWidth(clampedWidth)
      }
    }

    const handleMouseUp = () => {
      setIsResizingApi(false)
      setIsResizingVisualizer(false)
      setIsResizingDocker(false)
    }

    if (isResizingApi || isResizingVisualizer || isResizingDocker) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isResizingApi, isResizingVisualizer, isResizingDocker, isSidebarHovered])

  // ⭐ UPDATED - Handle sidebar click with Projects panel memory
  const handleSidebarClick = (panelId: string) => {
    // If clicking Projects
    if (panelId === 'projects') {
      if (activeLeftPanel === 'projects') {
        // Closing Projects - restore previous panel
        if (previousPanel) {
          setActiveLeftPanel(previousPanel)
          setPreviousPanel(null)
        } else {
          setActiveLeftPanel('explorer')
        }
      } else {
        // Opening Projects - save current panel
        setPreviousPanel(activeLeftPanel)
        setActiveLeftPanel('projects')
        setShowLeftPanel(true)
      }
    } else {
      // Normal panel behavior
      if (activeLeftPanel === panelId) {
        setShowLeftPanel(!showLeftPanel)
      } else {
        setActiveLeftPanel(panelId)
        setShowLeftPanel(true)
      }
    }
  }

  // ✅ Handle terminal toggle with cloud terminal check
  const handleTerminalToggle = () => {
    if (showTerminal) {
      const canClose = terminalRef.current?.requestClose()
      if (canClose) {
        setShowTerminal(false)
        setTerminalType(null)
        setCloudConfig(undefined)
      }
    } else {
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

  // ✅ Handle terminal panel close
  const handleTerminalPanelClose = () => {
    setShowTerminal(false)
    setTerminalType(null)
    setCloudConfig(undefined)
  }

  // ✅ Calculate terminal left position - Projects panel is 1400px fixed
  const getTerminalLeftPosition = () => {
    const sidebarWidth = isSidebarHovered ? 145 : 48
    if (!showLeftPanel) return sidebarWidth

    // ✅ ONLY use dynamic width for API panel and Visualizer, fixed 250px for others
    let panelWidth = 250
    if (activeLeftPanel === 'api') panelWidth = apiPanelWidth
    if (activeLeftPanel === 'visualizer') panelWidth = visualizerPanelWidth
    if (activeLeftPanel === 'docker') panelWidth = dockerPanelWidth
    if (activeLeftPanel === 'projects') panelWidth = 1400
    if (activeLeftPanel === 'database') panelWidth = 1400 // Full screen database panel


    return sidebarWidth + panelWidth
  }

  // ✅ Render left panel - ONLY API panel gets resize handle
  const renderLeftPanel = () => {
    if (!showLeftPanel) return null

    const panelContent = (() => {
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
        case 'projects': return <ProjectsPanel />
        default: return <ExplorerPanel />
      }
    })()

    // ✅ ONLY API panel is resizable
    // ✅ Projects panel: 1400px fixed, API & Visualizer panels are resizable
    const isApiPanel = activeLeftPanel === 'api'
    const isVisualizerPanel = activeLeftPanel === 'visualizer'
    const isDockerPanel = activeLeftPanel === 'docker'
    const isProjectsPanel = activeLeftPanel === 'projects'

    let width = 250
    if (isApiPanel) width = apiPanelWidth
    if (isVisualizerPanel) width = visualizerPanelWidth
    if (isProjectsPanel || activeLeftPanel === 'database') width = 1400
    if (isDockerPanel) width = dockerPanelWidth
    if (isProjectsPanel) width = 1400

    return (
      <div
        className="h-full bg-dark-surface border-r border-dark-border relative shrink-0"
        style={{ width: `${width}px` }}
      >
        {panelContent}

        {/* ✅ Resize handle ONLY for API panel */}
        {isApiPanel && (
          <div
            onMouseDown={handleApiResizeStart}
            className={`
              absolute top-0 right-0 w-1 h-full cursor-col-resize transition-all z-10
              ${isResizingApi
                ? 'bg-blue-500 w-1'
                : 'hover:bg-blue-500/50'
              }
            `}
            title="Drag to resize API Tester panel"
          >
            {isResizingApi && (
              <div className="absolute top-2 -right-16 bg-dark-bg border border-blue-500 rounded px-2 py-1 text-xs text-blue-400 shadow-lg pointer-events-none">
                {apiPanelWidth}px
              </div>
            )}
          </div>
        )}

        {/* ✅ Resize handle ONLY for Visualizer panel */}
        {isVisualizerPanel && (
          <div
            onMouseDown={(e) => {
              setIsResizingVisualizer(true)
              e.preventDefault()
            }}
            className={`
              absolute top-0 right-0 w-1 h-full cursor-col-resize transition-all z-10
              ${isResizingVisualizer
                ? 'bg-purple-500 w-1'
                : 'hover:bg-purple-500/50'
              }
            `}
            title="Drag to resize Visualizer panel"
          >
            {isResizingVisualizer && (
              <div className="absolute top-2 -right-16 bg-dark-bg border border-purple-500 rounded px-2 py-1 text-xs text-purple-400 shadow-lg pointer-events-none">
                {visualizerPanelWidth}px
              </div>
            )}
          </div>
        )}

        {/* ✅ Resize handle ONLY for Docker panel */}
        {isDockerPanel && (
          <div
            onMouseDown={(e) => {
              setIsResizingDocker(true)
              e.preventDefault()
            }}
            className={`
              absolute top-0 right-0 w-1 h-full cursor-col-resize transition-all z-10
              ${isResizingDocker
                ? 'bg-cyan-500 w-1'
                : 'hover:bg-cyan-500/50'
              }
            `}
            title="Drag to resize Docker panel"
          >
            {isResizingDocker && (
              <div className="absolute top-2 -right-16 bg-dark-bg border border-cyan-500 rounded px-2 py-1 text-xs text-cyan-400 shadow-lg pointer-events-none">
                {dockerPanelWidth}px
              </div>
            )}
          </div>
        )}
      </div>
    )
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
              className={`transition-all ${showTerminal
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
              className={`transition-all ${showAgentPanel
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
          {/* ✅ Left Panel - Only API is resizable, Projects is 1400px fixed */}
          {renderLeftPanel()}

          {/* Center: Welcome OR Editor - HIDE when Projects or Database panel is open */}
          {activeLeftPanel !== 'projects' && activeLeftPanel !== 'database' && (
            <div className="flex-1 flex flex-col min-w-0">
              {showEditor ? <EditorPage /> : <WelcomePage />}
            </div>
          )}

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
