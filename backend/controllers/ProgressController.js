const WorkoutHistory = require('../models/WorkoutHistory');
const Workout = require('../models/Workout');
const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');

const getProgressDashboard = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    // Parameterized for future 'view all' scale
    let limitExerciseCount = parseInt(req.query.limit) || 5; 

    let activeRoutine = await Workout.findOne({ userId, isActive: true });
    if (!activeRoutine) {
        activeRoutine = await Workout.findOne({ userId });
    }
    
    const user = await User.findById(userId);

    if (!user) {
         res.status(404); throw new Error("User structure not verified dynamically.");
    }

    // Extract backwards timeline aggressively natively avoiding map limits
    const allHistory = await WorkoutHistory.find({ userId }).sort({ date: -1 });

    const totalSessionsCompleted = allHistory.filter(h => h.sessionType === 'workout').length;
    const totalRestDaysLogged = allHistory.filter(h => h.sessionType === 'rest').length;

    // Weekly Consistency Math
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const weeklyHistory = allHistory.filter(h => new Date(h.date) >= sevenDaysAgo);
    
    const weeklySessions = weeklyHistory.filter(h => h.sessionType === 'workout').length;
    const weeklyRestDays = weeklyHistory.filter(h => h.sessionType === 'rest').length;

    // Exercise MapReduce Algorithm
    const exerciseMap = {};
    let highestWeightLifted = 0;
    let highestWeightExercise = "-";

    allHistory.forEach(session => {
        if (session.sessionType === 'workout' && session.exercises) {
            session.exercises.forEach(ex => {
                if (!exerciseMap[ex.exerciseName]) {
                    exerciseMap[ex.exerciseName] = { logs: [] };
                }
                exerciseMap[ex.exerciseName].logs.push({
                    date: session.date,
                    weight: ex.actualWeight || 0,
                    reps: ex.actualReps || 0,
                    duration: ex.actualDuration || 0,
                    type: ex.type
                });

                if (ex.actualWeight > highestWeightLifted) {
                    highestWeightLifted = ex.actualWeight;
                    highestWeightExercise = ex.exerciseName;
                }
            });
        }
    });

    let topExercises = [];
    for (const [name, data] of Object.entries(exerciseMap)) {
        // Phase 4.1 Fix: Group same day duplicates cleanly ignoring rapid testing noise natively
        const groupedLogs = {};
        for (const l of data.logs) {
            const dString = new Date(l.date).toDateString();
            if (!groupedLogs[dString]) groupedLogs[dString] = { count: 0, weight: 0, reps: 0, duration: 0, date: l.date, type: l.type };
            
            // Map highest output for that day exactly
            if (l.weight > groupedLogs[dString].weight) groupedLogs[dString].weight = l.weight;
            if (l.reps > groupedLogs[dString].reps) groupedLogs[dString].reps = l.reps;
            if (l.duration > groupedLogs[dString].duration) groupedLogs[dString].duration = l.duration;
            groupedLogs[dString].count++;
        }
        
        // Sort explicitly by date
        const sortedDayLogs = Object.values(groupedLogs).sort((a,b) => new Date(b.date) - new Date(a.date));

        // Evaluate Trend based strictly on the two latest unique dates natively
        let trend = "stable";
        let trendDiff = "";
        
        if (sortedDayLogs.length >= 2) {
             const logA = sortedDayLogs[0]; // Newest
             const logB = sortedDayLogs[1]; // Previous

             if (logA.weight > logB.weight) {
                 trend = "up";
                 trendDiff = `(+${(logA.weight - logB.weight).toFixed(1).replace(/\.0$/, '')}kg)`;
             } else if (logA.weight < logB.weight) {
                 trend = "down";
                 trendDiff = `(${(logA.weight - logB.weight).toFixed(1).replace(/\.0$/, '')}kg)`;
             } else {
                 const volA = logA.type === 'reps' ? logA.reps : logA.duration;
                 const volB = logB.type === 'reps' ? logB.reps : logB.duration;
                 
                 if (volA > volB) {
                     trend = "up"; 
                     trendDiff = `(+${volA - volB} ${logA.type === 'reps' ? 'reps' : 'sec'})`;
                 } else if (volA < volB) {
                     trend = "down";
                     trendDiff = `(${volA - volB} ${logA.type === 'reps' ? 'reps' : 'sec'})`;
                 } else {
                     trend = "stable";
                     trendDiff = `(No change)`;
                 }
             }
        }
        
        topExercises.push({
             exerciseName: name,
             frequency: data.logs.length, // total gross instances
             trendDirection: trend,
             trendDiff: trendDiff,
             recentLogs: sortedDayLogs.slice(0, 3) 
        });
    }

    // Isolate simply the Top N executed dynamically preventing UI pollution
    topExercises.sort((a, b) => b.frequency - a.frequency);
    
    const limitedExercises = topExercises.slice(0, limitExerciseCount);
    const mostRepeatedExercise = topExercises.length > 0 ? topExercises[0].exerciseName : "-";

    const payload = {
        overview: {
            totalSessionsCompleted,
            totalRestDaysLogged,
            currentStreak: user.currentStreak || 0,
            activeRoutineTitle: activeRoutine ? activeRoutine.title : "No Active Routine",
            lastWorkoutDate: user.lastCompletedWorkoutDate || null
        },
        weeklyConsistency: {
            sessionsThisWeek: weeklySessions,
            restDaysThisWeek: weeklyRestDays
        },
        highlights: {
            highestWeightLifted,
            highestWeightExercise,
            mostRepeatedExercise
        },
        exerciseProgress: limitedExercises,
        totalExerciseCount: topExercises.length
    };

    res.status(200).json(payload);
});

module.exports = { getProgressDashboard };
