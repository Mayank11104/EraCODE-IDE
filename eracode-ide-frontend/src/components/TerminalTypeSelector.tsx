import { useState } from 'react'
import { Monitor, Cloud, X, Zap, AlertCircle, CheckCircle, MapPin, Plus, History } from 'lucide-react'
import { TerminalType, CloudTerminalConfig, AWS_REGIONS, DEFAULT_AWS_REGION } from '../types/terminal.types'

interface TerminalTypeSelectorProps {
  onSelect: (type: TerminalType, cloudConfig?: CloudTerminalConfig) => void
  onCancel: () => void
}

export default function TerminalTypeSelector({ onSelect, onCancel }: TerminalTypeSelectorProps) {
  const [selectedType, setSelectedType] = useState<'local' | 'cloud' | null>(null)
  const [cloudStep, setCloudStep] = useState<'choose' | 'new' | 'existing' | null>(null)
  const [cloudRegion, setCloudRegion] = useState(DEFAULT_AWS_REGION)
  const [instanceName, setInstanceName] = useState('')
  const [shouldSync, setShouldSync] = useState(true)

  const handleLocalSelect = () => {
    onSelect('local')
  }

  const handleCloudSelect = () => {
    setSelectedType('cloud')
    setCloudStep('choose')
  }

  const handleNewInstance = () => {
    setCloudStep('new')
  }

  const handleExistingInstance = () => {
    setCloudStep('existing')
  }

  const handleCreateNew = () => {
    if (!instanceName.trim()) {
      alert('Please enter an instance name')
      return
    }

    const config: CloudTerminalConfig = {
      region: cloudRegion,
      mode: 'new',
      customInstanceName: instanceName.trim()
    }
    onSelect('cloud', config)
  }

  const handleConnectExisting = () => {
    if (!instanceName.trim()) {
      alert('Please enter an instance name')
      return
    }

    const config: CloudTerminalConfig = {
      region: cloudRegion,
      mode: 'existing',
      customInstanceName: instanceName.trim(),
      shouldSync
    }
    onSelect('cloud', config)
  }

  const handleBack = () => {
    if (cloudStep === 'new' || cloudStep === 'existing') {
      setCloudStep('choose')
      setInstanceName('')
    } else {
      setSelectedType(null)
      setCloudStep(null)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#252526] border border-[#3e3e42] rounded-lg shadow-2xl max-w-2xl w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#3e3e42]">
          <h2 className="text-lg font-semibold text-white">
            {cloudStep === 'new' && '🆕 Create New Instance'}
            {cloudStep === 'existing' && '🔄 Connect to Existing Instance'}
            {cloudStep === 'choose' && '☁️ Cloud Terminal'}
            {!selectedType && '🚀 Select Terminal Type'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Initial Type Selection */}
          {!selectedType && (
            <div className="grid grid-cols-2 gap-4">
              {/* Local Terminal */}
              <button
                onClick={handleLocalSelect}
                className="group p-6 bg-[#1e1e1e] border-2 border-[#3e3e42] rounded-lg hover:border-blue-500 transition-all"
              >
                <div className="flex flex-col items-center gap-4">
                  <Monitor className="w-12 h-12 text-blue-500" />
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-white mb-2">💻 Local Terminal</h3>
                    <p className="text-sm text-gray-400">
                      Run commands on your local machine
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-green-400">
                    <CheckCircle className="w-4 h-4" />
                    <span>Instant</span>
                  </div>
                </div>
              </button>

              {/* Cloud Terminal */}
              <button
                onClick={handleCloudSelect}
                className="group p-6 bg-[#1e1e1e] border-2 border-[#3e3e42] rounded-lg hover:border-purple-500 transition-all"
              >
                <div className="flex flex-col items-center gap-4">
                  <Cloud className="w-12 h-12 text-purple-500" />
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-white mb-2">☁️ Cloud Terminal</h3>
                    <p className="text-sm text-gray-400">
                      AWS EC2 instance with your project
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-yellow-400">
                    <Zap className="w-4 h-4" />
                    <span>~60 seconds</span>
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* Cloud: Choose New or Existing */}
          {selectedType === 'cloud' && cloudStep === 'choose' && (
            <div className="space-y-4">
              <p className="text-gray-300 text-center mb-6">
                Do you have an existing cloud instance?
              </p>

              <div className="grid grid-cols-2 gap-4">
                {/* New Instance */}
                <button
                  onClick={handleNewInstance}
                  className="p-6 bg-[#1e1e1e] border-2 border-[#3e3e42] rounded-lg hover:border-green-500 transition-all"
                >
                  <div className="flex flex-col items-center gap-3">
                    <Plus className="w-10 h-10 text-green-500" />
                    <h3 className="text-lg font-semibold text-white">No, Create New</h3>
                    <p className="text-sm text-gray-400 text-center">
                      Launch a fresh EC2 instance
                    </p>
                  </div>
                </button>

                {/* Existing Instance */}
                <button
                  onClick={handleExistingInstance}
                  className="p-6 bg-[#1e1e1e] border-2 border-[#3e3e42] rounded-lg hover:border-blue-500 transition-all"
                >
                  <div className="flex flex-col items-center gap-3">
                    <History className="w-10 h-10 text-blue-500" />
                    <h3 className="text-lg font-semibold text-white">Yes, Reconnect</h3>
                    <p className="text-sm text-gray-400 text-center">
                      Connect to existing instance
                    </p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Cloud: New Instance Form */}
          {selectedType === 'cloud' && cloudStep === 'new' && (
            <div className="space-y-4">
              <div className="bg-[#1e1e1e] p-4 rounded-lg border border-blue-500/30">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
                  <div className="text-sm text-gray-300">
                    <p className="font-semibold text-blue-400 mb-1">Instance Name</p>
                    <p>Choose a unique name to identify this instance later.</p>
                    <p className="text-gray-400 mt-1">Example: my-project, test-env, nodejs-app</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Instance Name *
                </label>
                <input
                  type="text"
                  value={instanceName}
                  onChange={(e) => setInstanceName(e.target.value)}
                  placeholder="e.g., my-project"
                  className="w-full px-4 py-2 bg-[#1e1e1e] border border-[#3e3e42] rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  AWS Region
                </label>
                <select
                  value={cloudRegion}
                  onChange={(e) => setCloudRegion(e.target.value)}
                  className="w-full px-4 py-2 bg-[#1e1e1e] border border-[#3e3e42] rounded text-white focus:outline-none focus:border-blue-500"
                >
                  {AWS_REGIONS.map(region => (
                    <option key={region.id} value={region.id}>
                      {region.name} ({region.id})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  💡 Europe (Ireland) is pre-selected for optimal performance
                </p>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  onClick={handleBack}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  ← Back
                </button>
                <button
                  onClick={handleCreateNew}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                >
                  🚀 Create Instance
                </button>
              </div>
            </div>
          )}

          {/* Cloud: Existing Instance Form */}
          {selectedType === 'cloud' && cloudStep === 'existing' && (
            <div className="space-y-4">
              <div className="bg-[#1e1e1e] p-4 rounded-lg border border-yellow-500/30">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
                  <div className="text-sm text-gray-300">
                    <p className="font-semibold text-yellow-400 mb-1">Reconnect to Instance</p>
                    <p>Enter the exact name you used when creating the instance.</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Instance Name *
                </label>
                <input
                  type="text"
                  value={instanceName}
                  onChange={(e) => setInstanceName(e.target.value)}
                  placeholder="e.g., my-project"
                  className="w-full px-4 py-2 bg-[#1e1e1e] border border-[#3e3e42] rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="bg-[#1e1e1e] p-4 rounded-lg border border-[#3e3e42]">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shouldSync}
                    onChange={(e) => setShouldSync(e.target.checked)}
                    className="w-4 h-4 text-blue-500"
                  />
                  <div>
                    <p className="text-sm font-medium text-white">Sync latest changes</p>
                    <p className="text-xs text-gray-400">Upload local files to cloud instance</p>
                  </div>
                </label>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  onClick={handleBack}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  ← Back
                </button>
                <button
                  onClick={handleConnectExisting}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                >
                  🔄 Connect
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
