const express = require('express');
const router = express.Router();
const searchService = require('../services/searchService');

// POST /api/search
router.post('/', async (req, res) => {
    try {
        const { cwd, query, settings } = req.body;
        console.log(`🔍 Search request: "${query}" in ${cwd}`);

        const result = await searchService.searchRequest(cwd, query, settings);
        res.json(result);
    } catch (error) {
        console.error('Search failed:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
