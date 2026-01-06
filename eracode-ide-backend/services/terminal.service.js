// ============================================
// TERMINAL SERVICE
// ============================================
const os = require('os')
const pty = require('node-pty')
const logger = require('../utils/logger')

// Store active terminals
const terminals = new Map()

// Get default shell for platform
function getDefaultShell() {
  if (process.platform === 'win32') {
    return 'cmd.exe'
  }
  return process.env.SHELL || '/bin/bash'
}

// ============================================
// CREATE TERMINAL
// ============================================
async function createTerminal(terminalId, options = {}) {
  try {
    const {
      cols = 80,
      rows = 24,
      shell = getDefaultShell(),
      shellArgs = [],
      cwd = process.cwd()
    } = options

    logger.info('Creating terminal:', {
      terminalId,
      shell,
      shellArgs,
      cwd
    })

    // Validate working directory
    let workingDir = cwd
    if (cwd && cwd !== process.cwd()) {
      logger.info(`Using requested directory: ${cwd}`)
      workingDir = cwd
    }

    // Create PTY
    const ptyProcess = pty.spawn(shell, shellArgs, {
      name: 'xterm-256color',
      cols,
      rows,
      cwd: workingDir,
      env: process.env
    })

    // Store terminal data
    terminals.set(terminalId, {
      pty: ptyProcess,
      pid: ptyProcess.pid,
      shell,
      cwd: workingDir,
      createdAt: new Date()
    })

    logger.success(
      `Terminal created: ${terminalId} (PID: ${ptyProcess.pid}, Shell: ${shell}, CWD: ${workingDir})`
    )

    return ptyProcess
  } catch (error) {
    logger.error(`Failed to create terminal ${terminalId}:`, error.message)
    throw error
  }
}

// ============================================
// GET TERMINAL INSTANCE
// ============================================
function getTerminal(terminalId) {
  const terminalData = terminals.get(terminalId)
  if (!terminalData) {
    logger.error(`Terminal ${terminalId} not found`)
    return null
  }
  return terminalData.pty
}

// ============================================
// WRITE TO TERMINAL
// ============================================
function writeToTerminal(terminalId, data) {
  const terminalData = terminals.get(terminalId)
  
  if (!terminalData) {
    throw new Error(`Terminal ${terminalId} not found`)
  }

  terminalData.pty.write(data)
}

// ============================================
// RESIZE TERMINAL
// ============================================
function resizeTerminal(terminalId, cols, rows) {
  const terminalData = terminals.get(terminalId)
  
  if (!terminalData) {
    throw new Error(`Terminal ${terminalId} not found`)
  }

  terminalData.pty.resize(cols, rows)
  logger.info(`Terminal ${terminalId} resized to ${cols}x${rows}`)
}

// ============================================
// KILL TERMINAL
// ============================================
function killTerminal(terminalId) {
  const terminalData = terminals.get(terminalId)
  
  if (!terminalData) {
    logger.warning(`Attempted to kill non-existent terminal: ${terminalId}`)
    return
  }

  try {
    terminalData.pty.kill()
    terminals.delete(terminalId)
    logger.info(`Terminal ${terminalId} killed`)
  } catch (error) {
    logger.error(`Error killing terminal ${terminalId}:`, error.message)
  }
}

// ============================================
// GET ALL TERMINALS
// ============================================
function getAllTerminals() {
  const terminalList = []
  
  terminals.forEach((data, id) => {
    terminalList.push({
      id,
      pid: data.pid,
      shell: data.shell,
      cwd: data.cwd,
      createdAt: data.createdAt
    })
  })
  
  return terminalList
}

// ============================================
// CLEANUP
// ============================================
function cleanup() {
  logger.info(`Cleaning up ${terminals.size} terminals...`)
  
  terminals.forEach((data, id) => {
    try {
      data.pty.kill()
      logger.info(`Killed terminal: ${id}`)
    } catch (error) {
      logger.error(`Error killing terminal ${id}:`, error.message)
    }
  })
  
  terminals.clear()
  logger.success('Terminal cleanup complete')
}

// ============================================
// EXPORTS
// ============================================
module.exports = {
  createTerminal,
  getTerminal,
  writeToTerminal,
  resizeTerminal,
  killTerminal,
  getAllTerminals,
  cleanup
}
