const databaseService = require('../services/databaseService');

exports.connect = async (req, res) => {
    try {
        const result = await databaseService.connect(req.body);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getSchema = async (req, res) => {
    try {
        const { connectionId } = req.query;
        if (!connectionId) return res.status(400).json({ error: 'Connection ID required' });

        const schema = await databaseService.getSchema(connectionId);
        res.json(schema);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.executeQuery = async (req, res) => {
    try {
        const { connectionId, query } = req.body;
        if (!connectionId) return res.status(400).json({ error: 'Connection ID required' });

        const results = await databaseService.executeQuery(connectionId, query);
        res.json({ results });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
