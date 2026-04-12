const express = require('express');
const router = express.Router();

const { registerGym, loginGym, updateOwnerGymContactNumber, 
    updateGymPassword, deleteGym, getGymDetails, getGymRole, updateGymProfile } = require('../controllers/GymController');

router.post('/gym-register', registerGym);
router.post('/gym-login', loginGym);
router.post('/gym-role', getGymRole);
router.patch('/gym-contact-number/:gymId', updateOwnerGymContactNumber);
router.patch('/gym-update-password/:gymId', updateGymPassword);
router.patch('/gym-profile/:gymId', updateGymProfile);
router.delete('/gym-delete/:gymId', deleteGym);
router.get('/gym-details/:gymId', getGymDetails);

module.exports = router;