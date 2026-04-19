const express = require('express');
const router = express.Router();

const { registerAdmin, loginAdmin, getAdminRole, updateContactNumber,
    updatePassword, deleteAdmin, getAdminDetails, updateProfile, 
    getAllUsers, delete_User, getAllGyms, delete_Gym, 
    getAllCoaches, delete_Coach, getAllAdmins, delete_Admin } = require('../controllers/AdminController');

    router.post('/admin-register', registerAdmin);
    router.post('/admin-login', loginAdmin);
    router.post('/admin-role/', getAdminRole);
    router.patch('/admin-contact/:adminId', updateContactNumber);
    router.patch('/admin-password/:adminId', updatePassword);
    router.delete('/admin-delete/:adminId', deleteAdmin);
    router.get('/admin-details/:adminId', getAdminDetails);
    router.patch('/admin-profile/:adminId', updateProfile);
    router.get('/admin-all-users', getAllUsers);
    router.delete('/admin-delete-user/:userId', delete_User);
    router.get('/admin-all-gyms', getAllGyms);
    router.delete('/admin-delete-gym/:gymId', delete_Gym);
    router.get('/admin-all-coaches', getAllCoaches);
    router.delete('/admin-delete-coach/:coachId', delete_Coach);
    router.get('/admin-all-admins', getAllAdmins);
    router.delete('/admin-delete-admin/:adminId', delete_Admin);

module.exports = router; 