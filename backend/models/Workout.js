const mongoose = require('mongoose');

const workoutSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    title: { type: String, required: true },
    goal: { type: String, required: true }, 
    locationType: { type: String, required: true }, 
    notes: { type: String, default: '' },
    
    // Identifies if this is the currently "Active" routine executing weekly
    isActive: { type: Boolean, default: false },
    
    // Core Routine Array (strictly 7 days expected)
    days: [{
        dayName: { 
            type: String, 
            enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
            required: true 
        },
        dayType: { 
            type: String, 
            enum: ['workout', 'rest'], 
            required: true 
        },
        focus: { type: String, default: '' },
        notes: { type: String, default: '' },
        exercises: [{
            exerciseName: { type: String, required: true },
            type: { type: String, enum: ['reps', 'time'], default: 'reps' },
            sets: { type: Number },
            reps: { type: Number },
            duration: { type: Number },
            durationUnit: { type: String, enum: ['seconds', 'minutes'], default: 'seconds' },
            defaultWeight: { type: Number } 
        }]
    }],

    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Workout', workoutSchema);
