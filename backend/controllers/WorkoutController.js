const Workout = require('../models/Workout');
const asyncHandler = require('../middleware/asyncHandler');

// Helper to reliably get the requesting User ID whether from future JWT or current body/query
const getRequestUserId = (req) => {
    return (req.user && req.user.id) || (req.body && req.body.userId) || (req.query && req.query.userId);
};

// Internal function to strictly validate the UI's payload natively
const validateWeeklyData = (days) => {
    if (!days || !Array.isArray(days)) return "Weekly routine requires exactly 7 days array.";
    if (days.length !== 7) return "A weekly routine model must contain strictly 7 consecutive days.";

    for (let i = 0; i < days.length; i++) {
        const day = days[i];
        if (!day.dayName || !day.dayType) return `Day ${i + 1} is missing a core type layout configuration.`;
        
        if (day.dayType === 'workout') {
            if (!day.exercises || day.exercises.length === 0) {
                return `A required workout on ${day.dayName} cannot have zero exercises.`;
            }
            // validate inner subsets dynamically
            for (let j = 0; j < day.exercises.length; j++) {
                const ex = day.exercises[j];
                if (!ex.exerciseName) return `Unnamed exercise found on ${day.dayName}.`;
                if (ex.type === 'reps' && (!ex.sets || !ex.reps)) return `Sets/Reps values required for exercise ${ex.exerciseName} on ${day.dayName}.`;
                if (ex.type === 'time' && !ex.duration) return `Duration missing for time-based exercise ${ex.exerciseName} on ${day.dayName}.`;
            }
        } else if (day.dayType === 'rest') {
            if (day.exercises && day.exercises.length > 0) {
                return `${day.dayName} is assigned as a rest day, it must not contain exercises natively.`;
            }
        }
    }
    return null;
};

// 1. Add a new workout
const addWorkout = asyncHandler(async (req, res) => {
    const userId = getRequestUserId(req);
    if (!userId) {
        res.status(400); 
        throw new Error("userId is required for authentication.");
    }

    const { title, goal, locationType, notes, days } = req.body;

    if (!title || !goal || !locationType) {
        res.status(400);
        throw new Error("Please fill all required core fields (title, goal, location).");
    }

    // Phase 1 Clean Loop Check
    const validationError = validateWeeklyData(days);
    if (validationError) {
        res.status(400);
        throw new Error(validationError);
    }

    // Enforce ONE Active Routine natively across all backend mapping
    await Workout.updateMany({ userId }, { isActive: false });

    const newWorkout = new Workout({
        userId, title, goal, locationType, notes, days, isActive: true
    });

    const savedWorkout = await newWorkout.save();
    res.status(201).json({ message: "Workout Routine mapped successfully", workout: savedWorkout });
});

// 2. View all workouts of a user
const getWorkouts = asyncHandler(async (req, res) => {
    const userId = getRequestUserId(req) || req.params.userId;
    if (!userId) {
        res.status(400);
        throw new Error("userId is required.");
    }

    // Sort heavily prioritizes latest edited Weekly workflows mapped down
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
        throw new Error("Routine framework not found");
    }
    
    // Ownership Check
    if (workout.userId !== userId) {
        res.status(403);
        throw new Error("Unauthorized: You do not own this workflow routine framework.");
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
        throw new Error("Routine Framework not found");
    }

    // Ownership Check
    if (workout.userId !== userId) {
        res.status(403);
        throw new Error("Unauthorized: You can only edit operations natively attached to your UID.");
    }

    const validationError = validateWeeklyData(req.body.days);
    if (validationError) {
        res.status(400);
        throw new Error(validationError);
    }

    await Workout.updateMany({ userId }, { isActive: false });

    const updatedWorkout = await Workout.findByIdAndUpdate(
        req.params.workoutId, 
        { $set: { ...req.body, isActive: true } }, 
        { new: true, runValidators: true }
    );

    res.status(200).json({ message: "Architected Workflow fully restructured successfully", workout: updatedWorkout });
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
        throw new Error("Routine Framework not found natively");
    }

    // Ownership Check
    if (workout.userId !== userId) {
        res.status(403);
        throw new Error("Unauthorized: You can only delete your own workouts.");
    }

    await Workout.findByIdAndDelete(req.params.workoutId);
    res.status(200).json({ message: "Successfully deleted your weekly routine structure." });
});

module.exports = {
    addWorkout,
    getWorkouts,
    getWorkoutById,
    updateWorkout,
    deleteWorkout
};
