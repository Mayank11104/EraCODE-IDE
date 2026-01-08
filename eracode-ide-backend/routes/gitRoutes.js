const express = require('express');
const router = express.Router();
const gitController = require('../controllers/gitController');

router.get('/status', gitController.getStatus);
router.post('/init', gitController.init);
router.post('/add', gitController.stageFile);
router.post('/unstage', gitController.unstageFile);
router.post('/commit', gitController.commit);
router.post('/push', gitController.push);
router.post('/pull', gitController.pull);
router.get('/log', gitController.getLog);

module.exports = router;
