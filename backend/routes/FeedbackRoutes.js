const express = require('express');
const router = express.Router();
const { 
    addGymFeedback, 
    getAllFeedback, 
    updateFeedback, 
    deleteFeedback,
    likeFeedback,
    unlikeFeedback
} = require('../controllers/feedbackController');

router.post('/add', addGymFeedback);
router.get('/all', getAllFeedback);
router.put('/update/:id', updateFeedback);
router.delete('/delete/:id', deleteFeedback);
router.post('/like/:id', likeFeedback);
router.post('/unlike/:id', unlikeFeedback);

module.exports = router;