const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');

router.get('/list', fileController.listDir);

module.exports = router;
