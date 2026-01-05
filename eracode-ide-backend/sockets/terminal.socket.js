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

        await terminalService.createTerminal(terminalId, {
          cols,
          rows,
          shell,
          shellArgs,
          cwd
        })

        const terminal = terminalService.getTerminal(terminalId)
        if (!terminal) {
          throw new Error('Terminal created but not found in service')
        }

        socketTerminals.add(terminalId)

        terminal.onData((data) => {
          socket.emit('terminal:data', terminalId, data)
        })

        terminal.onExit((exitCode) => {
          logger.info(`Terminal ${terminalId} exited with code ${exitCode}`)
          socket.emit('terminal:exit', terminalId, exitCode)
          socketTerminals.delete(terminalId)
        })

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
    // CLOUD TERMINAL - FIND EXISTING INSTANCE
    // ============================================
    socket.on('cloud-terminal:find-instance', async (customInstanceName) => {
      try {
        logger.info(`🔍 Finding instance: ${customInstanceName}`)

        const instance = await awsEc2Service.findInstanceByName(customInstanceName)
        
        if (!instance) {
          socket.emit('cloud-terminal:instance-not-found', {
            customName: customInstanceName,
            message: `Instance "${customInstanceName}" not found. Please create a new instance.`
          })
          return
        }

        socket.emit('cloud-terminal:instance-found', {
          instanceId: instance.instanceId,
          instanceName: instance.instanceName, // ✅ Full name from AWS
          state: instance.state,
          publicIp: instance.publicIp,
          customName: customInstanceName
        })

        logger.success(`✅ Instance found: ${instance.instanceName} (${instance.state})`)
      } catch (error) {
        logger.error(`❌ Error finding instance:`, error.message)
        socket.emit('cloud-terminal:error', null, error.message)
      }
    })

    // ============================================
    // CLOUD TERMINAL - CREATE NEW INSTANCE
    // ============================================
    socket.on('cloud-terminal:create', async (sessionId, cloudConfig) => {
      let instanceId = null
      
      try {
        logger.info(`☁️ Creating CLOUD terminal: ${sessionId}`)
        logger.info(`Instance Name: ${cloudConfig.customInstanceName}`)
        logger.info(`Region: ${cloudConfig.region}`)

        const { region, localProjectPath, projectName, customInstanceName } = cloudConfig

        // ✅ SANITIZE PROJECT NAME - Replace spaces and special chars
        const sanitizedProjectName = projectName 
          ? projectName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '')
          : null

        if (sanitizedProjectName && sanitizedProjectName !== projectName) {
          logger.info(`📝 Sanitized project name: "${projectName}" → "${sanitizedProjectName}"`)
        }

        if (localProjectPath && sanitizedProjectName) {
          logger.info(`📦 Project Path: ${localProjectPath}`)
          logger.info(`📦 Project Name: ${sanitizedProjectName}`)
        } else {
          logger.warning('⚠️ No project path provided - terminal will start in home directory')
        }

        socket.emit('cloud-terminal:progress', {
          stage: 'launching',
          message: 'Launching EC2 instance...',
          progress: 10
        })

        // Launch EC2 instance with custom name
        const instance = await awsEc2Service.launchInstance(sessionId, customInstanceName)
        instanceId = instance.instanceId // Store for cleanup

        socket.emit('cloud-terminal:progress', {
          stage: 'waiting',
          message: 'Waiting for instance to initialize...',
          progress: 25
        })

        // ✅ WAIT LONGER - Give AWS more time to fully initialize
        logger.info('⏳ Waiting 30 seconds for instance to fully boot...')
        await new Promise(resolve => setTimeout(resolve, 30000))

        socket.emit('cloud-terminal:progress', {
          stage: 'connecting',
          message: 'Establishing SSH connection...',
          progress: 35
        })

        // ✅ CREATE SSH WITH RETRIES
        let sshConnection = null
        let sshAttempts = 0
        const maxSSHAttempts = 10
        
        while (sshAttempts < maxSSHAttempts && !sshConnection) {
          try {
            sshAttempts++
            logger.info(`🔌 SSH attempt ${sshAttempts}/${maxSSHAttempts}...`)
            
            socket.emit('cloud-terminal:progress', {
              stage: 'connecting',
              message: `SSH connection attempt ${sshAttempts}/${maxSSHAttempts}...`,
              progress: 35 + (sshAttempts * 2)
            })

            sshConnection = await awsEc2Service.createSSHConnection(instance.publicIp)
            
            if (sshConnection) {
              logger.success('✅ SSH connected! Waiting for stability...')
              // ✅ EXTRA STABILITY WAIT
              await new Promise(resolve => setTimeout(resolve, 10000))
              break
            }
          } catch (error) {
            logger.warning(`⚠️ SSH attempt ${sshAttempts} failed: ${error.message}`)
            if (sshAttempts < maxSSHAttempts) {
              await new Promise(resolve => setTimeout(resolve, 15000))
            }
          }
        }

        if (!sshConnection) {
          throw new Error('Failed to establish SSH connection after multiple attempts')
        }

        // RSYNC PROJECT FILES (if project path provided)
        if (localProjectPath && sanitizedProjectName) {
          socket.emit('cloud-terminal:progress', {
            stage: 'rsync',
            message: `📦 Preparing to sync project files...`,
            progress: 55
          })

          try {
            // ✅ USE SANITIZED NAME
            const remoteProjectPath = `/home/ubuntu/${sanitizedProjectName}`
            
            logger.info(`📁 Creating directory: ${remoteProjectPath}`)
            await awsEc2Service.executeSSHCommand(sshConnection, `mkdir -p "${remoteProjectPath}"`)

            logger.info(`📦 Starting rsync from ${localProjectPath}`)
            
            socket.emit('cloud-terminal:progress', {
              stage: 'rsync',
              message: `📦 Syncing project files...`,
              progress: 60
            })

            await awsEc2Service.rsyncToEC2(
              localProjectPath,
              instance.publicIp,
              sanitizedProjectName, // ✅ USE SANITIZED NAME
              (percent, currentFile) => {
                socket.emit('cloud-terminal:progress', {
                  stage: 'rsync',
                  message: `📦 Syncing... ${Math.round(percent)}%`,
                  progress: 60 + (percent * 0.25)
                })
              }
            )

            logger.success(`✅ Project synced to ${remoteProjectPath}`)
            
            socket.emit('cloud-terminal:progress', {
              stage: 'rsync',
              message: `✅ Files synced successfully`,
              progress: 85
            })

          } catch (rsyncError) {
            logger.error(`❌ Rsync failed:`, rsyncError.message)
            
            // ✅ INFORM USER BUT CONTINUE
            socket.emit('cloud-terminal:progress', {
              stage: 'rsync-warning',
              message: `⚠️ File sync failed, opening terminal anyway`,
              progress: 85
            })
            
            // Don't throw - continue with terminal
          }
        }

        socket.emit('cloud-terminal:progress', {
          stage: 'terminal',
          message: '🖥️ Opening terminal session...',
          progress: 90
        })

        // Store connection
        const projectPath = sanitizedProjectName ? `/home/ubuntu/${sanitizedProjectName}` : '/home/ubuntu'
        
        cloudConnections.set(sessionId, {
          sshConnection,
          instanceId: instance.instanceId,
          instanceName: instance.instanceName, // ✅ Store FULL AWS name
          publicIp: instance.publicIp,
          region: instance.region,
          projectPath: projectPath
        })
        socketCloudTerminals.add(sessionId)

        // ✅ OPEN SHELL WITH PROJECT PATH
        const shellOptions = sanitizedProjectName ? {
          term: 'xterm-256color',
          env: {
            PATH: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
            PWD: projectPath
          }
        } : { term: 'xterm-256color' }

        sshConnection.shell(shellOptions, (err, stream) => {
          if (err) {
            throw new Error(`Failed to open shell: ${err.message}`)
          }

          cloudConnections.get(sessionId).stream = stream

          // ✅ CD TO PROJECT DIRECTORY
          if (sanitizedProjectName) {
            stream.write(`cd "${projectPath}" && clear\n`)
          }

          stream.on('data', (data) => {
            socket.emit('cloud-terminal:data', sessionId, data.toString())
          })

          stream.on('close', () => {
            logger.info(`Cloud terminal ${sessionId} stream closed`)
            socket.emit('cloud-terminal:exit', sessionId, 0)
            socketCloudTerminals.delete(sessionId)
            cloudConnections.delete(sessionId)
          })

          // ✅ SEND FULL AWS NAME (not customInstanceName)
          socket.emit('cloud-terminal:ready', {
            sessionId,
            instanceId: instance.instanceId,
            instanceName: instance.instanceName,  // ✅ FULL NAME: EraCODE-IDE-abc-ccc1
            publicIp: instance.publicIp,
            region: instance.region,
            instanceType: process.env.AWS_INSTANCE_TYPE || 't3.micro',
            projectPath: projectPath
          })

          logger.success(`✅ CLOUD terminal ${sessionId} ready at ${instance.publicIp}`)
          logger.success(`💡 Instance name: ${instance.instanceName}`)
          logger.success(`📂 Working directory: ${projectPath}`)
        })

      } catch (error) {
        logger.error(`❌ Cloud terminal creation failed:`, error.message)
        socket.emit('cloud-terminal:error', sessionId, error.message)
        
        // ✅ CLEANUP ON FAILURE
        if (instanceId) {
          logger.info(`🗑️ Cleaning up failed instance: ${instanceId}`)
          try {
            await awsEc2Service.terminateInstance(sessionId)
          } catch (cleanupError) {
            logger.error(`Cleanup error:`, cleanupError.message)
          }
        }
      }
    })

    // ============================================
    // CLOUD TERMINAL - RECONNECT TO EXISTING
    // ============================================
    socket.on('cloud-terminal:reconnect', async (sessionId, reconnectConfig) => {
      try {
        const { instanceId, customInstanceName, shouldSync, localProjectPath, projectName } = reconnectConfig

        // ✅ SANITIZE PROJECT NAME
        const sanitizedProjectName = projectName 
          ? projectName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '')
          : null

        logger.info(`🔄 Reconnecting to instance: ${customInstanceName}`)
        logger.info(`   Instance ID: ${instanceId}`)

        socket.emit('cloud-terminal:progress', {
          stage: 'finding',
          message: 'Finding instance...',
          progress: 5
        })

        // ✅ FIND INSTANCE TO GET FULL NAME
        const instanceInfo = await awsEc2Service.findInstanceByName(customInstanceName)
        if (!instanceInfo) {
          throw new Error(`Instance ${customInstanceName} not found`)
        }

        const fullInstanceName = instanceInfo.instanceName  // ✅ Get full AWS name

        socket.emit('cloud-terminal:progress', {
          stage: 'starting',
          message: 'Starting instance...',
          progress: 10
        })

        // Start instance if stopped
        const { publicIp } = await awsEc2Service.startInstance(instanceId)

        socket.emit('cloud-terminal:progress', {
          stage: 'waiting',
          message: 'Waiting for instance to boot...',
          progress: 30
        })

        // ✅ WAIT FOR BOOT
        await new Promise(resolve => setTimeout(resolve, 20000))

        socket.emit('cloud-terminal:progress', {
          stage: 'connecting',
          message: 'Establishing SSH connection...',
          progress: 45
        })

        // ✅ CREATE SSH WITH RETRIES
        let sshConnection = null
        for (let i = 0; i < 5; i++) {
          try {
            sshConnection = await awsEc2Service.createSSHConnection(publicIp)
            if (sshConnection) break
          } catch (error) {
            logger.warning(`SSH attempt ${i + 1} failed: ${error.message}`)
            if (i < 4) await new Promise(resolve => setTimeout(resolve, 10000))
          }
        }

        if (!sshConnection) {
          throw new Error('Failed to establish SSH connection')
        }

        // Optional rsync
        if (shouldSync && localProjectPath && sanitizedProjectName) {
          socket.emit('cloud-terminal:progress', {
            stage: 'rsync',
            message: `📦 Syncing latest changes...`,
            progress: 65
          })

          try {
            await awsEc2Service.rsyncToEC2(
              localProjectPath,
              publicIp,
              sanitizedProjectName,
              (percent, currentFile) => {
                socket.emit('cloud-terminal:progress', {
                  stage: 'rsync',
                  message: `📦 Syncing... ${Math.round(percent)}%`,
                  progress: 65 + (percent * 0.15)
                })
              }
            )
            logger.success(`✅ Project synced`)
          } catch (error) {
            logger.error(`❌ Rsync failed:`, error.message)
          }
        }

        socket.emit('cloud-terminal:progress', {
          stage: 'terminal',
          message: '🖥️ Opening terminal session...',
          progress: 90
        })

        // Store connection
        const projectPath = sanitizedProjectName ? `/home/ubuntu/${sanitizedProjectName}` : '/home/ubuntu'
        
        cloudConnections.set(sessionId, {
          sshConnection,
          instanceId: instanceId,
          instanceName: fullInstanceName,  // ✅ Store FULL AWS name
          publicIp: publicIp,
          region: process.env.AWS_REGION,
          projectPath: projectPath
        })
        socketCloudTerminals.add(sessionId)

        // Open shell
        sshConnection.shell({ term: 'xterm-256color' }, (err, stream) => {
          if (err) {
            throw new Error(`Failed to open shell: ${err.message}`)
          }

          cloudConnections.get(sessionId).stream = stream

          if (sanitizedProjectName) {
            stream.write(`cd "${projectPath}" && clear\n`)
          }

          stream.on('data', (data) => {
            socket.emit('cloud-terminal:data', sessionId, data.toString())
          })

          stream.on('close', () => {
            logger.info(`Cloud terminal ${sessionId} stream closed`)
            socket.emit('cloud-terminal:exit', sessionId, 0)
            socketCloudTerminals.delete(sessionId)
            cloudConnections.delete(sessionId)
          })

          // ✅ SEND FULL AWS NAME
          socket.emit('cloud-terminal:ready', {
            sessionId,
            instanceId: instanceId,
            instanceName: fullInstanceName,  // ✅ FULL NAME: EraCODE-IDE-abc-ccc1
            publicIp: publicIp,
            region: process.env.AWS_REGION,
            instanceType: process.env.AWS_INSTANCE_TYPE || 't3.micro',
            projectPath: projectPath
          })

          logger.success(`✅ Reconnected to ${fullInstanceName} at ${publicIp}`)
        })

      } catch (error) {
        logger.error(`❌ Reconnection failed:`, error.message)
        socket.emit('cloud-terminal:error', sessionId, error.message)
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
    // CLOUD TERMINAL - STOP (Save for later)
    // ============================================
    socket.on('cloud-terminal:stop', async (sessionId) => {
      try {
        logger.info(`⏸️ Stopping CLOUD terminal: ${sessionId}`)

        const connection = cloudConnections.get(sessionId)
        if (connection) {
          if (connection.stream) connection.stream.end()
          if (connection.sshConnection) connection.sshConnection.end()

          await awsEc2Service.stopInstance(sessionId)

          cloudConnections.delete(sessionId)
          socketCloudTerminals.delete(sessionId)

          socket.emit('cloud-terminal:stopped', {
            sessionId,
            instanceName: connection.instanceName,  // ✅ This will be full name
            message: `Instance stopped. Use "${connection.instanceName}" to reconnect.`
          })
        }
      } catch (error) {
        logger.error(`Stop cloud terminal ${sessionId} failed:`, error.message)
        socket.emit('cloud-terminal:error', sessionId, error.message)
      }
    })

    // ============================================
    // CLOUD TERMINAL - TERMINATE (Delete)
    // ============================================
    socket.on('cloud-terminal:terminate', async (sessionId) => {
      try {
        logger.info(`🗑️ Terminating CLOUD terminal: ${sessionId}`)

        const connection = cloudConnections.get(sessionId)
        if (connection) {
          if (connection.stream) connection.stream.end()
          if (connection.sshConnection) connection.sshConnection.end()

          await awsEc2Service.terminateInstance(sessionId)

          cloudConnections.delete(sessionId)
          socketCloudTerminals.delete(sessionId)

          socket.emit('cloud-terminal:terminated', {
            sessionId,
            message: 'Instance terminated (deleted)'
          })
        }
      } catch (error) {
        logger.error(`Terminate cloud terminal ${sessionId} failed:`, error.message)
        socket.emit('cloud-terminal:error', sessionId, error.message)
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

      // ⚠️ DON'T auto-terminate cloud terminals on disconnect
      // Just close SSH connections, keep instances running
      for (const sessionId of socketCloudTerminals) {
        try {
          const connection = cloudConnections.get(sessionId)
          if (connection) {
            if (connection.stream) connection.stream.end()
            if (connection.sshConnection) connection.sshConnection.end()
            logger.info(`🔌 SSH disconnected for ${sessionId}, instance still running`)
            cloudConnections.delete(sessionId)
          }
        } catch (error) {
          logger.error(`Error cleaning up cloud terminal ${sessionId}:`, error.message)
        }
      }

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
  