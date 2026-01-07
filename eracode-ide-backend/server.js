require('dotenv').config(); // ✅ ADD THIS AS FIRST LINE

// ============================================
// ERACODE IDE BACKEND SERVER
// ============================================
const http = require('http')
const https = require('https')  // ✅ ADD THIS
const { URL } = require('url')  // ✅ ADD THIS
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
app.use(express.json({ limit: '10mb' }))  // ✅ INCREASED LIMIT FOR PROXY
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
      apiProxy: '/api/proxy-request',  // ✅ ADDED
      apiProxyHealth: '/api/proxy/health',  // ✅ ADDED
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

// ========================================
// ✅ API PROXY ROUTES (NEW)
// ========================================

// API Proxy Health Check
app.get('/api/proxy/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'API Proxy',
    message: 'API Testing Proxy is running',
    features: [
      'Full cookie access (including HttpOnly)',
      'CORS bypass',
      'Complete header inspection',
      'Support for all HTTP methods'
    ],
    timestamp: new Date().toISOString()
  })
})

// Main API Proxy Endpoint
app.post('/api/proxy-request', async (req, res) => {
  const { method, url, headers, body } = req.body

  logger.info(`📡 [API Proxy] ${method} → ${url}`)

  try {
    // Validate URL
    if (!url) {
      return res.status(400).json({ error: 'URL is required' })
    }

    const urlObj = new URL(url)
    const isHttps = urlObj.protocol === 'https:'
    const httpModule = isHttps ? https : http

    // Prepare request options
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: (method || 'GET').toUpperCase(),
      headers: headers || {},
      rejectUnauthorized: false // Allow self-signed certificates
    }

    // Make the HTTP/HTTPS request
    const request = httpModule.request(options, (response) => {
      let data = Buffer.from([])

      response.on('data', (chunk) => {
        data = Buffer.concat([data, chunk])
      })

      response.on('end', () => {
        try {
          // ✅ Extract cookies from Set-Cookie header
          const setCookieHeaders = response.headers['set-cookie'] || []
          
          const parsedCookies = setCookieHeaders.map(cookieStr => {
            const parts = cookieStr.split(';')
            const [name, value] = parts[0].split('=')
            
            const cookie = {
              name: name?.trim() || '',
              value: value?.trim() || '',
              httpOnly: cookieStr.toLowerCase().includes('httponly'),
              secure: cookieStr.toLowerCase().includes('secure'),
              sameSite: 'None',
              path: '/',
              domain: urlObj.hostname,
              raw: cookieStr
            }
            
            // Extract cookie attributes
            parts.slice(1).forEach(part => {
              const [key, val] = part.trim().split('=')
              if (!key) return
              
              const lowerKey = key.toLowerCase()
              if (lowerKey === 'path') cookie.path = val || '/'
              if (lowerKey === 'domain') cookie.domain = val || urlObj.hostname
              if (lowerKey === 'expires') cookie.expires = val
              if (lowerKey === 'max-age') cookie.maxAge = val
              if (lowerKey === 'samesite') cookie.sameSite = val
            })
            
            return cookie
          })

          // Parse response body
          let parsedBody
          const contentType = response.headers['content-type'] || ''
          const bodyString = data.toString('utf8')

          if (contentType.includes('application/json')) {
            try {
              parsedBody = JSON.parse(bodyString)
            } catch (e) {
              parsedBody = bodyString
            }
          } else if (contentType.includes('text/')) {
            parsedBody = bodyString
          } else {
            // Binary data - convert to base64
            parsedBody = data.toString('base64')
          }

          logger.success(`✅ [API Proxy] ${response.statusCode} | Cookies: ${parsedCookies.length}`)

          // Send successful response
          res.json({
            status: response.statusCode,
            statusText: response.statusMessage,
            headers: response.headers,
            cookies: parsedCookies,
            body: parsedBody,
            rawBody: bodyString,
            contentType: contentType
          })

        } catch (error) {
          logger.error('❌ [API Proxy] Parse error:', error.message)
          res.status(500).json({ 
            error: 'Failed to parse response',
            details: error.message 
          })
        }
      })
    })

    // Handle request errors
    request.on('error', (error) => {
      logger.error('❌ [API Proxy] Request error:', error.message)
      res.status(500).json({ 
        error: error.message,
        code: error.code,
        details: 'Failed to connect to target server'
      })
    })

    // Set timeout (30 seconds)
    request.setTimeout(30000, () => {
      request.destroy()
      logger.warning('⏱️ [API Proxy] Request timeout')
      res.status(408).json({ 
        error: 'Request timeout',
        message: 'The target server took too long to respond'
      })
    })

    // Send request body for POST/PUT/PATCH/DELETE
    if (body && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method)) {
      const bodyData = typeof body === 'string' ? body : JSON.stringify(body)
      request.write(bodyData)
    }

    request.end()

  } catch (error) {
    logger.error('❌ [API Proxy] Error:', error.message)
    res.status(400).json({ 
      error: 'Invalid request',
      details: error.message,
      message: 'Please check your request parameters'
    })
  }
})

// API Proxy Test Endpoint (for testing the proxy itself)
app.get('/api/proxy/test', (req, res) => {
  res.json({
    message: 'API Proxy is working!',
    timestamp: new Date().toISOString(),
    tip: 'Use POST /api/proxy-request to proxy external API calls'
  })
})

// ========================================
// END OF API PROXY ROUTES
// ========================================

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
  logger.success(`🔌 API Proxy:  http://localhost:${PORT}/api/proxy-request`)  // ✅ ADDED
  logger.success(`🧪 Proxy Test: http://localhost:${PORT}/api/proxy/test`)     // ✅ ADDED
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
