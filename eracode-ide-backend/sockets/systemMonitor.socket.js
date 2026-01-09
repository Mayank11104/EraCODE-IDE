// backend/sockets/systemMonitor.socket.js

const systemMonitorService = require('../services/systemMonitor.service');
const logger = require('../utils/logger');

let monitoringInterval = null;
const connectedClients = new Set();

function initializeSystemMonitorSocket(io) {
  const monitorNamespace = io.of('/system-monitor');

  monitorNamespace.on('connection', (socket) => {
    logger.success(`✅ [System Monitor] Client connected: ${socket.id}`);
    connectedClients.add(socket.id);

    // Send initial metrics immediately
    systemMonitorService.getAllMetrics().then(metrics => {
      socket.emit('metrics', metrics);
    });

    // Start broadcasting if this is the first client
    if (connectedClients.size === 1) {
      startBroadcasting(monitorNamespace);
    }

    socket.on('disconnect', () => {
      logger.warning(`🔌 [System Monitor] Client disconnected: ${socket.id}`);
      connectedClients.delete(socket.id);

      // Stop broadcasting if no clients connected
      if (connectedClients.size === 0) {
        stopBroadcasting();
      }
    });

    // Handle manual refresh request
    socket.on('refresh', async () => {
      try {
        const metrics = await systemMonitorService.getAllMetrics();
        socket.emit('metrics', metrics);
      } catch (error) {
        logger.error('❌ [System Monitor] Refresh error:', error.message);
        socket.emit('error', { message: error.message });
      }
    });
  });

  logger.info('📊 [System Monitor] Socket namespace initialized');
}

function startBroadcasting(namespace) {
  if (monitoringInterval) return;

  logger.info('🚀 [System Monitor] Started broadcasting (1s intervals)');

  monitoringInterval = setInterval(async () => {
    try {
      const metrics = await systemMonitorService.getAllMetrics();
      namespace.emit('metrics', metrics);
    } catch (error) {
      logger.error('❌ [System Monitor] Broadcast error:', error.message);
    }
  }, 1000); // Broadcast every 1 second
}

function stopBroadcasting() {
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
    monitoringInterval = null;
    logger.info('🛑 [System Monitor] Stopped broadcasting');
  }
}

module.exports = initializeSystemMonitorSocket;
