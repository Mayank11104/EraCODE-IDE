// backend/routes/systemMonitor.routes.js

const express = require('express');
const router = express.Router();
const systemMonitorService = require('../services/systemMonitor.service');
const logger = require('../utils/logger');

// Get all system metrics
router.get('/metrics', async (req, res) => {
  try {
    const metrics = await systemMonitorService.getAllMetrics();
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.error('❌ [System Monitor] Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get CPU usage only
router.get('/cpu', async (req, res) => {
  try {
    const cpu = await systemMonitorService.getCPUUsage();
    res.json({
      success: true,
      data: cpu
    });
  } catch (error) {
    logger.error('❌ [System Monitor] CPU error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get memory usage only
router.get('/memory', async (req, res) => {
  try {
    const memory = await systemMonitorService.getMemoryUsage();
    res.json({
      success: true,
      data: memory
    });
  } catch (error) {
    logger.error('❌ [System Monitor] Memory error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get running processes
router.get('/processes', async (req, res) => {
  try {
    const processes = await systemMonitorService.getTopProcesses();
    res.json({
      success: true,
      data: processes
    });
  } catch (error) {
    logger.error('❌ [System Monitor] Processes error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get active dev servers
router.get('/servers', async (req, res) => {
  try {
    const servers = await systemMonitorService.getActiveServers();
    res.json({
      success: true,
      data: servers
    });
  } catch (error) {
    logger.error('❌ [System Monitor] Servers error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
