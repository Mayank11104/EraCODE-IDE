import Sidebar from '../components/Sidebar'
// import Explorer from '../components/Explorer'
// import Editor from '../components/Editor'
// import Terminal from '../components/Terminal'
// import AgentPanel from '../components/AgentPanel'
// import StatusBar from '../components/StatusBar'

export default function MainPage() {
  return (
    <div className="h-screen w-full flex flex-col bg-dark-surface text-text-primary overflow-hidden">
      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Sidebar */}
        <Sidebar />

        {/* Center-Left: Explorer Panel (uncomment when ready) */}
        {/* <Explorer /> */}

        {/* Center: Editor + Terminal Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Editor (uncomment when ready) */}
          {/* <Editor /> */}
          
          {/* Temporary placeholder */}
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-bold">EraCode IDE</h1>
              <p className="text-text-secondary">Main workspace area</p>
              <div className="text-sm text-text-secondary bg-dark-hover p-4 rounded-lg border border-dark-border">
                <p className="mb-2">✅ Sidebar - Complete</p>
                <p className="text-primary">⏳ Next: Explorer Component</p>
              </div>
            </div>
          </div>

          {/* Terminal (uncomment when ready) */}
          {/* <Terminal /> */}
        </div>

        {/* Right: Agent Panel (uncomment when ready) */}
        {/* <AgentPanel /> */}
      </div>

      {/* Bottom: Status Bar (uncomment when ready) */}
      {/* <StatusBar /> */}
    </div>
  )
}
