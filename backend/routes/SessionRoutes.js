const express = require('express');
const router = express.Router();
const { finishSession } = require('../controllers/SessionController');

// Define specific session POST hook natively
router.post('/finish', finishSession);

module.exports = router;
