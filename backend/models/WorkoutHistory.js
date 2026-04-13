const mongoose = require('mongoose');

const workoutHistorySchema = new mongoose.Schema({
    userId: { type: String, required: true },
    workoutId: { type: String, required: true },
    dayName: { type: String, required: true },
    sessionType: { type: String, enum: ['workout', 'rest'], default: 'workout' },
    date: { type: Date, default: Date.now },
    exercises: [{
        exerciseName: { type: String, required: true },
        type: { type: String, enum: ['reps', 'time'], default: 'reps' },
        
        // Planned Logic (Taken from blueprint)
        plannedSets: { type: Number, default: 0 },
        plannedReps: { type: Number, default: 0 },
        plannedDuration: { type: Number, default: 0 },
        plannedWeight: { type: Number, default: 0 },
        
        // Actual Logs (Recorded by user)
        actualSets: { type: Number, default: 0 },
        actualReps: { type: Number, default: 0 },
        actualDuration: { type: Number, default: 0 },
        actualWeight: { type: Number, default: 0 }
    }]
});

module.exports = mongoose.model('WorkoutHistory', workoutHistorySchema);
