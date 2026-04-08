const express = require('express');
const router = express.Router();

const { createGymInfo, updateGymInformation, addGymFasilities, deleteGymFasilities, updateOpenHours, 
    updateCloseHours, updateGymContactNumber, updateCity, addGymPackage, deleteGymPackages, 
    deleteGymInfo, getGymInformationDetails, getAllGymInformation} = require('../controllers/GymInfoController');

router.post('/info-create/:gymId', createGymInfo);
router.patch('/info-update-information/:infoId', updateGymInformation);
router.put('/info-add-fasility/:infoId', addGymFasilities);
router.delete('/info-delete-fasility/:infoId', deleteGymFasilities);
router.patch('/info-update-open-hours/:infoId', updateOpenHours);
router.patch('/info-update-close-hours/:infoId', updateCloseHours);
router.patch('/info-update-contact-number/:infoId', updateGymContactNumber);
router.patch('/info-update-city/:infoId', updateCity);
router.put('/info-add-package/:infoId', addGymPackage);
router.delete('/info-delete-package/:infoId', deleteGymPackages);
router.delete('/info-delete-info/:infoId', deleteGymInfo);
router.get('/info-information-details/:infoId', getGymInformationDetails);
router.get('/info-all-information', getAllGymInformation);

module.exports = router;