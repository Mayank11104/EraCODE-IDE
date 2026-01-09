const dockerService = require('../services/dockerService');
const logger = require('../utils/logger');

exports.listContainers = async (req, res) => {
    try {
        const containers = await dockerService.listContainers();
        res.json(containers);
    } catch (error) {
        res.status(500).json({ error: 'Failed to list containers', details: error.message });
    }
};

exports.runContainer = async (req, res) => {
    try {
        const config = req.body; // { image, name, port, ... }
        const result = await dockerService.runContainer(config);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to run container', details: error.message });
    }
};

exports.stopContainer = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await dockerService.stopContainer(id);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to stop container', details: error.message });
    }
};

exports.restartContainer = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await dockerService.restartContainer(id);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to restart container', details: error.message });
    }
};

exports.buildImage = async (req, res) => {
    try {
        const { contextPath, tag } = req.body;

        // Priority 1: Provided contextPath (from frontend active project)
        // Priority 2: Fallback to calculated root (if no project open)
        const path = require('path');
        const defaultPath = path.resolve(__dirname, '../../');
        const safePath = contextPath || defaultPath;

        const result = await dockerService.buildImage(safePath, tag || 'eracode-app:latest');
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to build image', details: error.message });
    }
};

exports.getLogs = async (req, res) => {
    try {
        const { id } = req.params;
        const logs = await dockerService.getLogs(id);
        res.json({ logs });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get logs', details: error.message });
    }
};
