// ============================================
// TERMINAL SOCKET HANDLER - LOCAL & CLOUD
// ============================================

const terminalService = require('../services/terminal.service')
const awsEc2Service = require('../services/awsEc2Service')
const logger = require('../utils/logger')

// Store cloud terminal SSH connections
const cloudConnections = new Map()

function initializeTerminalSocket(io) {
  io.on('connection', (socket) => {
    logger.success(`Client connected: ${socket.id}`)

    // Track terminals per socket
    const socketTerminals = new Set()
    const socketCloudTerminals = new Set()

    // ============================================
    // LOCAL TERMINAL - CREATE
    // ============================================
    socket.on('terminal:create', async (terminalId, options) => {
      try {
        logger.info(`Creating LOCAL terminal: ${terminalId}`)

        const { cols = 80, rows = 24, shell, shellArgs = [], cwd } = options

        if (cwd) {
          logger.info(`📂 Working directory: ${cwd}`)
        }

        // Create terminal through service
        await terminalService.createTerminal(terminalId, {
          cols,
          rows,
          shell,
          shellArgs,
          cwd
        })

        // Get the terminal instance
        const terminal = terminalService.getTerminal(terminalId)
        if (!terminal) {
          throw new Error('Terminal created but not found in service')
        }

        // Track this terminal
        socketTerminals.add(terminalId)

        // Listen for terminal output
        terminal.onData((data) => {
          socket.emit('terminal:data', terminalId, data)
        })

        // Listen for terminal exit
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

        logger.success(`✅ LOCAL terminal ${terminalId} created successfully`)
      } catch (error) {
        logger.error(`Error creating terminal ${terminalId}:`, error.message)
        socket.emit('terminal:error', terminalId, error.message)
      }
    })

    // ============================================
    // CLOUD TERMINAL - CREATE
    // ============================================
    socket.on('cloud-terminal:create', async (sessionId, cloudConfig) => {
      try {
        logger.info(`☁️ Creating CLOUD terminal: ${sessionId}`)
        logger.info(`Region: ${cloudConfig.region}`)

        // ✅ Extract project info
        const { region, localProjectPath, projectName } = cloudConfig

        // ✅ Log project info
        if (localProjectPath && projectName) {
          logger.info(`📦 Project Path: ${localProjectPath}`)
          logger.info(`📦 Project Name: ${projectName}`)
        } else {
          logger.warning('⚠️ No project path provided - terminal will start in home directory')
        }

        // Send progress updates
        socket.emit('cloud-terminal:progress', {
          stage: 'launching',
          message: 'Launching EC2 instance...',
          progress: 10
        })

        // Launch EC2 instance
        const instance = await awsEc2Service.launchInstance(sessionId)

        socket.emit('cloud-terminal:progress', {
          stage: 'connecting',
          message: 'Establishing SSH connection...',
          progress: 30
        })

        // Create SSH connection
        const sshConnection = await awsEc2Service.createSSHConnection(instance.publicIp)

        // 🔥 NEW: RSYNC PROJECT FILES (if project path provided)
        if (localProjectPath && projectName) {
          socket.emit('cloud-terminal:progress', {
            stage: 'rsync',
            message: `📦 Syncing project files to cloud...`,
            progress: 40
          })

          try {
            // Create project directory on EC2
            logger.info(`📁 Creating directory: /home/ubuntu/${projectName}`)
            await awsEc2Service.executeSSHCommand(sshConnection, `mkdir -p /home/ubuntu/${projectName}`)

            // Run rsync
            logger.info(`📦 Starting rsync from ${localProjectPath}`)
            await awsEc2Service.rsyncToEC2(
              localProjectPath,
              instance.publicIp,
              projectName,
              (percent, currentFile) => {
                socket.emit('cloud-terminal:progress', {
                  stage: 'rsync',
                  message: `📦 Syncing... ${currentFile || 'files'}`,
                  progress: 40 + (percent * 0.3)  // 40% to 70%
                })
              }
            )

            logger.success(`✅ Project synced to /home/ubuntu/${projectName}`)

          } catch (error) {
            logger.error(`❌ Rsync failed:`, error.message)
            // Don't fail terminal creation, just warn
            socket.emit('cloud-terminal:progress', {
              stage: 'rsync-warning',
              message: `⚠️ File sync failed, terminal will open anyway`,
              progress: 70
            })
          }
        }

        socket.emit('cloud-terminal:progress', {
          stage: 'terminal',
          message: '🖥️ Opening terminal session...',
          progress: 80
        })

        // Store connection
        cloudConnections.set(sessionId, {
          sshConnection,
          instanceId: instance.instanceId,
          publicIp: instance.publicIp,
          region: instance.region,
          projectPath: projectName ? `/home/ubuntu/${projectName}` : '/home/ubuntu'
        })
        socketCloudTerminals.add(sessionId)

        // Open shell session with correct working directory
        const shellOptions = projectName ? {
          term: 'xterm-256color',
          env: {
            PATH: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
            PWD: `/home/ubuntu/${projectName}`
          }
        } : {}

        sshConnection.shell(shellOptions, (err, stream) => {
          if (err) {
            throw new Error(`Failed to open shell: ${err.message}`)
          }

          // Store stream for writing
          cloudConnections.get(sessionId).stream = stream

          // 🔥 NEW: Change to project directory if exists
          if (projectName) {
            stream.write(`cd /home/ubuntu/${projectName}\n`)
          }

          // Forward SSH output to client
          stream.on('data', (data) => {
            socket.emit('cloud-terminal:data', sessionId, data.toString())
          })

          // Handle SSH stream close
          stream.on('close', () => {
            logger.info(`Cloud terminal ${sessionId} stream closed`)
            socket.emit('cloud-terminal:exit', sessionId, 0)
            socketCloudTerminals.delete(sessionId)
            cloudConnections.delete(sessionId)
          })

          // Notify client - ready!
          socket.emit('cloud-terminal:ready', {
            sessionId,
            instanceId: instance.instanceId,
            publicIp: instance.publicIp,
            region: instance.region,
            instanceType: process.env.AWS_INSTANCE_TYPE || 't3.micro',
            projectPath: projectName ? `/home/ubuntu/${projectName}` : '/home/ubuntu'
          })

          logger.success(`✅ CLOUD terminal ${sessionId} ready at ${instance.publicIp}`)
        })

      } catch (error) {
        logger.error(`❌ Cloud terminal creation failed:`, error.message)
        socket.emit('cloud-terminal:error', sessionId, error.message)

        // Cleanup on failure
        await awsEc2Service.terminateInstance(sessionId)
      }
    })

    // ============================================
    // LOCAL TERMINAL - WRITE
    // ============================================
    socket.on('terminal:write', (terminalId, data) => {
      try {
        terminalService.writeToTerminal(terminalId, data)
      } catch (error) {
        logger.error(`Write to terminal ${terminalId} failed:`, error.message)
      }
    })

    // ============================================
    // CLOUD TERMINAL - WRITE
    // ============================================
    socket.on('cloud-terminal:write', (sessionId, data) => {
      try {
        const connection = cloudConnections.get(sessionId)
        if (connection && connection.stream) {
          connection.stream.write(data)
          // Update heartbeat
          awsEc2Service.updateHeartbeat(sessionId)
        }
      } catch (error) {
        logger.error(`Write to cloud terminal ${sessionId} failed:`, error.message)
      }
    })

    // ============================================
    // LOCAL TERMINAL - RESIZE
    // ============================================
    socket.on('terminal:resize', (terminalId, cols, rows) => {
      try {
        terminalService.resizeTerminal(terminalId, cols, rows)
      } catch (error) {
        logger.error(`Resize terminal ${terminalId} failed:`, error.message)
      }
    })

    // ============================================
    // CLOUD TERMINAL - RESIZE
    // ============================================
    socket.on('cloud-terminal:resize', (sessionId, cols, rows) => {
      try {
        const connection = cloudConnections.get(sessionId)
        if (connection && connection.stream) {
          connection.stream.setWindow(rows, cols)
        }
      } catch (error) {
        logger.error(`Resize cloud terminal ${sessionId} failed:`, error.message)
      }
    })

    // ============================================
    // LOCAL TERMINAL - KILL
    // ============================================
    socket.on('terminal:kill', (terminalId) => {
      try {
        logger.info(`Killing LOCAL terminal: ${terminalId}`)
        terminalService.killTerminal(terminalId)
        socketTerminals.delete(terminalId)
      } catch (error) {
        logger.error(`Kill terminal ${terminalId} failed:`, error.message)
      }
    })

    // ============================================
    // CLOUD TERMINAL - CLOSE
    // ============================================
    socket.on('cloud-terminal:close', async (sessionId) => {
      try {
        logger.info(`☁️ Closing CLOUD terminal: ${sessionId}`)

        const connection = cloudConnections.get(sessionId)
        if (connection) {
          // Close SSH connection
          if (connection.stream) {
            connection.stream.end()
          }
          if (connection.sshConnection) {
            connection.sshConnection.end()
          }

          // Terminate EC2 instance
          await awsEc2Service.terminateInstance(sessionId)

          cloudConnections.delete(sessionId)
          socketCloudTerminals.delete(sessionId)
        }
      } catch (error) {
        logger.error(`Close cloud terminal ${sessionId} failed:`, error.message)
      }
    })

    // ============================================
    // DISCONNECT HANDLER
    // ============================================
    socket.on('disconnect', async () => {
      logger.warning(`Client disconnected: ${socket.id}`)

      // Kill all local terminals
      socketTerminals.forEach(terminalId => {
        try {
          terminalService.killTerminal(terminalId)
        } catch (error) {
          logger.error(`Error killing terminal ${terminalId}:`, error.message)
        }
      })

      // Kill all cloud terminals
      for (const sessionId of socketCloudTerminals) {
        try {
          const connection = cloudConnections.get(sessionId)
          if (connection) {
            if (connection.stream) connection.stream.end()
            if (connection.sshConnection) connection.sshConnection.end()
            await awsEc2Service.terminateInstance(sessionId)
            cloudConnections.delete(sessionId)
          }
        } catch (error) {
          logger.error(`Error cleaning up cloud terminal ${sessionId}:`, error.message)
        }
      }

      // Clean up
      socketTerminals.clear()
      socketCloudTerminals.clear()
    })
  })

  // Periodic cleanup of stale sessions (every 5 minutes)
  setInterval(async () => {
    try {
      await awsEc2Service.cleanupStaleSessions()
    } catch (error) {
      logger.error('Periodic cleanup failed:', error.message)
    }
  }, 5 * 60 * 1000)
}

module.exports = initializeTerminalSocket
