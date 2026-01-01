import { useState, useRef, useEffect } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import { X, ChevronDown, Plus, MoreHorizontal, Trash2, SquareSplitHorizontal } from 'lucide-react';
import 'xterm/css/xterm.css';

type TabType = 'problems' | 'output' | 'debug' | 'terminal' | 'ports';
type TerminalType = 'bash' | 'powershell' | 'cmd';

interface Problem {
  file: string;
  line: number;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

interface TerminalPageProps {
  onClose?: () => void;
  agentPanelOpen?: boolean;     // ✅ For right side (Agent Panel)
  sidebarPanelOpen?: boolean;   // ✅ For left side (Sidebar Panels)
}

export default function TerminalPage({ onClose, agentPanelOpen, sidebarPanelOpen }: TerminalPageProps) {
  const [activeTab, setActiveTab] = useState<TabType>('terminal');
  const [selectedTerminal, setSelectedTerminal] = useState<TerminalType>('bash');
  const [showTerminalDropdown, setShowTerminalDropdown] = useState(false);
  
  const [outputLogs, setOutputLogs] = useState<string[]>([
    '23:13:48 [vite] (client) hmr update /src/index.css, /src/pages/TerminalPage.tsx (x2)',
    '23:14:12 [vite] page reload src/pages/MainPage.tsx',
    '23:14:15 [vite] hmr update /src/pages/TerminalPage.tsx',
  ]);
  
  const [debugLogs, setDebugLogs] = useState<string[]>([
    'Debugger attached.',
    'Waiting for connection...',
  ]);
  
  const [problems, setProblems] = useState<Problem[]>([
    { file: 'src/App.tsx', line: 12, message: 'Variable "count" is assigned but never used', severity: 'warning' },
    { file: 'src/utils/helper.ts', line: 45, message: 'Expected 2 arguments, but got 1', severity: 'error' },
    { file: 'src/pages/TerminalPage.tsx', line: 89, message: 'Unused import "useState"', severity: 'warning' },
  ]);

  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowTerminalDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initialize xterm.js
  useEffect(() => {
    if (!terminalRef.current || xtermRef.current) return;

    const terminal = new XTerm({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: "'Cascadia Code', 'Courier New', monospace",
      theme: {
        background: '#1e1e1e',
        foreground: '#cccccc',
        cursor: '#ffffff',
        black: '#000000',
        red: '#cd3131',
        green: '#0dbc79',
        yellow: '#e5e510',
        blue: '#2472c8',
        magenta: '#bc3fbc',
        cyan: '#11a8cd',
        white: '#e5e5e5',
      },
      scrollback: 1000,
    });

    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    terminal.open(terminalRef.current);
    fitAddon.fit();

    // Welcome message
    terminal.writeln('\x1b[1;32mWelcome to EraCODE IDE\x1b[0m');
    terminal.writeln('');
    terminal.write('$ ');

    // Handle user input
    let currentLine = '';
    terminal.onData((data) => {
      const code = data.charCodeAt(0);

      if (code === 13) {
        // Enter key
        terminal.writeln('');
        if (currentLine.trim()) {
          executeCommand(currentLine.trim(), terminal);
        }
        terminal.write('$ ');
        currentLine = '';
      } else if (code === 127) {
        // Backspace
        if (currentLine.length > 0) {
          currentLine = currentLine.slice(0, -1);
          terminal.write('\b \b');
        }
      } else if (code >= 32 && code <= 126) {
        // Printable characters
        currentLine += data;
        terminal.write(data);
      }
    });

    xtermRef.current = terminal;
    fitAddonRef.current = fitAddon;

    // Fit on resize
    const handleResize = () => {
      fitAddon.fit();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      terminal.dispose();
    };
  }, []);

  // ✅ Refit terminal when tab changes OR panels open/close
  useEffect(() => {
    if (activeTab === 'terminal' && fitAddonRef.current) {
      setTimeout(() => {
        fitAddonRef.current?.fit();
      }, 100);
    }
  }, [activeTab, agentPanelOpen, sidebarPanelOpen]);  // ✅ Refit on panel changes

  const executeCommand = (command: string, terminal: XTerm) => {
    const parts = command.split(' ');
    const cmd = parts[0];

    switch (cmd) {
      case 'clear':
        terminal.clear();
        break;
      case 'help':
        terminal.writeln('\x1b[1;36mAvailable commands:\x1b[0m');
        terminal.writeln('  clear  - Clear terminal');
        terminal.writeln('  help   - Show this help');
        terminal.writeln('  echo   - Echo text');
        terminal.writeln('  date   - Show current date');
        break;
      case 'echo':
        terminal.writeln(parts.slice(1).join(' '));
        break;
      case 'date':
        terminal.writeln(new Date().toString());
        break;
      default:
        terminal.writeln(`\x1b[1;31mCommand not found: ${cmd}\x1b[0m`);
        terminal.writeln('Type "help" for available commands');
    }
  };

  const clearTerminal = () => {
    xtermRef.current?.clear();
    xtermRef.current?.write('$ ');
  };

  const getTerminalLabel = () => {
    switch (selectedTerminal) {
      case 'bash': return 'bash';
      case 'powershell': return 'powershell';
      case 'cmd': return 'cmd';
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'terminal':
        return <div ref={terminalRef} className="w-full h-full" />;

      case 'output':
        return (
          <div className="w-full h-full p-2 overflow-y-auto font-mono text-[13px] text-[#cccccc]">
            {outputLogs.map((log, index) => (
              <div key={index} className="py-0.5 leading-relaxed">
                {log}
              </div>
            ))}
          </div>
        );

      case 'debug':
        return (
          <div className="w-full h-full p-2 overflow-y-auto font-mono text-[13px] text-[#cccccc]">
            {debugLogs.map((log, index) => (
              <div key={index} className="py-0.5 text-blue-400 leading-relaxed">
                {log}
              </div>
            ))}
          </div>
        );

      case 'problems':
        return (
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
        );

      case 'ports':
        return (
          <div className="w-full h-full flex items-center justify-center text-[#969696] text-sm">
            <p>No forwarded ports</p>
          </div>
        );
    }
  };

  return (
    <div 
      className={`h-[250px] bg-[#1e1e1e] border-t border-[#2d2d30] flex flex-col transition-all duration-300 ${
        agentPanelOpen ? 'mr-[340px]' : 'mr-0'
      } ${
        sidebarPanelOpen ? 'ml-[250px]' : 'ml-0'
      }`}
    >
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
          {/* Terminal Type Selector - Only on Terminal tab */}
          {activeTab === 'terminal' && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowTerminalDropdown(!showTerminalDropdown)}
                className="flex items-center gap-0.5 px-1.5 py-1 text-[11px] text-[#cccccc] hover:bg-[#3e3e42] rounded transition-colors"
              >
                <span className="font-mono">{getTerminalLabel()}</span>
                <ChevronDown size={11} />
              </button>

              {showTerminalDropdown && (
                <div className="absolute right-0 bottom-full mb-1 bg-[#252526] border border-[#3e3e42] rounded shadow-lg py-1 min-w-[140px] z-50">
                  <button
                    onClick={() => {
                      setSelectedTerminal('bash');
                      setShowTerminalDropdown(false);
                    }}
                    className="w-full px-3 py-1.5 text-left text-[11px] text-[#cccccc] hover:bg-[#3e3e42] flex items-center gap-2"
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${selectedTerminal === 'bash' ? 'bg-[#007acc]' : 'bg-transparent'}`} />
                    bash
                  </button>
                  <button
                    onClick={() => {
                      setSelectedTerminal('powershell');
                      setShowTerminalDropdown(false);
                    }}
                    className="w-full px-3 py-1.5 text-left text-[11px] text-[#cccccc] hover:bg-[#3e3e42] flex items-center gap-2"
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${selectedTerminal === 'powershell' ? 'bg-[#007acc]' : 'bg-transparent'}`} />
                    powershell
                  </button>
                  <button
                    onClick={() => {
                      setSelectedTerminal('cmd');
                      setShowTerminalDropdown(false);
                    }}
                    className="w-full px-3 py-1.5 text-left text-[11px] text-[#cccccc] hover:bg-[#3e3e42] flex items-center gap-2"
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${selectedTerminal === 'cmd' ? 'bg-[#007acc]' : 'bg-transparent'}`} />
                    cmd
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Add Terminal - Only on Terminal tab */}
          {activeTab === 'terminal' && (
            <button
              className="p-1 text-[#cccccc] hover:bg-[#3e3e42] rounded transition-colors"
              title="New Terminal"
            >
              <Plus size={14} />
            </button>
          )}

          {/* Split Terminal - Only on Terminal tab */}
          {activeTab === 'terminal' && (
            <button
              className="p-1 text-[#cccccc] hover:bg-[#3e3e42] rounded transition-colors"
              title="Split Terminal"
            >
              <SquareSplitHorizontal size={14} />
            </button>
          )}

          {/* Clear Terminal - Only on Terminal tab */}
          {activeTab === 'terminal' && (
            <button
              onClick={clearTerminal}
              className="p-1 text-[#cccccc] hover:bg-[#3e3e42] rounded transition-colors"
              title="Clear"
            >
              <Trash2 size={14} />
            </button>
          )}

          {/* More Options - ALWAYS VISIBLE */}
          <button
            className="p-1 text-[#cccccc] hover:bg-[#3e3e42] rounded transition-colors"
            title="More"
          >
            <MoreHorizontal size={14} />
          </button>

          {/* Close Button (X) - ALWAYS VISIBLE */}
          <button
            onClick={onClose}
            className="p-1 text-[#cccccc] hover:bg-[#f44747] hover:text-white rounded transition-colors"
            title="Close Terminal"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {renderTabContent()}
      </div>
    </div>
  );
}
