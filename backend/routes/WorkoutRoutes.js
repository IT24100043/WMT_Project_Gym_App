const express = require('express');
const router = express.Router();

const {
    addWorkout,
    getWorkouts,
    getWorkoutById,
    updateWorkout,
    deleteWorkout,
    activateWorkout
} = require('../controllers/WorkoutController');

// Clean REST-style routes
// POST /api/workouts
router.post('/', addWorkout);

// GET /api/workouts/user/:userId
router.get('/user/:userId', getWorkouts);

// GET /api/workouts/:workoutId
router.get('/:workoutId', getWorkoutById);

// PUT /api/workouts/:workoutId
router.put('/:workoutId', updateWorkout);

// DELETE /api/workouts/:workoutId
router.delete('/:workoutId', deleteWorkout);

// PUT /api/workouts/:workoutId/activate
router.put('/:workoutId/activate', activateWorkout);

module.exports = router;
