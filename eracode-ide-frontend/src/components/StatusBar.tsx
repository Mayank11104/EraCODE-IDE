export default function StatusBar() {
  return (
    <div className="h-6 bg-primary w-full flex items-center justify-between px-3 text-[11px] text-white shrink-0 select-none">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1 cursor-pointer hover:bg-white/20 px-1 py-0.5 rounded transition-colors">
          <span>🔀</span>
          <span className="font-medium">main</span>
          <span>🔄</span>
        </div>
        
        <div className="flex items-center gap-1 cursor-pointer hover:bg-white/20 px-1 py-0.5 rounded transition-colors">
          <span>❌</span>
          <span>0</span>
          <span>⚠️</span>
          <span>0</span>
        </div>
      </div>

      {/* Center Section */}
      <div className="flex items-center gap-1 opacity-90">
        <span>🤖</span>
        <span className="font-bold tracking-wide">ERACODE Agent Active</span>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        <div className="cursor-pointer hover:bg-white/20 px-1 py-0.5 rounded transition-colors">
          Ln 11, Col 28
        </div>
        <div className="cursor-pointer hover:bg-white/20 px-1 py-0.5 rounded transition-colors">
          UTF-8
        </div>
        <div className="cursor-pointer hover:bg-white/20 px-1 py-0.5 rounded transition-colors">
          JavaScript JSX
        </div>
        <div className="cursor-pointer hover:bg-white/20 px-1 py-0.5 rounded transition-colors">
          🔔
        </div>
      </div>
    </div>
  )
}
