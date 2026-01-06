require('dotenv').config(); // ✅ ADD THIS AS FIRST LINE


// ============================================
// ERACODE IDE BACKEND SERVER
// ============================================
const http = require('http')
const express = require('express')
const { Server } = require('socket.io')
const config = require('./config/config')
const logger = require('./utils/logger')
const initializeTerminalSocket = require('./sockets/terminal.socket')



// ========================================
// INITIALIZE EXPRESS & SOCKET.IO
// ========================================



const app = express()
const server = http.createServer(app)



// Initialize Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['*'],
  },
  allowEIO3: true,
  transports: ['websocket', 'polling'],
})



// ========================================
// MIDDLEWARE
// ========================================



// Parse JSON bodies
app.use(express.json())
app.use(express.urlencoded({ extended: true }))



// CORS for REST API
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.header('Access-Control-Allow-Credentials', 'true')
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200)
  }
  next()
})



// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`)
  next()
})



// ========================================
// ROUTES
// ========================================



// ✅ UNUSED ROUTES - Kept for future reference
// Uncomment these when you need backend file system access:
//
// const systemRoutes = require('./routes/system.routes')
// const fileSystemRoutes = require('./routes/filesystem.routes')
// app.use('/api/system', systemRoutes)
// app.use('/api/fs', fileSystemRoutes)



// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'EraCode IDE Backend',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      terminals: '/api/terminals',
      websocket: 'ws://localhost:3001'
    }
  })
})



// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    memory: process.memoryUsage(),
    platform: process.platform
  })
})



// Terminals endpoint
app.get('/api/terminals', (req, res) => {
  const terminalService = require('./services/terminal.service')
  const terminals = terminalService.getAllTerminals()
  
  res.json({
    success: true,
    count: terminals.length,
    terminals: terminals
  })
})



// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
    message: 'This endpoint does not exist'
  })
})



// Error handler
app.use((err, req, res, next) => {
  logger.error('Server error:', err.message)
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  })
})



// ========================================
// INITIALIZE WEBSOCKET
// ========================================



initializeTerminalSocket(io)



// ========================================
// START SERVER
// ========================================



const PORT = config.server.port || 3001



server.listen(PORT, () => {
  logger.info('='.repeat(50))
  logger.success('🎉 ERACODE IDE BACKEND STARTED!')
  logger.info('='.repeat(50))
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`)
  logger.info(`Platform: ${process.platform}`)
  logger.info(`Shell: ${config.terminal.shell}`)
  logger.info(`Node: ${process.version}`)
  logger.info('='.repeat(50))
  logger.success(`📡 WebSocket:  ws://localhost:${PORT}`)
  logger.success(`🌐 REST API:   http://localhost:${PORT}/api`)
  logger.success(`🏥 Health:     http://localhost:${PORT}/api/health`)
  logger.success(`💻 Terminals:  http://localhost:${PORT}/api/terminals`)
  logger.info('='.repeat(50))
  logger.info('⏳ Waiting for connections...')
})



// ========================================
// GRACEFUL SHUTDOWN
// ========================================

const awsEc2Service = require('./services/awsEc2Service')

async function gracefulShutdown(signal) {
  logger.warning(`\n🛑 Received ${signal}, shutting down gracefully...`)
  
  try {
    const terminalService = require('./services/terminal.service')
    
    // Cleanup local terminals
    logger.info('🧹 Cleaning up local terminals...')
    terminalService.cleanup()
    
    // ⚠️ DON'T auto-terminate cloud instances
    // Just log them for user awareness
    const activeSessions = Array.from(awsEc2Service.cloudSessions.keys())
    if (activeSessions.length > 0) {
      logger.warning(`\n⚠️ ${activeSessions.length} cloud instance(s) still running:`)
      for (const sessionId of activeSessions) {
        const session = awsEc2Service.cloudSessions.get(sessionId)
        logger.warning(`   - ${session.instanceName} (${session.instanceId})`)
      }
      logger.warning(`💡 These instances will continue running.`)
      logger.warning(`💡 Stop or terminate them from the frontend UI.`)
    }
    
    server.close(() => {
      logger.success('✅ Server closed successfully')
      process.exit(0)
    })
    
    // Force exit after 10 seconds
    setTimeout(() => {
      logger.error('⚠️ Forced shutdown after timeout')
      process.exit(1)
    }, 10000)
    
  } catch (error) {
    logger.error('❌ Error during shutdown:', error.message)
    process.exit(1)
  }
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'))

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))

process.on('uncaughtException', (err) => {
  logger.error('💥 Uncaught Exception:', err.message)
  logger.error(err.stack)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  logger.error('💥 Unhandled Rejection at:', promise)
  logger.error('Reason:', reason)
})
