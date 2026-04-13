const express = require('express');
const router = express.Router();
const { getProgressDashboard } = require('../controllers/ProgressController');

router.get('/:userId', getProgressDashboard);

module.exports = router;
