const express = require('express');
const router = express.Router();

const { registerCoach, loginCoach, getCoachRole, updateContactNumber, 
    updatePassword, deleteCoach, getCoachDetails, updateProfile } = require('../controllers/CoachController');

router.post('/coach-register', registerCoach);
router.post('/coach-login', loginCoach);
router.post('/coach-role/', getCoachRole);
router.patch('/coach-contact/:coachId', updateContactNumber);
router.patch('/coach-password/:coachId', updatePassword);
router.delete('/coach-delete/:coachId', deleteCoach);
router.get('/coach-details/:coachId', getCoachDetails);
router.patch('/coach-profile/:coachId', updateProfile);

module.exports = router; 