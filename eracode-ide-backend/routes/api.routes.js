// ============================================
// REST API ROUTES
// ============================================
const express = require('express')
const os = require('os')
const config = require('../config/config')
const terminalService = require('../services/terminal.service')
const logger = require('../utils/logger')

const router = express.Router()

// Root endpoint
router.get('/', (req, res) => {
  res.json({
    service: 'EraCode IDE Backend',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      terminals: '/api/terminals',
      system: '/api/system'
    },
    websocket: `ws://localhost:${config.server.port}`
  })
})

// Health check
router.get('/health', (req, res) => {
  const uptime = process.uptime()
  const memory = process.memoryUsage()

  res.json({
    status: 'ok',
    uptime: Math.floor(uptime),
    timestamp: new Date().toISOString(),
    memory: {
      rss: Math.round(memory.rss / 1024 / 1024) + ' MB',
      heapUsed: Math.round(memory.heapUsed / 1024 / 1024) + ' MB',
      heapTotal: Math.round(memory.heapTotal / 1024 / 1024) + ' MB'
    },
    activeTerminals: terminalService.getTerminalCount()
  })
})

// Get all terminals
router.get('/terminals', (req, res) => {
  const terminals = terminalService.getAllTerminals()

  res.json({
    count: terminals.length,
    terminals: terminals
  })
})

// System information
router.get('/system', (req, res) => {
  res.json({
    platform: os.platform(),
    arch: os.arch(),
    hostname: os.hostname(),
    shell: config.terminal.shell,
    cpus: os.cpus().length,
    totalMemory: Math.round(os.totalmem() / 1024 / 1024 / 1024) + ' GB',
    freeMemory: Math.round(os.freemem() / 1024 / 1024 / 1024) + ' GB',
    uptime: Math.floor(os.uptime()) + ' seconds',
    nodeVersion: process.version
  })
})

module.exports = router
