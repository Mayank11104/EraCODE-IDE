const express = require('express');
const router = express.Router();
const dockerController = require('../controllers/dockerController');

router.get('/containers', dockerController.listContainers);
router.post('/run', dockerController.runContainer);
router.post('/stop/:id', dockerController.stopContainer);
router.post('/restart/:id', dockerController.restartContainer);
router.post('/build', dockerController.buildImage);
router.get('/logs/:id', dockerController.getLogs);

module.exports = router;
