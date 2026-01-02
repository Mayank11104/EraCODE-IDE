// ============================================
// TERMINAL SOCKET HANDLER
// ============================================
const terminalService = require('../services/terminal.service')
const logger = require('../utils/logger')

function initializeTerminalSocket(io) {
  io.on('connection', (socket) => {
    logger.success(`Client connected: ${socket.id}`)
    
    // Track terminals per socket
    const socketTerminals = new Set()
    
    // ============================================
    // CREATE TERMINAL
    // ============================================
    socket.on('terminal:create', async (terminalId, options) => {
      try {
        logger.info(`Creating terminal: ${terminalId}`)
        
        // Extract options
        const { cols = 80, rows = 24, shell, shellArgs = [], cwd } = options
        
        if (cwd) {
          logger.info(`📂 Working directory: ${cwd}`)
        }
        
        // ✅ Create terminal through service
        await terminalService.createTerminal(terminalId, {
          cols,
          rows,
          shell,
          shellArgs,
          cwd
        })
        
        // ✅ Get the terminal instance from service
        const terminal = terminalService.getTerminal(terminalId)
        
        if (!terminal) {
          throw new Error('Terminal created but not found in service')
        }
        
        // Track this terminal
        socketTerminals.add(terminalId)
        
        // ✅ Listen for terminal output
        terminal.onData((data) => {
          socket.emit('terminal:data', terminalId, data)
        })
        
        // ✅ Listen for terminal exit
        terminal.onExit((exitCode) => {
          logger.info(`Terminal ${terminalId} exited with code ${exitCode}`)
          socket.emit('terminal:exit', terminalId, exitCode)
          socketTerminals.delete(terminalId)
        })
        
        // Notify client
        socket.emit('terminal:created', terminalId, {
          shell,
          cwd: cwd || process.cwd()
        })
        
        logger.success(`✅ Terminal ${terminalId} created successfully`)
      } catch (error) {
        logger.error(`Error creating terminal ${terminalId}:`, error.message)
        socket.emit('terminal:error', terminalId, error.message)
      }
    })
    
    // ============================================
    // WRITE TO TERMINAL
    // ============================================
    socket.on('terminal:write', (terminalId, data) => {
      try {
        terminalService.writeToTerminal(terminalId, data)
      } catch (error) {
        logger.error(`Write to terminal ${terminalId} failed:`, error.message)
      }
    })
    
    // ============================================
    // RESIZE TERMINAL
    // ============================================
    socket.on('terminal:resize', (terminalId, cols, rows) => {
      try {
        terminalService.resizeTerminal(terminalId, cols, rows)
      } catch (error) {
        logger.error(`Resize terminal ${terminalId} failed:`, error.message)
      }
    })
    
    // ============================================
    // KILL TERMINAL
    // ============================================
    socket.on('terminal:kill', (terminalId) => {
      try {
        logger.info(`Killing terminal: ${terminalId}`)
        terminalService.killTerminal(terminalId)
        socketTerminals.delete(terminalId)
      } catch (error) {
        logger.error(`Kill terminal ${terminalId} failed:`, error.message)
      }
    })
    
    // ============================================
    // DISCONNECT HANDLER
    // ============================================
    socket.on('disconnect', () => {
      logger.warning(`Client disconnected: ${socket.id}`)
      
      // Kill all terminals for this socket
      socketTerminals.forEach(terminalId => {
        try {
          terminalService.killTerminal(terminalId)
        } catch (error) {
          logger.error(`Error killing terminal ${terminalId}:`, error.message)
        }
      })
      
      // Clean up
      socketTerminals.clear()
    })
  })
}

module.exports = initializeTerminalSocket
