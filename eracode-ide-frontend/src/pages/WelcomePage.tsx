export default function WelcomePage() {
  return (
    <div className="flex-1 flex items-center justify-center bg-dark-surface">
      <div className="text-center space-y-6">
        {/* Logo */}
        <div className="w-32 h-32 mx-auto mb-6 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-purple-500 to-pink-500 rounded-2xl blur-xl opacity-30 animate-pulse"></div>
          <div className="relative bg-gradient-to-br from-primary to-purple-600 rounded-2xl p-8 shadow-2xl">
            <svg viewBox="0 0 100 100" className="w-full h-full text-white">
              <path d="M50 10 L90 30 L90 70 L50 90 L10 70 L10 30 Z" fill="currentColor" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <div>
          <h1 className="text-6xl font-bold bg-gradient-to-r from-primary via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
            EraCODE IDE
          </h1>
          <p className="text-text-secondary text-base">
            The All-in-One Agentic Development Environment
          </p>
        </div>
        
        {/* Keyboard Shortcuts */}
        <div className="mt-10 space-y-3 text-sm">
          <div className="flex items-center justify-center gap-4 text-text-secondary hover:text-white transition-colors">
            <span className="w-48 text-right">Switch to Agent Manager</span>
            <kbd className="px-3 py-1.5 bg-dark-hover border border-dark-border rounded text-xs font-mono shadow-sm">
              Ctrl + E
            </kbd>
          </div>
          <div className="flex items-center justify-center gap-4 text-text-secondary hover:text-white transition-colors">
            <span className="w-48 text-right">Code with Agent</span>
            <kbd className="px-3 py-1.5 bg-dark-hover border border-dark-border rounded text-xs font-mono shadow-sm">
              Ctrl + L
            </kbd>
          </div>
          <div className="flex items-center justify-center gap-4 text-text-secondary hover:text-white transition-colors">
            <span className="w-48 text-right">Edit code inline</span>
            <kbd className="px-3 py-1.5 bg-dark-hover border border-dark-border rounded text-xs font-mono shadow-sm">
              Ctrl + I
            </kbd>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-12 flex items-center justify-center gap-8 text-xs">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">✓</div>
            <div className="text-text-secondary mt-1">Ready to Code</div>
          </div>
          <div className="w-px h-12 bg-dark-border"></div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">AI</div>
            <div className="text-text-secondary mt-1">Powered</div>
          </div>
          <div className="w-px h-12 bg-dark-border"></div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">∞</div>
            <div className="text-text-secondary mt-1">Possibilities</div>
          </div>
        </div>
      </div>
    </div>
  );
}
