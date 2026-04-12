const mongoose = require('mongoose');

const workoutSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    title: { type: String, required: true },
    workoutType: { type: String, required: true }, // e.g. Cardio, Strength, Flexibility
    goal: { type: String, required: true }, // e.g. Weight Loss, Muscle Gain
    locationType: { type: String, required: true }, // e.g. Home, Gym
    exerciseName: { type: String, required: true },
    sets: { type: Number, required: true },
    reps: { type: Number, required: true },
    duration: { type: Number, required: true }, // duration in minutes
    notes: { type: String, default: '' },
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Workout', workoutSchema);
