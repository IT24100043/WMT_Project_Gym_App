const mongoose = require('mongoose');

const DailyLogSchema = new mongoose.Schema({
  userId: { type: String, required: true }, // User Identifier [cite: 114]
  date: { type: String, required: true },   // YYYY-MM-DD format [cite: 66]
  
  waterGoal: { type: Number, default: 2000 },
  waterEntries: [{
    amount: Number,
    time: { type: Date, default: Date.now }
  }],

  calorieGoal: { type: Number, default: 2500 },
  foodEntries: [{
    foodName: String,
    calories: Number,
    time: { type: Date, default: Date.now }
  }]
});

module.exports = mongoose.model('DailyLog', DailyLogSchema);