const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Workout = require('./models/Workout');

dotenv.config();

async function clearWorkouts() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected natively! Executing target delete command...');
    
    // Explicitly target ONLY workouts
    const result = await Workout.deleteMany({});
    
    console.log('Success! Deleted stale single-day workouts:', result.deletedCount);
    await mongoose.disconnect();
    console.log('Safely Disconnected. Phase 1 ready.');
  } catch (error) {
    console.error('Error clearing workouts safely:', error);
  }
}

clearWorkouts();
