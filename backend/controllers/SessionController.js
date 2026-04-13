const WorkoutHistory = require('../models/WorkoutHistory');
const User = require('../models/User');
const { evaluateUserStreak } = require('../utils/streakEvaluator');
const asyncHandler = require('../middleware/asyncHandler');

// Secure Session POST
const finishSession = asyncHandler(async (req, res) => {
    const { userId, workoutId, dayName, sessionType, exercises } = req.body;

    if (!userId || !workoutId || !dayName || !exercises) {
        res.status(400);
        throw new Error("Missing required session parameters.");
    }

    const historyLog = new WorkoutHistory({
        userId,
        workoutId,
        dayName,
        sessionType: sessionType || 'workout',
        exercises
    });

    const savedLog = await historyLog.save();

    // PHASE 3 STREAK MATH
    let userRecord = await evaluateUserStreak(userId);
    if (userRecord && sessionType !== 'rest') {
        const today = new Date();
        today.setHours(0,0,0,0);
        
        let shouldIncrement = true;
        if (userRecord.lastCompletedWorkoutDate) {
            const last = new Date(userRecord.lastCompletedWorkoutDate);
            last.setHours(0,0,0,0);
            if (last.getTime() === today.getTime()) {
                shouldIncrement = false; 
            }
        }

        if (shouldIncrement) {
             userRecord.currentStreak += 1;
             userRecord.lastCompletedWorkoutDate = new Date();
             userRecord.missedWorkoutDays = 0;
             await userRecord.save();
        }
    }

    res.status(201).json({ 
        message: "Workout Session successfully logged securely.",
        history: savedLog 
    });
});

module.exports = {
    finishSession
};
