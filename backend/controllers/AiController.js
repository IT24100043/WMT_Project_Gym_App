const asyncHandler = require('../middleware/asyncHandler');

// Helper to reliably get the requesting User ID whether from future JWT or current body
const getRequestUserId = (req) => {
    return (req.user && req.user.id) || (req.body && req.body.userId);
};

// ... ruleEngine function remains exactly same ...
const ruleEngine = (level, loc, goal, days) => {
    const l = level ? level.toLowerCase() : '';
    const gymOrHome = loc ? loc.toLowerCase() : '';
    const g = goal ? goal.toLowerCase() : '';

    if (l === 'beginner' && gymOrHome === 'home' && g === 'weight loss') {
        return {
            title: "Beginner Home Fat Loss Plan",
            daysPerWeek: days || 4,
            exercises: ["Jumping Jacks", "Bodyweight Squats", "Forward Lunges", "Planks"],
            setsAndReps: "3 sets of 15 reps (or 30 seconds for planks)",
            notes: "Focus on keeping your heart rate up and taking short 45-second rests between sets."
        };
    }
    if (l === 'beginner' && gymOrHome === 'gym' && g === 'muscle gain') {
        return {
            title: "Beginner Gym Muscle Gain Plan",
            daysPerWeek: days || 4,
            exercises: ["Machine Chest Press", "Lat Pulldown", "Leg Press", "Dumbbell Shoulder Press"],
            setsAndReps: "3 sets of 10-12 reps",
            notes: "Focus on slow, controlled movements. Rest 90 seconds between sets."
        };
    }
    if (l === 'intermediate' && gymOrHome === 'home' && g === 'general fitness') {
        return {
            title: "Home Fitness Plan",
            daysPerWeek: days || 5,
            exercises: ["Push-ups", "Bodyweight Squats", "Mountain Climbers", "Planks"],
            setsAndReps: "4 sets of 15-20 reps",
            notes: "Perform as a circuit. Rest 60 seconds at the end of each circuit."
        };
    }
    if (l === 'intermediate' && gymOrHome === 'gym' && g === 'fat loss') {
        return {
            title: "Gym Fat Loss Plan",
            daysPerWeek: days || 5,
            exercises: ["Treadmill Intervals", "Dumbbell Circuits", "Rowing Machine", "Burpees"],
            setsAndReps: "4 sets of 15 reps (or 1 min intervals for cardio)",
            notes: "Keep intensity high. Drink plenty of water."
        };
    }

    return {
        title: `Custom ${level} ${loc} ${goal} Plan`,
        daysPerWeek: days || 3,
        exercises: ["Full Body Stretching", "Light Jogging", "Push-ups", "Squats"],
        setsAndReps: "3 sets of 10",
        notes: "This is a generalized plan because your specific combination didn't match a strict preset."
    };
};

const generatePlan = asyncHandler(async (req, res) => {
    const userId = getRequestUserId(req);
    
    // Grab fields from req.body (express handles multipart/form-data via multer into req.body)
    const { age, gender, height, weight, fitnessGoal, experienceLevel, workoutLocation, availableDays, targetArea } = req.body;

    // 1. Missing field validation
    if (!userId) {
         res.status(400);
         throw new Error("userId is required.");
    }
    
    if (!age || !gender || !height || !weight || !fitnessGoal || !experienceLevel || !workoutLocation || !availableDays || !targetArea) {
        res.status(400);
        throw new Error("Please fill all required profile fields to generate a plan.");
    }

    // 2. Check for uploaded image
    let imageUrl = null;
    if (req.file) {
        imageUrl = `/uploads/${req.file.filename}`;
    } else {
         res.status(400);
         throw new Error("A full-body image is required for this feature.");
    }

    // 3. Generate Rule-Based Plan
    const generatedPlan = ruleEngine(experienceLevel, workoutLocation, fitnessGoal, availableDays);

    // 4. Return the clean JSON
    res.status(200).json({
        message: "A rule-based workout recommendation system with image upload support, designed to be improved later into a more advanced AI-based feature.",
        imageUrl: imageUrl,
        userProfileConfigured: { age, gender, height, weight, targetArea },
        recommendation: generatedPlan
    });
});

module.exports = {
    generatePlan
};
