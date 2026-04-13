const WorkoutHistory = require('../models/WorkoutHistory');
const Workout = require('../models/Workout');
const User = require('../models/User');
const { evaluateExercise } = require('../utils/coachingEngine');
const asyncHandler = require('../middleware/asyncHandler');

// Fetches algorithmically processed progression endpoints
const getSuggestions = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    let activeRoutine = await Workout.findOne({ userId, isActive: true });
    if (!activeRoutine) activeRoutine = await Workout.findOne({ userId });

    const user = await User.findById(userId);
    if (!activeRoutine || !user) {
         return res.status(200).json({ suggestions: [] });
    }

    const allHistory = await WorkoutHistory.find({ userId, sessionType: 'workout' }).sort({ date: -1 });

    const groupedHistory = {};
    allHistory.forEach(session => {
        if (!session.exercises) return;
        session.exercises.forEach(ex => {
             if (!groupedHistory[ex.exerciseName]) groupedHistory[ex.exerciseName] = {};
             // Extract unique days dynamically tracking absolute highest volumes
             const dString = new Date(session.date).toDateString();
             if (!groupedHistory[ex.exerciseName][dString]) {
                 groupedHistory[ex.exerciseName][dString] = {
                     actualWeight: ex.actualWeight || 0,
                     actualReps: ex.actualReps || 0,
                     actualDuration: ex.actualDuration || 0,
                     actualSets: ex.actualSets || 0,
                     date: session.date
                 };
             } else {
                 if (ex.actualWeight > groupedHistory[ex.exerciseName][dString].actualWeight) groupedHistory[ex.exerciseName][dString].actualWeight = ex.actualWeight;
                 if (ex.actualReps > groupedHistory[ex.exerciseName][dString].actualReps) groupedHistory[ex.exerciseName][dString].actualReps = ex.actualReps;
                 if (ex.actualDuration > groupedHistory[ex.exerciseName][dString].actualDuration) groupedHistory[ex.exerciseName][dString].actualDuration = ex.actualDuration;
             }
        });
    });

    const suggestions = [];

    activeRoutine.days.forEach(day => {
         if (day.dayType === 'workout' && day.exercises) {
              day.exercises.forEach(ex => {
                   if (groupedHistory[ex.exerciseName]) {
                        const uniqueLogs = Object.values(groupedHistory[ex.exerciseName]).sort((a,b) => new Date(b.date) - new Date(a.date));
                        
                        // User constraint: Prevent nagging by validating Dismissal cache natively
                        const dismissalRecord = user.dismissedSuggestions?.find(d => d.exerciseName === ex.exerciseName);
                        if (dismissalRecord) {
                             if (new Date(uniqueLogs[0].date) <= new Date(dismissalRecord.latestLogDateRef)) {
                                  return; // Suppress explicitly
                             }
                        }

                        const result = evaluateExercise(ex.exerciseName, ex, uniqueLogs);
                        if (result) {
                            suggestions.push({
                                 dayName: day.dayName,
                                 exerciseName: ex.exerciseName,
                                 ...result,
                                 latestLogRef: uniqueLogs[0].date
                            });
                        }
                   }
              });
         }
    });

    res.status(200).json({ suggestions });
});

// Applies mapping straight into Active Routine 
const applySuggestion = asyncHandler(async (req, res) => {
    const { userId, exerciseName, dayName, newValue, field } = req.body;
    
    let activeRoutine = await Workout.findOne({ userId, isActive: true });
    if (!activeRoutine) activeRoutine = await Workout.findOne({ userId });

    let applied = false;
    for (let d of activeRoutine.days) {
         if (d.dayName === dayName && d.dayType === 'workout') {
              for (let e of d.exercises) {
                   if (e.exerciseName === exerciseName) {
                        e[field] = newValue;
                        applied = true;
                   }
              }
         }
    }
    
    if (applied) {
         await activeRoutine.save();
         res.status(200).json({ message: "Successfully updated active routine dynamically." });
    } else {
         res.status(400); throw new Error("Could not map specific variation in internal structures.");
    }
});

// Registers Temporary AI Dismissal
const dismissSuggestion = asyncHandler(async (req, res) => {
    const { userId, exerciseName, latestLogRef } = req.body;
    const user = await User.findById(userId);
    
    // Purge existing target gracefully
    user.dismissedSuggestions = user.dismissedSuggestions.filter(d => d.exerciseName !== exerciseName);
    user.dismissedSuggestions.push({ exerciseName, latestLogDateRef: new Date(latestLogRef) });
    await user.save();

    res.status(200).json({ message: "Suggestion explicitly swept from layout." });
});

module.exports = { getSuggestions, applySuggestion, dismissSuggestion };
