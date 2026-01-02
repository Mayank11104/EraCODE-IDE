// ============================================
// SOCKET.IO ROUTES
// ============================================
const terminalController = require('../controllers/terminal.controller')
const logger = require('../utils/logger')

module.exports = (io) => {
  io.on('connection', (socket) => {
    logger.success(`Client connected: ${socket.id}`)

    // ============================================
    // TERMINAL EVENTS
    // ============================================
    
    socket.on('terminal:create', async (terminalId, options = {}) => {
      logger.info(`[${socket.id}] Creating terminal: ${terminalId}`)
      try {
        await terminalController.createTerminal(socket, terminalId, options)
      } catch (error) {
        logger.error('Terminal creation error:', error.message)
      }
    })

    socket.on('terminal:write', async (terminalId, data) => {
      try {
        await terminalController.writeToTerminal(terminalId, data)
      } catch (error) {
        logger.error('Terminal write error:', error.message)
      }
    })

    socket.on('terminal:resize', async (terminalId, cols, rows) => {
      logger.debug(`[${socket.id}] Resizing terminal ${terminalId}: ${cols}x${rows}`)
      try {
        await terminalController.resizeTerminal(terminalId, cols, rows)
      } catch (error) {
        logger.error('Terminal resize error:', error.message)
      }
    })

    socket.on('terminal:kill', async (terminalId) => {
      logger.info(`[${socket.id}] Killing terminal: ${terminalId}`)
      try {
        await terminalController.killTerminal(socket, terminalId)
      } catch (error) {
        logger.error('Terminal kill error:', error.message)
      }
    })

    // ============================================
    // FILE EVENTS (Future)
    // ============================================
    
    socket.on('file:read', async (filePath) => {
      logger.debug(`[${socket.id}] File read requested: ${filePath}`)
      // TODO: Implement file reading
      socket.emit('file:error', 'File operations not yet implemented')
    })

    socket.on('file:write', async (filePath, content) => {
      logger.debug(`[${socket.id}] File write requested: ${filePath}`)
      // TODO: Implement file writing
      socket.emit('file:error', 'File operations not yet implemented')
    })

    // ============================================
    // GIT EVENTS (Future)
    // ============================================
    
    socket.on('git:status', async (repoPath) => {
      logger.debug(`[${socket.id}] Git status requested: ${repoPath}`)
      // TODO: Implement git status
      socket.emit('git:error', 'Git operations not yet implemented')
    })

    // ============================================
    // DISCONNECT
    // ============================================
    
    socket.on('disconnect', async () => {
      logger.warning(`Client disconnected: ${socket.id}`)
      try {
        await terminalController.handleDisconnect(socket.id)
      } catch (error) {
        logger.error('Disconnect cleanup error:', error.message)
      }
    })
  })
}
