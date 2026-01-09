// src/components/panels/cicd/PipelineBuilder.tsx

import { useState } from 'react'
import { Plus, Save, Play, Code, Trash2, GripVertical, Settings } from 'lucide-react'

interface PipelineStage {
  id: string
  name: string
  type: 'build' | 'test' | 'deploy' | 'custom'
  commands: string[]
}

export default function PipelineBuilder() {
  const [pipelineName, setPipelineName] = useState('My Pipeline')
  const [selectedBranch, setSelectedBranch] = useState('main')
  const [stages, setStages] = useState<PipelineStage[]>([
    {
      id: '1',
      name: 'Build',
      type: 'build',
      commands: ['npm install', 'npm run build'],
    },
    {
      id: '2',
      name: 'Test',
      type: 'test',
      commands: ['npm run test', 'npm run lint'],
    },
  ])

  const [showYAML, setShowYAML] = useState(false)

  const stageTemplates = [
    { type: 'build', name: 'Build', icon: '🔨', commands: ['npm install', 'npm run build'] },
    { type: 'test', name: 'Test', icon: '🧪', commands: ['npm run test'] },
    { type: 'deploy', name: 'Deploy', icon: '🚀', commands: ['npm run deploy'] },
    { type: 'custom', name: 'Custom', icon: '⚙️', commands: ['echo "Custom stage"'] },
  ]

  const addStage = (template: typeof stageTemplates[0]) => {
    const newStage: PipelineStage = {
      id: `stage-${Date.now()}`,
      name: template.name,
      type: template.type as PipelineStage['type'],
      commands: [...template.commands],
    }
    setStages([...stages, newStage])
  }

  const removeStage = (id: string) => {
    setStages(stages.filter((s) => s.id !== id))
  }

  const updateStageCommand = (stageId: string, commandIndex: number, value: string) => {
    setStages(
      stages.map((stage) =>
        stage.id === stageId
          ? {
              ...stage,
              commands: stage.commands.map((cmd, idx) => (idx === commandIndex ? value : cmd)),
            }
          : stage
      )
    )
  }

  const addCommand = (stageId: string) => {
    setStages(
      stages.map((stage) =>
        stage.id === stageId ? { ...stage, commands: [...stage.commands, ''] } : stage
      )
    )
  }

  const generateYAML = () => {
    return `name: ${pipelineName}
on:
  push:
    branches: [${selectedBranch}]

jobs:
${stages
  .map(
    (stage) => `  ${stage.name.toLowerCase()}:
    runs-on: ubuntu-latest
    steps:
${stage.commands.map((cmd) => `      - run: ${cmd}`).join('\n')}`
  )
  .join('\n\n')}`
  }

  return (
    <div className="p-6 space-y-6">
      {/* Pipeline Config */}
      <div
        className="p-6 rounded-2xl space-y-4"
        style={{
          background: 'linear-gradient(135deg, rgba(88, 28, 135, 0.08) 0%, rgba(139, 92, 246, 0.05) 100%)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Settings size={16} className="text-purple-400" />
          Pipeline Configuration
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">Pipeline Name</label>
            <input
              type="text"
              value={pipelineName}
              onChange={(e) => setPipelineName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-white text-sm focus:outline-none transition-all duration-200"
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
              onFocus={(e) => {
                e.target.style.border = '1px solid rgba(168, 85, 247, 0.6)'
                e.target.style.boxShadow = '0 0 20px rgba(168, 85, 247, 0.15)'
              }}
              onBlur={(e) => {
                e.target.style.border = '1px solid rgba(255, 255, 255, 0.1)'
                e.target.style.boxShadow = 'none'
              }}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">Trigger Branch</label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-white text-sm focus:outline-none transition-all duration-200 cursor-pointer"
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <option value="main">main</option>
              <option value="develop">develop</option>
              <option value="staging">staging</option>
              <option value="*">All branches</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stage Templates */}
      <div>
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <Plus size={16} className="text-purple-400" />
          Add Stage
        </h3>
        <div className="grid grid-cols-4 gap-3">
          {stageTemplates.map((template) => (
            <button
              key={template.type}
              onClick={() => addStage(template)}
              className="p-4 rounded-xl transition-all duration-200 hover:scale-105 text-center"
              style={{
                background: 'linear-gradient(135deg, rgba(88, 28, 135, 0.08) 0%, rgba(139, 92, 246, 0.05) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div className="text-3xl mb-2">{template.icon}</div>
              <div className="text-sm font-bold text-white">{template.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Pipeline Stages */}
      <div>
        <h3 className="text-sm font-bold text-white mb-4">Pipeline Stages ({stages.length})</h3>
        <div className="space-y-4">
          {stages.map((stage, stageIndex) => (
            <div
              key={stage.id}
              className="p-4 rounded-xl"
              style={{
                background: 'linear-gradient(135deg, rgba(88, 28, 135, 0.08) 0%, rgba(139, 92, 246, 0.05) 100%)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              {/* Stage Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <GripVertical size={16} className="text-gray-500 cursor-move" />
                  <div
                    className="px-3 py-1 rounded-lg text-xs font-bold"
                    style={{
                      background: 'rgba(168, 85, 247, 0.2)',
                      color: 'rgb(168, 85, 247)',
                    }}
                  >
                    Stage {stageIndex + 1}
                  </div>
                  <input
                    type="text"
                    value={stage.name}
                    onChange={(e) =>
                      setStages(
                        stages.map((s) => (s.id === stage.id ? { ...s, name: e.target.value } : s))
                      )
                    }
                    className="bg-transparent text-white text-sm font-bold focus:outline-none border-b border-transparent focus:border-purple-400 transition-colors"
                  />
                </div>
                <button
                  onClick={() => removeStage(stage.id)}
                  className="p-2 hover:bg-red-500/20 rounded-lg transition-all duration-200"
                >
                  <Trash2 size={16} className="text-red-400" />
                </button>
              </div>

              {/* Commands */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-400 mb-2">Commands</label>
                {stage.commands.map((command, cmdIndex) => (
                  <div key={cmdIndex} className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 font-mono w-6">{cmdIndex + 1}.</span>
                    <input
                      type="text"
                      value={command}
                      onChange={(e) => updateStageCommand(stage.id, cmdIndex, e.target.value)}
                      placeholder="Enter command..."
                      className="flex-1 px-4 py-2 rounded-lg text-white text-sm font-mono focus:outline-none transition-all duration-200"
                      style={{
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                      onFocus={(e) => {
                        e.target.style.border = '1px solid rgba(168, 85, 247, 0.6)'
                        e.target.style.boxShadow = '0 0 20px rgba(168, 85, 247, 0.15)'
                      }}
                      onBlur={(e) => {
                        e.target.style.border = '1px solid rgba(255, 255, 255, 0.1)'
                        e.target.style.boxShadow = 'none'
                      }}
                    />
                  </div>
                ))}
                <button
                  onClick={() => addCommand(stage.id)}
                  className="w-full py-2 rounded-lg text-xs font-medium transition-all duration-200 flex items-center justify-center gap-2"
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px dashed rgba(255, 255, 255, 0.2)',
                    color: 'rgba(255, 255, 255, 0.6)',
                  }}
                >
                  <Plus size={14} />
                  Add Command
                </button>
              </div>
            </div>
          ))}

          {stages.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p className="text-sm mb-2">No stages added yet</p>
              <p className="text-xs">Click on a template above to add your first stage</p>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4">
        <button
          onClick={() => setShowYAML(!showYAML)}
          className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2"
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: 'rgba(255, 255, 255, 0.8)',
          }}
        >
          <Code size={16} />
          {showYAML ? 'Hide YAML' : 'Show YAML'}
        </button>

        <div className="flex items-center gap-3">
          <button
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2"
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'rgba(255, 255, 255, 0.8)',
            }}
          >
            <Save size={16} />
            Save Pipeline
          </button>
          <button
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2"
            style={{
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.8) 0%, rgba(147, 51, 234, 0.9) 100%)',
              border: '1px solid rgba(168, 85, 247, 0.6)',
              color: 'white',
              boxShadow: '0 4px 15px rgba(168, 85, 247, 0.3)',
            }}
          >
            <Play size={16} />
            Run Pipeline
          </button>
        </div>
      </div>

      {/* YAML Preview */}
      {showYAML && (
        <div
          className="p-6 rounded-2xl"
          style={{
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Code size={16} className="text-purple-400" />
              Generated YAML
            </h3>
            <button
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'rgba(255, 255, 255, 0.8)',
              }}
              onClick={() => navigator.clipboard.writeText(generateYAML())}
            >
              Copy
            </button>
          </div>
          <pre className="text-xs text-gray-300 font-mono overflow-x-auto">
            {generateYAML()}
          </pre>
        </div>
      )}
    </div>
  )
}
