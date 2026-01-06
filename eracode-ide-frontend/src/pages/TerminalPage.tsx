import { useState, useRef, useEffect, forwardRef } from 'react'
import { X, ChevronDown, Plus, MoreHorizontal, Trash2, SquareSplitHorizontal, GripHorizontal } from 'lucide-react'
import WebSocketTerminal, { WebSocketTerminalHandle } from '../components/WebSocketTerminal'
import { TerminalType, CloudTerminalConfig } from '../types/terminal.types'

type TabType = 'problems' | 'output' | 'debug' | 'terminal' | 'ports'

interface Problem {
  file: string
  line: number
  message: string
  severity: 'error' | 'warning' | 'info'
}

interface TerminalPageProps {
  onClose?: () => void
  agentPanelOpen?: boolean
  sidebarPanelOpen?: boolean
  terminalType?: TerminalType | null
  cloudConfig?: CloudTerminalConfig
}

const TerminalPage = forwardRef<WebSocketTerminalHandle, TerminalPageProps>(
  ({ onClose, agentPanelOpen, sidebarPanelOpen, terminalType, cloudConfig }, ref) => {
    const [activeTab, setActiveTab] = useState<TabType>('terminal')
    const [terminalHeight, setTerminalHeight] = useState(() => {
      // Load saved height from localStorage, default to 300px
      const saved = localStorage.getItem('terminalHeight')
      return saved ? parseInt(saved) : 300
    })
    const [isResizing, setIsResizing] = useState(false)
    const resizeRef = useRef<HTMLDivElement>(null)
    
    const [outputLogs, setOutputLogs] = useState<string[]>([
      '23:13:48 [vite] (client) hmr update /src/index.css, /src/pages/TerminalPage.tsx (x2)',
      '23:14:12 [vite] page reload src/pages/MainPage.tsx',
      '23:14:15 [vite] hmr update /src/pages/TerminalPage.tsx',
    ])
    
    const [debugLogs, setDebugLogs] = useState<string[]>([
      'Debugger attached.',
      'Waiting for connection...',
    ])
    
    const [problems, setProblems] = useState<Problem[]>([
      { file: 'src/App.tsx', line: 12, message: 'Variable "count" is assigned but never used', severity: 'warning' },
      { file: 'src/utils/helper.ts', line: 45, message: 'Expected 2 arguments, but got 1', severity: 'error' },
      { file: 'src/pages/TerminalPage.tsx', line: 89, message: 'Unused import "useState"', severity: 'warning' },
    ])

    // ============================================
    // RESIZING LOGIC
    // ============================================
    useEffect(() => {
      const handleMouseMove = (e: MouseEvent) => {
        if (!isResizing) return
        
        // Calculate new height based on mouse position
        const windowHeight = window.innerHeight
        const newHeight = windowHeight - e.clientY
        
        // Set min/max constraints
        const minHeight = 150 // Minimum 150px
        const maxHeight = windowHeight - 200 // Leave 200px for editor
        
        const constrainedHeight = Math.min(Math.max(newHeight, minHeight), maxHeight)
        setTerminalHeight(constrainedHeight)
      }

      const handleMouseUp = () => {
        if (isResizing) {
          setIsResizing(false)
          // Save height to localStorage
          localStorage.setItem('terminalHeight', terminalHeight.toString())
        }
      }

      if (isResizing) {
        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)
        document.body.style.cursor = 'ns-resize'
        document.body.style.userSelect = 'none'
      }

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
    }, [isResizing, terminalHeight])

    const handleResizeStart = () => {
      setIsResizing(true)
    }

    return (
      <div 
        className="bg-[#1e1e1e] border-t border-[#2d2d30] flex flex-col w-full relative"
        style={{ height: `${terminalHeight}px` }}
      >
        {/* ✅ DRAGGABLE RESIZE HANDLE */}
        <div
          ref={resizeRef}
          onMouseDown={handleResizeStart}
          className={`absolute top-0 left-0 right-0 h-1 cursor-ns-resize group hover:bg-[#007acc] transition-colors z-50 ${
            isResizing ? 'bg-[#007acc]' : ''
          }`}
          title="Drag to resize"
        >
          {/* Visual indicator */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className={`px-3 py-0.5 rounded-full flex items-center gap-1 transition-all ${
              isResizing 
                ? 'bg-[#007acc] text-white scale-110' 
                : 'bg-[#2d2d30] text-[#969696] opacity-0 group-hover:opacity-100'
            }`}>
              <GripHorizontal size={12} />
            </div>
          </div>
        </div>

        {/* Header Bar */}
        <div className="flex items-center justify-between h-[35px] bg-[#252526] border-b border-[#2d2d30] shrink-0 overflow-visible">
          {/* Left: Tabs */}
          <div className="flex items-center h-full overflow-x-auto">
            {/* Problems Tab */}
            <button
              onClick={() => setActiveTab('problems')}
              className={`relative px-2 h-full text-[12px] flex items-center gap-1 transition-colors whitespace-nowrap ${
                activeTab === 'problems'
                  ? 'text-white border-t-2 border-t-[#007acc] bg-[#1e1e1e]'
                  : 'text-[#969696] hover:text-white border-t-2 border-t-transparent'
              }`}
            >
              Problems
              <span className={`text-[10px] px-1 rounded ${
                activeTab === 'problems' ? 'bg-[#007acc] text-white' : 'bg-[#3e3e42] text-[#cccccc]'
              }`}>
                {problems.length}
              </span>
            </button>

            {/* Output Tab */}
            <button
              onClick={() => setActiveTab('output')}
              className={`px-2 h-full text-[12px] transition-colors whitespace-nowrap ${
                activeTab === 'output'
                  ? 'text-white border-t-2 border-t-[#007acc] bg-[#1e1e1e]'
                  : 'text-[#969696] hover:text-white border-t-2 border-t-transparent'
              }`}
            >
              Output
            </button>

            {/* Debug Console Tab */}
            <button
              onClick={() => setActiveTab('debug')}
              className={`px-2 h-full text-[12px] transition-colors whitespace-nowrap ${
                activeTab === 'debug'
                  ? 'text-white border-t-2 border-t-[#007acc] bg-[#1e1e1e]'
                  : 'text-[#969696] hover:text-white border-t-2 border-t-transparent'
              }`}
            >
              Debug
            </button>

            {/* Terminal Tab */}
            <button
              onClick={() => setActiveTab('terminal')}
              className={`px-2 h-full text-[12px] transition-colors whitespace-nowrap ${
                activeTab === 'terminal'
                  ? 'text-white border-t-2 border-t-[#007acc] bg-[#1e1e1e]'
                  : 'text-[#969696] hover:text-white border-t-2 border-t-transparent'
              }`}
            >
              Terminal
            </button>

            {/* Ports Tab */}
            <button
              onClick={() => setActiveTab('ports')}
              className={`px-2 h-full text-[12px] transition-colors whitespace-nowrap ${
                activeTab === 'ports'
                  ? 'text-white border-t-2 border-t-[#007acc] bg-[#1e1e1e]'
                  : 'text-[#969696] hover:text-white border-t-2 border-t-transparent'
              }`}
            >
              Ports
            </button>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1 shrink-0 pr-2">
            {/* More Options */}
            <button
              className="p-1 text-[#cccccc] hover:bg-[#3e3e42] rounded transition-colors"
              title="More"
            >
              <MoreHorizontal size={14} />
            </button>

            {/* Close Button - ✅ NOW CHECKS FOR CLOUD TERMINALS */}
            <button
              onClick={() => {
                // Check if we need to show cloud terminal dialogs
                if (ref && typeof ref !== 'function' && ref.current) {
                  const canClose = ref.current.requestClose()
                  if (canClose && onClose) {
                    onClose()
                  }
                  // If canClose is false, dialogs will be shown
                } else if (onClose) {
                  // No ref or no cloud terminals, close immediately
                  onClose()
                }
              }}
              className="p-1 text-[#cccccc] hover:bg-[#f44747] hover:text-white rounded transition-colors"
              title="Close Terminal"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Content Area - All panels always mounted, visibility controlled */}
        <div className="flex-1 overflow-hidden relative">
          {/* Terminal Panel - ALWAYS MOUNTED */}
          <div className={`absolute inset-0 ${activeTab === 'terminal' ? 'block' : 'hidden'}`}>
            <WebSocketTerminal 
              ref={ref}
              terminalType={terminalType}
              cloudConfig={cloudConfig}
              onClosePanel={onClose}
            />
          </div>

          {/* Output Panel */}
          <div className={`absolute inset-0 ${activeTab === 'output' ? 'block' : 'hidden'}`}>
            <div className="w-full h-full p-2 overflow-y-auto font-mono text-[13px] text-[#cccccc]">
              {outputLogs.map((log, index) => (
                <div key={index} className="py-0.5 leading-relaxed">
                  {log}
                </div>
              ))}
            </div>
          </div>

          {/* Debug Panel */}
          <div className={`absolute inset-0 ${activeTab === 'debug' ? 'block' : 'hidden'}`}>
            <div className="w-full h-full p-2 overflow-y-auto font-mono text-[13px] text-[#cccccc]">
              {debugLogs.map((log, index) => (
                <div key={index} className="py-0.5 text-blue-400 leading-relaxed">
                  {log}
                </div>
              ))}
            </div>
          </div>

          {/* Problems Panel */}
          <div className={`absolute inset-0 ${activeTab === 'problems' ? 'block' : 'hidden'}`}>
            <div className="w-full h-full overflow-y-auto text-[13px]">
              <table className="w-full">
                <thead className="bg-[#252526] sticky top-0 border-b border-[#3e3e42]">
                  <tr className="text-left text-[#cccccc]">
                    <th className="px-3 py-1.5 font-normal text-xs">Type</th>
                    <th className="px-3 py-1.5 font-normal text-xs">Description</th>
                    <th className="px-3 py-1.5 font-normal text-xs">File</th>
                    <th className="px-3 py-1.5 font-normal text-xs">Line</th>
                  </tr>
                </thead>
                <tbody>
                  {problems.map((problem, index) => (
                    <tr
                      key={index}
                      className="border-b border-[#2d2d30] hover:bg-[#2a2d2e] cursor-pointer"
                    >
                      <td className="px-3 py-1.5">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs ${
                            problem.severity === 'error'
                              ? 'text-[#f48771]'
                              : problem.severity === 'warning'
                              ? 'text-[#cca700]'
                              : 'text-[#75beff]'
                          }`}
                        >
                          <span className="text-base leading-none">⚠</span>
                          {problem.severity}
                        </span>
                      </td>
                      <td className="px-3 py-1.5 text-[#cccccc]">{problem.message}</td>
                      <td className="px-3 py-1.5 text-[#969696] text-xs">{problem.file}</td>
                      <td className="px-3 py-1.5 text-[#969696] text-xs">[{problem.line}, 1]</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Ports Panel */}
          <div className={`absolute inset-0 ${activeTab === 'ports' ? 'block' : 'hidden'}`}>
            <div className="w-full h-full flex items-center justify-center text-[#969696] text-sm">
              <p>No forwarded ports</p>
            </div>
          </div>
        </div>
      </div>
    )
  }
)

TerminalPage.displayName = 'TerminalPage'

export default TerminalPage
