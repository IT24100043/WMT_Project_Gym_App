const mogoose = require('mongoose');

const userSchema = new mogoose.Schema({
    name: {
        type: String,
        required: true, 
    }, 
    age: {
        type: Number,
        required: true,
    },  
    userNICcardNumber: {
        type: String,
        required: true,
        unique: true,
    },  
    userContactNumber: {
        type: String,
        required: true,
    },
    userEmail: {
        type: String,  
        required: true,
        unique: true, 
    }, 
    password: {
        type: String,   
        required: true,
    },
    dpUrl: {
        type: String,
        default: null,
    },
    // Streak Logistics
    currentStreak: { type: Number, default: 0 },
    missedWorkoutDays: { type: Number, default: 0 },
    lastCompletedWorkoutDate: { type: Date, default: null },
    dismissedSuggestions: {
        type: [
            {
               exerciseName: String,
               latestLogDateRef: Date
            }
        ],
        default: []
    },
    createdAt: { 
        type: String,
        required: false,
    },
    role: { 
        type: String,
        required: true,
    },

}, { timestamps: true });

module.exports = mogoose.model('User', userSchema);