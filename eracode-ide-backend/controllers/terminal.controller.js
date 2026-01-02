// ============================================
// TERMINAL CONTROLLER
// ============================================
const terminalService = require('../services/terminal.service')
const logger = require('../utils/logger')

class TerminalController {
  /**
   * Handle terminal creation
   */
  async createTerminal(socket, terminalId, options) {
    try {
      const result = terminalService.createTerminal(terminalId, {
        ...options,
        socketId: socket.id
      })

      // Set up event listeners
      const terminal = terminalService.getTerminal(terminalId)
      
      if (terminal) {
        // Stream output to client
        terminal.process.onData((data) => {
          socket.emit('terminal:data', terminalId, data)
        })

        // Handle terminal exit
        terminal.process.onExit(({ exitCode, signal }) => {
          logger.info(`Terminal ${terminalId} exited (code: ${exitCode}, signal: ${signal})`)
          socket.emit('terminal:exit', terminalId, exitCode)
          terminalService.killTerminal(terminalId)
        })
      }

      socket.emit('terminal:created', terminalId, result)
      return result

    } catch (error) {
      logger.error('Terminal creation failed:', error.message)
      socket.emit('terminal:error', terminalId, error.message)
      throw error
    }
  }

  /**
   * Handle terminal write
   */
  async writeToTerminal(terminalId, data) {
    try {
      return terminalService.writeToTerminal(terminalId, data)
    } catch (error) {
      logger.error(`Write to terminal ${terminalId} failed:`, error.message)
      throw error
    }
  }

  /**
   * Handle terminal resize
   */
  async resizeTerminal(terminalId, cols, rows) {
    try {
      return terminalService.resizeTerminal(terminalId, cols, rows)
    } catch (error) {
      logger.error(`Resize terminal ${terminalId} failed:`, error.message)
      throw error
    }
  }

  /**
   * Handle terminal kill
   */
  async killTerminal(socket, terminalId) {
    try {
      const result = terminalService.killTerminal(terminalId)
      socket.emit('terminal:killed', terminalId)
      return result
    } catch (error) {
      logger.error(`Kill terminal ${terminalId} failed:`, error.message)
      throw error
    }
  }

  /**
   * Handle socket disconnect
   */
  async handleDisconnect(socketId) {
    try {
      return terminalService.killTerminalsBySocket(socketId)
    } catch (error) {
      logger.error('Socket disconnect cleanup failed:', error.message)
      throw error
    }
  }
}

module.exports = new TerminalController()
