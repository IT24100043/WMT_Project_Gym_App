const express = require('express');
const router = express.Router();
const { getSuggestions, applySuggestion, dismissSuggestion } = require('../controllers/CoachingController');

router.get('/:userId', getSuggestions);
router.post('/apply', applySuggestion);
router.post('/dismiss', dismissSuggestion);

module.exports = router;
