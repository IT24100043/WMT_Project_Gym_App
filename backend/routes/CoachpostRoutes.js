const express = require('express');
const router = express.Router();

const { createCoachPost, updateCoachPostDescription, updateCoachPostExperience,
    updateCoachPostDuration, updateCoachPostFee, updateCoachPostContactNumber,
    deleteCoachPost, getCoachPostById, getAllCoachPosts } = require('../controllers/CoachpostController');

    router.post('/coachpost-create/:coachId', createCoachPost);
    router.patch('/coachpost-update-description/:coachPostId', updateCoachPostDescription);
    router.patch('/coachpost-update-experience/:coachPostId', updateCoachPostExperience);
    router.patch('/coachpost-update-duration/:coachPostId', updateCoachPostDuration);
    router.patch('/coachpost-update-fee/:coachPostId', updateCoachPostFee);
    router.patch('/coachpost-update-contact-number/:coachPostId', updateCoachPostContactNumber);
    router.delete('/coachpost-delete/:coachPostId', deleteCoachPost);
    router.get('/coachpost/:coachPostId', getCoachPostById);
    router.get('/coachpost-all-posts', getAllCoachPosts);

module.exports = router;