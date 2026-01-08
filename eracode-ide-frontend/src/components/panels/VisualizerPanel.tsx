import React, { useState } from 'react';
import { Play, Code, Download, MessageSquare, Layers, Sparkles, FileCode, Plus, Minus, RotateCcw } from 'lucide-react';
import { generateDiagram, editDiagram } from '../../services/api';
import MermaidRenderer from '../MermaidRenderer';

export default function VisualizerPanel() {
  const [description, setDescription] = useState('');
  const [diagramCode, setDiagramCode] = useState('');
  const [editInstruction, setEditInstruction] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('architect');
  const [zoomLevel, setZoomLevel] = useState(150);

  const handleGenerate = async () => {
    if (!description.trim()) return;
    setLoading(true);
    try {
      const res = await generateDiagram(description);
      setDiagramCode(res.diagram);
    } catch (err: any) {
      alert("Error: " + (err.response?.data?.detail || err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!editInstruction.trim() || !diagramCode) return;
    setLoading(true);
    try {
      const res = await editDiagram(diagramCode, editInstruction);
      setDiagramCode(res.diagram);
      setEditInstruction('');
    } catch (err: any) {
      alert("Error: " + (err.response?.data?.detail || err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 10, 200));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 10, 50));
  };

  const handleResetZoom = () => {
    setZoomLevel(100);
  };

  const handleExport = (format) => {
    const svg = document.querySelector('.mermaid-container svg');
    if (!svg) {
      alert("No diagram to export");
      return;
    }

    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    if (format === 'svg') {
      const a = document.createElement('a');
      a.href = url;
      a.download = `architecture-diagram-${Date.now()}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
    // Note: Canvas export for PNG might be tainted in some environments, simplified here to just SVG for safety or kept if user explicitly wants it. 
    // Keeping SVG primarily as it's cleaner for diagrams.
  };

  return (
    <div className="flex h-full w-full bg-dark-base text-text-primary overflow-hidden font-sans">



      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="h-11 border-b border-dark-border bg-dark-header flex items-center justify-between px-4 shadow-sm z-10 shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Layers size={18} className="text-purple-400" />
              <h1 className="text-[13px] font-semibold text-text-primary">
                EraCODE Architect
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Zoom Controls */}
            <div className="flex items-center bg-dark-surface border border-dark-border rounded p-0.5">
              <button
                onClick={handleZoomOut}
                disabled={!diagramCode}
                className="p-1 rounded hover:bg-dark-hover text-text-secondary hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Zoom Out"
              >
                <Minus size={14} />
              </button>
              <span className="px-2 text-xs font-mono text-text-secondary w-10 text-center select-none">
                {zoomLevel}%
              </span>
              <button
                onClick={handleZoomIn}
                disabled={!diagramCode}
                className="p-1 rounded hover:bg-dark-hover text-text-secondary hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Zoom In"
              >
                <Plus size={14} />
              </button>
              <div className="w-px h-3 bg-dark-border mx-1"></div>
              <button
                onClick={handleResetZoom}
                disabled={!diagramCode}
                className="p-1 rounded hover:bg-dark-hover text-text-secondary hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Reset Zoom"
              >
                <RotateCcw size={14} />
              </button>
            </div>

            <button
              onClick={() => handleExport('svg')}
              disabled={!diagramCode}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium border border-dark-border transition-all
                ${diagramCode
                  ? 'bg-dark-hover text-text-primary hover:bg-dark-surface hover:text-white cursor-pointer'
                  : 'bg-transparent text-text-secondary cursor-not-allowed opacity-50'
                }
              `}
            >
              <Download size={14} />
              Export
            </button>
          </div>
        </div>

        {/* Workspace */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Input */}
          <div className="w-[400px] border-r border-dark-border bg-dark-surface flex flex-col shrink-0">
            <div className="p-4 flex flex-col h-full gap-4">

              {/* Mode Switcher */}
              <div className="flex gap-1 p-1 bg-dark-base rounded-lg border border-dark-border">
                <button
                  onClick={() => setMode('architect')}
                  className={`
                    flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-medium transition-all
                    ${mode === 'architect'
                      ? 'bg-dark-hover text-white shadow-sm'
                      : 'text-text-secondary hover:text-text-primary hover:bg-dark-hover/50'
                    }
                  `}
                >
                  <FileCode size={14} />
                  Architect
                </button>
                <button
                  onClick={() => setMode('edit')}
                  className={`
                    flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-medium transition-all
                    ${mode === 'edit'
                      ? 'bg-dark-hover text-white shadow-sm'
                      : 'text-text-secondary hover:text-text-primary hover:bg-dark-hover/50'
                    }
                  `}
                >
                  <Code size={14} />
                  Refine
                </button>
              </div>

              {/* Content Area */}
              <div className="flex-1 flex flex-col gap-4 min-h-0">
                {mode === 'architect' ? (
                  <>
                    <div className="flex-1 flex flex-col">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles size={14} className="text-purple-400" />
                        <h3 className="text-xs font-semibold text-text-primary">System Requirements</h3>
                      </div>
                      <p className="text-[11px] text-text-secondary mb-3 leading-relaxed">
                        Describe your architecture in plain English (stack, components, etc).
                      </p>
                      <textarea
                        className="flex-1 w-full bg-dark-base border border-dark-border rounded-lg p-3 text-[13px] text-text-primary font-mono resize-none focus:outline-none focus:border-primary/50 transition-colors placeholder:text-text-secondary/50"
                        placeholder="e.g. Create a microservices architecture with React frontend, Node.js backend, PostgreSQL database, and deploy on AWS."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    </div>

                    <button
                      onClick={handleGenerate}
                      disabled={loading || !description.trim()}
                      className={`
                        w-full py-2.5 rounded-lg font-medium text-white flex items-center justify-center gap-2 text-xs transition-all
                        ${loading || !description.trim()
                          ? 'bg-dark-hover cursor-not-allowed text-text-secondary'
                          : 'bg-primary hover:bg-blue-600 shadow-lg shadow-blue-900/20'
                        }
                      `}
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                          <span>Generating...</span>
                        </div>
                      ) : (
                        <>
                          <Play size={16} className="fill-current" />
                          <span>Generate Blueprint</span>
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex-1 flex flex-col">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare size={14} className="text-pink-400" />
                        <h3 className="text-xs font-semibold text-text-primary">Refinement Instructions</h3>
                      </div>
                      <p className="text-[11px] text-text-secondary mb-3 leading-relaxed">
                        Describe changes to apply to your existing diagram.
                      </p>
                      <textarea
                        className="flex-1 w-full bg-dark-base border border-dark-border rounded-lg p-3 text-[13px] text-text-primary font-mono resize-none focus:outline-none focus:border-pink-500/50 transition-colors placeholder:text-text-secondary/50"
                        placeholder="e.g. Add a load balancer before the API Gateway..."
                        value={editInstruction}
                        onChange={(e) => setEditInstruction(e.target.value)}
                      />
                    </div>

                    <button
                      onClick={handleEdit}
                      disabled={loading || !diagramCode || !editInstruction.trim()}
                      className={`
                        w-full py-2.5 rounded-lg font-medium text-white flex items-center justify-center gap-2 text-xs transition-all
                        ${loading || !diagramCode || !editInstruction.trim()
                          ? 'bg-dark-hover cursor-not-allowed text-text-secondary'
                          : 'bg-pink-600 hover:bg-pink-500 shadow-lg shadow-pink-900/20'
                        }
                      `}
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                          <span>Applying...</span>
                        </div>
                      ) : (
                        <>
                          <Code size={16} />
                          <span>Apply Changes</span>
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>

            </div>
          </div>

          {/* Right Panel - Preview */}
          <div className="flex-1 relative bg-dark-base">
            {/* Background decorative elements - kept subtle */}
            {!diagramCode && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-50">
                {/* Simplified background for cleaner look */}
              </div>
            )}

            <div className="absolute inset-0 flex items-center justify-center p-8 overflow-hidden">
              {diagramCode ? (
                <div
                  className="w-full h-full flex items-center justify-center transition-transform duration-200 ease-in-out"
                  style={{ transform: `scale(${zoomLevel / 100})` }}
                >
                  <MermaidRenderer code={diagramCode} />
                </div>
              ) : (
                <div className="text-center relative z-10">
                  <div className="mb-4 relative inline-block text-dark-border">
                    <Layers size={64} className="text-dark-border relative z-10" strokeWidth={1} />
                  </div>
                  <p className="text-text-secondary text-sm font-medium mb-1">Architecture Blueprint</p>
                  <p className="text-text-secondary/60 text-xs">Generate or refine a diagram to see the preview</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
