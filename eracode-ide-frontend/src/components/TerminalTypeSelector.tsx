import { useState } from 'react';
import { Monitor, Cloud, X, Zap, AlertCircle, CheckCircle, MapPin } from 'lucide-react';
import type { 
  TerminalType, 
  CloudTerminalConfig, 
  CLOUD_INSTANCE, 
  AWS_REGIONS,
  DEFAULT_AWS_REGION  // ADD THIS
} from '../types/terminal.types';

interface TerminalTypeSelectorProps {
  onSelect: (type: TerminalType, cloudConfig?: CloudTerminalConfig) => void;
  onCancel: () => void;
}

export default function TerminalTypeSelector({ onSelect, onCancel }: TerminalTypeSelectorProps) {
  const [selectedType, setSelectedType] = useState<'local' | 'cloud' | null>(null);
  const [cloudRegion, setCloudRegion] = useState(DEFAULT_AWS_REGION);  // CHANGED: Use Ireland as default

  const handleLocalSelect = () => {
    onSelect('local');
  };

  const handleCloudSelect = () => {
    setSelectedType('cloud');
  };

  const handleCloudConfirm = () => {
    const config: CloudTerminalConfig = {
      region: cloudRegion
    };
    onSelect('cloud', config);
  };

  const handleBack = () => {
    setSelectedType(null);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-200">
      <div className="bg-[#1e1e1e] border border-[#2d2d30] rounded-lg shadow-2xl w-[520px] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2d2d30]">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Zap size={20} className="text-[#007acc]" />
            Choose Terminal Type
          </h2>
          <button
            onClick={onCancel}
            className="p-1 text-[#969696] hover:text-white hover:bg-[#2d2d30] rounded transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Initial Selection */}
          {!selectedType && (
            <div className="space-y-3">
              {/* Local Terminal Card */}
              <button
                onClick={handleLocalSelect}
                className="w-full p-5 bg-[#252526] hover:bg-[#2d2d30] border-2 border-transparent hover:border-[#007acc] rounded-lg transition-all group text-left"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-[#1e1e1e] rounded-lg group-hover:bg-[#007acc] transition-colors">
                    <Monitor size={24} className="text-[#007acc] group-hover:text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-white mb-1">💻 Local Terminal</h3>
                    <p className="text-sm text-[#969696] mb-3">
                      Run commands on your computer
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="px-2 py-1 bg-[#1e1e1e] text-[#4ec9b0] rounded flex items-center gap-1">
                        <CheckCircle size={12} />
                        Instant
                      </span>
                      <span className="px-2 py-1 bg-[#1e1e1e] text-[#4ec9b0] rounded flex items-center gap-1">
                        <CheckCircle size={12} />
                        No cost
                      </span>
                      <span className="px-2 py-1 bg-[#1e1e1e] text-[#4ec9b0] rounded flex items-center gap-1">
                        <CheckCircle size={12} />
                        Local files
                      </span>
                    </div>
                  </div>
                </div>
              </button>

              {/* Cloud Terminal Card */}
              <button
                onClick={handleCloudSelect}
                className="w-full p-5 bg-[#252526] hover:bg-[#2d2d30] border-2 border-transparent hover:border-[#007acc] rounded-lg transition-all group text-left"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-[#1e1e1e] rounded-lg group-hover:bg-[#007acc] transition-colors">
                    <Cloud size={24} className="text-[#007acc] group-hover:text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-white mb-1">☁️ Cloud Terminal</h3>
                    <p className="text-sm text-[#969696] mb-3">
                      Powered by AWS ({CLOUD_INSTANCE.type})
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="px-2 py-1 bg-[#1e1e1e] text-[#ce9178] rounded">
                        {CLOUD_INSTANCE.vCPU} vCPU
                      </span>
                      <span className="px-2 py-1 bg-[#1e1e1e] text-[#ce9178] rounded">
                        {CLOUD_INSTANCE.ram} RAM
                      </span>
                      <span className="px-2 py-1 bg-[#1e1e1e] text-[#ce9178] rounded">
                        🇮🇪 Ireland
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* Cloud Configuration */}
          {selectedType === 'cloud' && (
            <div className="space-y-5">
              <button
                onClick={handleBack}
                className="text-sm text-[#007acc] hover:underline"
              >
                ← Back
              </button>

              {/* Instance Info Card */}
              <div className="p-4 bg-[#252526] rounded-lg border border-[#2d2d30]">
                <div className="flex items-start gap-3 mb-3">
                  <Cloud size={18} className="text-[#007acc] mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white mb-1">
                      AWS {CLOUD_INSTANCE.type} Instance
                    </div>
                    <div className="text-xs text-[#969696]">
                      {CLOUD_INSTANCE.description}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="px-2 py-1.5 bg-[#1e1e1e] rounded">
                    <div className="text-[#969696]">CPU</div>
                    <div className="text-white font-medium">{CLOUD_INSTANCE.vCPU} vCPU</div>
                  </div>
                  <div className="px-2 py-1.5 bg-[#1e1e1e] rounded">
                    <div className="text-[#969696]">RAM</div>
                    <div className="text-white font-medium">{CLOUD_INSTANCE.ram}</div>
                  </div>
                </div>
              </div>

              {/* Region Selection */}
              <div>
                <label className="block text-sm font-medium text-[#cccccc] mb-2 flex items-center gap-2">
                  <MapPin size={14} />
                  Select Region
                </label>
                <select
                  value={cloudRegion}
                  onChange={(e) => setCloudRegion(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#252526] border border-[#2d2d30] text-white rounded-lg focus:outline-none focus:border-[#007acc] text-sm"
                >
                  {AWS_REGIONS.map((region) => (
                    <option key={region.value} value={region.value}>
                      {region.flag} {region.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-[#969696] mt-1.5">
                  💡 Europe (Ireland) is pre-selected for optimal performance
                </p>
              </div>

              {/* Info Alert */}
              <div className="p-3 bg-[#2d2d30] border border-[#3e3e42] rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle size={16} className="text-[#007acc] mt-0.5 flex-shrink-0" />
                  <div className="text-xs space-y-1 text-[#cccccc]">
                    <div>• Startup time: {CLOUD_INSTANCE.estimatedStartup}</div>
                    <div>• Auto-terminates when you close terminal</div>
                    <div>• Usage tracked for billing (coming soon)</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={onCancel}
                  className="flex-1 px-4 py-2.5 bg-[#2d2d30] hover:bg-[#3e3e42] text-white rounded-lg transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCloudConfirm}
                  className="flex-1 px-4 py-2.5 bg-[#007acc] hover:bg-[#005a9e] text-white rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2"
                >
                  <Cloud size={16} />
                  Launch
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
