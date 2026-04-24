const express = require('express');
const router = express.Router();
const supplementController = require('../controllers/SupplementController');

router.post('/add', supplementController.addSupplement);
router.get('/all', supplementController.getAllSupplements);
router.put('/update/:id', supplementController.updateSupplement);
router.put('/update-price/:id', supplementController.updatePrice);
router.put('/update-stock/:id', supplementController.updateStock);
router.put('/update-availability/:id', supplementController.updateAvailability);
router.delete('/delete/:id', supplementController.deleteSupplement);

module.exports = router;