const express = require('express');
const router = express.Router();
const intakeController = require('../controllers/intakeController');

// Goals update kireema (CRUD - Update)
router.put('/update-goals', intakeController.updateGoals);


router.get('/:userId/:date', intakeController.getDailyStatus);

router.post('/add-water', intakeController.addWater);

router.post('/add-food', intakeController.addFood);

router.put('/update-water', intakeController.updateWaterEntry);

router.put('/update-food', intakeController.updateFoodEntry);

router.delete('/delete-water', intakeController.deleteWaterEntry);

router.delete('/delete-food', intakeController.deleteFoodEntry);

module.exports = router;