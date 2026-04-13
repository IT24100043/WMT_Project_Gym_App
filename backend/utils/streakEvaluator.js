const User = require('../models/User');
const Workout = require('../models/Workout');

const evaluateUserStreak = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user || !user.lastCompletedWorkoutDate) return user;

        let routine = await Workout.findOne({ userId, isActive: true });
        if (!routine) return user;

        const today = new Date();
        today.setHours(0,0,0,0);
        
        const lastCompleted = new Date(user.lastCompletedWorkoutDate);
        lastCompleted.setHours(0,0,0,0);
        
        const diffDays = Math.floor((today - lastCompleted) / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 1) return user;

        const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        let missedPlannedWorkoutDays = 0;

        for (let i = 1; i < diffDays; i++) {
            let checkDate = new Date(today);
            checkDate.setDate(checkDate.getDate() - i);
            let dayName = daysOfWeek[checkDate.getDay()];
            
            let routineDay = routine.days.find(d => d.dayName === dayName);
            // Only penalize if the missed day was scheduled as a 'workout' natively
            if (routineDay && routineDay.dayType === 'workout') {
                missedPlannedWorkoutDays++;
            }
        }

        // Apply rules natively
        if (missedPlannedWorkoutDays >= 3) {
            user.currentStreak = 0;
            user.missedWorkoutDays = missedPlannedWorkoutDays;
            await user.save();
        }

        return user;
    } catch(err) {
        console.error("Streak Evaluation Error:", err);
        return await User.findById(userId);
    }
}

module.exports = { evaluateUserStreak };
