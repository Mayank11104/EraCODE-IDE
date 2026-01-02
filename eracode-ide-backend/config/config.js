// ============================================
// ERACODE IDE - CONFIGURATION
// ============================================
const os = require('os')

module.exports = {
  // Server settings
  server: {
    port: process.env.PORT || 3001,
    host: process.env.HOST || '0.0.0.0',
    env: process.env.NODE_ENV || 'development'
  },

  // CORS settings
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
    allowedHeaders: ['Content-Type'],
  },

  // Terminal settings
  terminal: {
    shell: os.platform() === 'win32' ? 'powershell.exe' : 'bash',
    defaultCols: 80,
    defaultRows: 24,
    maxTerminals: 50, // Safety limit
  },

  // File operations settings (future)
  files: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedExtensions: ['.js', '.ts', '.jsx', '.tsx', '.html', '.css', '.json', '.md']
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enableConsole: true,
    enableFile: false
  }
}
