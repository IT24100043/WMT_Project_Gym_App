const Workout = require('../models/Workout');
const asyncHandler = require('../middleware/asyncHandler');

// Helper to reliably get the requesting User ID whether from future JWT or current body/query
const getRequestUserId = (req) => {
    return (req.user && req.user.id) || (req.body && req.body.userId) || (req.query && req.query.userId);
};

// 1. Add a new workout
const addWorkout = asyncHandler(async (req, res) => {
    const userId = getRequestUserId(req);
    if (!userId) {
        res.status(400); 
        throw new Error("userId is required for authentication.");
    }

    const { title, workoutType, goal, locationType, exerciseName, sets, reps, duration, notes } = req.body;

    if (!title || !workoutType || !goal || !locationType || !exerciseName || sets == null || reps == null || duration == null) {
        res.status(400);
        throw new Error("Please fill all required fields.");
    }

    const newWorkout = new Workout({
        userId, title, workoutType, goal, locationType, exerciseName, sets, reps, duration, notes
    });

    const savedWorkout = await newWorkout.save();
    res.status(201).json({ message: "Workout created successfully", workout: savedWorkout });
});

// 2. View all workouts of a user
const getWorkouts = asyncHandler(async (req, res) => {
    const userId = getRequestUserId(req) || req.params.userId;
    if (!userId) {
        res.status(400);
        throw new Error("userId is required.");
    }

    const requestingUser = getRequestUserId(req);
    // Loose check logic remains unchanged as previously discussed

    const workouts = await Workout.find({ userId: req.params.userId }).sort({ date: -1 });
    res.status(200).json({ workouts });
});

// 3. View a single workout
const getWorkoutById = asyncHandler(async (req, res) => {
    const userId = getRequestUserId(req);
    if (!userId) {
        res.status(400);
        throw new Error("userId is required to view this source.");
    }

    const workout = await Workout.findById(req.params.workoutId);
    
    if (!workout) {
        res.status(404);
        throw new Error("Workout not found");
    }
    
    // Ownership Check
    if (workout.userId !== userId) {
        res.status(403);
        throw new Error("Unauthorized: You do not own this workout.");
    }

    res.status(200).json({ workout });
});

// 4. Edit a workout
const updateWorkout = asyncHandler(async (req, res) => {
    const userId = getRequestUserId(req);
    if (!userId) {
        res.status(400);
        throw new Error("userId is required to authenticate.");
    }

    const workout = await Workout.findById(req.params.workoutId);
    
    if (!workout) {
        res.status(404);
        throw new Error("Workout not found");
    }

    // Ownership Check
    if (workout.userId !== userId) {
        res.status(403);
        throw new Error("Unauthorized: You can only edit your own workouts.");
    }

    const updatedWorkout = await Workout.findByIdAndUpdate(
        req.params.workoutId, 
        { $set: req.body }, 
        { new: true, runValidators: true }
    );

    res.status(200).json({ message: "Workout updated successfully", workout: updatedWorkout });
});

// 5. Delete a workout
const deleteWorkout = asyncHandler(async (req, res) => {
    const userId = getRequestUserId(req);
    if (!userId) {
        res.status(400);
        throw new Error("userId is required to authenticate.");
    }

    const workout = await Workout.findById(req.params.workoutId);
    
    if (!workout) {
        res.status(404);
        throw new Error("Workout not found");
    }

    // Ownership Check
    if (workout.userId !== userId) {
        res.status(403);
        throw new Error("Unauthorized: You can only delete your own workouts.");
    }

    await Workout.findByIdAndDelete(req.params.workoutId);
    res.status(200).json({ message: "Workout deleted successfully" });
});

module.exports = {
    addWorkout,
    getWorkouts,
    getWorkoutById,
    updateWorkout,
    deleteWorkout
};
