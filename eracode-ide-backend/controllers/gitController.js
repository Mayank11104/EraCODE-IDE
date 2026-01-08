const gitService = require('../services/gitService');

class GitController {

    async getStatus(req, res) {
        try {
            const { cwd } = req.query;
            if (!cwd) {
                return res.status(400).json({ error: 'cwd query parameter is required' });
            }
            const status = await gitService.getStatus(cwd);
            res.json(status);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async init(req, res) {
        try {
            const { cwd } = req.body;
            if (!cwd) return res.status(400).json({ error: 'cwd is required' });
            const result = await gitService.init(cwd);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async stageFile(req, res) {
        try {
            const { cwd, file } = req.body;
            if (!cwd || !file) return res.status(400).json({ error: 'cwd and file are required' });
            await gitService.stageFile(cwd, file);
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async unstageFile(req, res) {
        try {
            const { cwd, file } = req.body;
            if (!cwd || !file) return res.status(400).json({ error: 'cwd and file are required' });
            await gitService.unstageFile(cwd, file);
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async commit(req, res) {
        try {
            const { cwd, message } = req.body;
            if (!cwd || !message) return res.status(400).json({ error: 'cwd and message are required' });
            const result = await gitService.commit(cwd, message);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async push(req, res) {
        try {
            const { cwd } = req.body;
            if (!cwd) return res.status(400).json({ error: 'cwd is required' });
            await gitService.push(cwd);
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async pull(req, res) {
        try {
            const { cwd } = req.body;
            if (!cwd) return res.status(400).json({ error: 'cwd is required' });
            await gitService.pull(cwd);
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async getLog(req, res) {
        try {
            const { cwd } = req.query;
            if (!cwd) return res.status(400).json({ error: 'cwd query parameter is required' });
            const log = await gitService.getLog(cwd);
            res.json(log);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new GitController();
