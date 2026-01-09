const express = require('express');
const router = express.Router();
const databaseController = require('../controllers/databaseController');

router.post('/connect', databaseController.connect);
router.get('/schema', databaseController.getSchema);
router.post('/query', databaseController.executeQuery);

module.exports = router;
