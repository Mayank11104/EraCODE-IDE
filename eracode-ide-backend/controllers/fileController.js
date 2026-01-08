const fileService = require('../services/fileService');

class FileController {
    async listDir(req, res) {
        try {
            const { path } = req.query;
            if (!path) {
                return res.status(400).json({ error: 'Path is required' });
            }

            const files = await fileService.listDir(path);
            res.json(files);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new FileController();
