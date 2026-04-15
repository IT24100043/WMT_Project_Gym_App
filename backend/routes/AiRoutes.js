const express = require('express');
const router = express.Router();
const { generateRoutine } = require('../controllers/AiController');

// AI Routes
router.post('/generate-routine', generateRoutine);

module.exports = router;
