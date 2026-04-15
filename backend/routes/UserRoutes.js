const express = require('express');
const router = express.Router();

const { registerUser, loginUser, updateContactNumber, 
    updatePassword, deleteUser, getUserDetails, getUserRole, updateProfile } = require('../controllers/UserController');

router.post('/user-register', registerUser);
router.post('/user-login', loginUser);
router.post('/user-role', getUserRole);
router.patch('/user-contact/:userId', updateContactNumber);
router.patch('/user-profile/:userId', updateProfile);
router.patch('/user-password/:userId', updatePassword);
router.delete('/user-delete/:userId', deleteUser);
router.get('/user-details/:userId', getUserDetails);

module.exports = router;