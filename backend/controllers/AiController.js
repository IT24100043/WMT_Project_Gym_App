const asyncHandler = require('../middleware/asyncHandler');
const axios = require('axios');

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
    // Deprecated: old image-upload AI flow. Kept temporarily for rollback safety.
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

// --- PHASE 6 ENGINES --- //

const mockRoutineFallback = (payload) => {
    // Generate a secure 7-day layout artificially bypassing external endpoint failure mapping dynamically
    const { fitnessGoal, targetArea, workoutLocation, availableDays } = payload;
    const daysArr = [];
    const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    
    let workoutCount = 0;
    for (let i = 0; i < 7; i++) {
        if (workoutCount < availableDays && i % 2 === 0) {
            daysArr.push({
                dayName: daysOfWeek[i],
                dayType: "workout",
                focus: `${workoutLocation} ${targetArea} Push`,
                notes: `Deterministic Fallback. Goal: ${fitnessGoal}`,
                exercises: [
                    { exerciseName: "Push-ups", type: "reps", sets: 3, reps: 10, duration: 0, defaultWeight: 0 },
                    { exerciseName: workoutLocation === 'gym' ? "Dumbbell Press" : "Plank", type: workoutLocation === 'gym' ? "reps" : "time", sets: 3, reps: 10, duration: 30, defaultWeight: workoutLocation === 'gym' ? 15 : 0 }
                ]
            });
            workoutCount++;
        } else {
            daysArr.push({
                dayName: daysOfWeek[i],
                dayType: "rest",
                focus: "",
                notes: "Recovery day",
                exercises: []
            });
        }
    }

    return {
        title: `Gemini AI Fallback Plan (${targetArea})`,
        goal: fitnessGoal,
        locationType: workoutLocation,
        notes: "Generated deterministically via Mock AI fallback.",
        days: daysArr
    };
};



const buildRoutineFromSplit = ({
    predictedSplit,
    fitnessGoal,
    experienceLevel,
    workoutLocation,
    availableDays,
    targetArea,
}) => {
    const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const workoutDays = Math.max(1, Math.min(Number(availableDays) || 4, 7));

    const makeExercise = (exerciseName, sets, reps, defaultWeight = 0) => ({
        exerciseName,
        type: "reps",
        sets,
        reps,
        duration: 0,
        defaultWeight
    });

    const makeTimeExercise = (exerciseName, duration) => ({
        exerciseName,
        type: "time",
        sets: 1,
        reps: 0,
        duration,
        defaultWeight: 0
    });

    const getWarmupExercises = (isGym) => {
        return isGym
            ? [
                makeTimeExercise("Treadmill Walk", 300),
                makeTimeExercise("Dynamic Shoulder Mobility", 120),
            ]
            : [
                makeTimeExercise("Jumping Jacks", 120),
                makeTimeExercise("Arm Circles", 90),
            ];
    };

    const getCooldownExercises = () => {
        return [
            makeTimeExercise("Standing Hamstring Stretch", 60),
            makeTimeExercise("Chest and Shoulder Stretch", 60),
        ];
    };

    const getFatLossCardio = (isGym) => {
        return isGym
            ? [
                makeTimeExercise("Treadmill Intervals", 600),
                makeTimeExercise("Cycling", 300),
            ]
            : [
                makeTimeExercise("High Knees", 180),
                makeTimeExercise("Mountain Climbers", 120),
            ];
    };

    const makeWorkoutDay = (dayName, focus, exercises, notes = "") => ({
        dayName,
        dayType: "workout",
        focus,
        notes,
        exercises
    });

    const makeRestDay = (dayName, notes = "Recovery day - light walking and mobility recommended") => ({
        dayName,
        dayType: "rest",
        focus: "",
        notes,
        exercises: []
    });

    const isGym = String(workoutLocation || "").toLowerCase() === "gym";
    const level = String(experienceLevel || "").toLowerCase();
    const split = String(predictedSplit || "").toLowerCase();

    let workoutTemplates = [];

    if (split.includes("push")) {
        workoutTemplates = [
            {
                focus: "Push",
                exercises: isGym
                    ? [
                        makeExercise("Bench Press", 4, level === "beginner" ? 10 : 8, 20),
                        makeExercise("Incline Dumbbell Press", 3, 10, 12),
                        makeExercise("Dumbbell Shoulder Press", 3, 10, 10),
                        makeExercise("Lateral Raise", 3, 12, 5),
                        makeExercise("Chest Fly", 3, 12, 8),
                        makeExercise("Tricep Pushdown", 3, 12, 10),
                    ]
                    : [
                        makeExercise("Push-ups", 4, 12, 0),
                        makeExercise("Pike Push-ups", 3, 10, 0),
                        makeExercise("Chair Dips", 3, 12, 0),
                        makeExercise("Incline Push-ups", 3, 12, 0),
                        makeExercise("Shoulder Taps", 3, 16, 0),
                        makeExercise("Diamond Push-ups", 3, 8, 0),
                    ]
            },
            {
                focus: "Pull",
                exercises: isGym
                    ? [
                        makeExercise("Lat Pulldown", 4, 10, 25),
                        makeExercise("Seated Row", 3, 10, 20),
                        makeExercise("Single Arm Dumbbell Row", 3, 10, 12),
                        makeExercise("Face Pull", 3, 12, 10),
                        makeExercise("Barbell Curl", 3, 12, 10),
                        makeExercise("Hammer Curl", 3, 12, 8),
                    ]
                    : [
                        makeExercise("Resistance Band Rows", 4, 12, 0),
                        makeExercise("Superman Hold", 3, 12, 0),
                        makeExercise("Back Extensions", 3, 12, 0),
                        makeExercise("Reverse Snow Angels", 3, 12, 0),
                        makeExercise("Towel Rows", 3, 10, 0),
                        makeExercise("Bicep Curl with Band", 3, 12, 0),
                    ]
            },
            {
                focus: "Legs",
                exercises: isGym
                    ? [
                        makeExercise("Squats", 4, 10, 20),
                        makeExercise("Leg Press", 3, 12, 40),
                        makeExercise("Romanian Deadlift", 3, 10, 20),
                        makeExercise("Walking Lunges", 3, 12, 10),
                        makeExercise("Leg Curl", 3, 12, 20),
                        makeExercise("Calf Raises", 4, 15, 15),
                    ]
                    : [
                        makeExercise("Bodyweight Squats", 4, 15, 0),
                        makeExercise("Lunges", 3, 12, 0),
                        makeExercise("Glute Bridges", 3, 15, 0),
                        makeExercise("Step-ups", 3, 12, 0),
                        makeExercise("Wall Sit", 3, 25, 0),
                        makeExercise("Standing Calf Raises", 4, 20, 0),
                    ]
            }
        ];
    } else if (split.includes("upper") && split.includes("lower")) {
        workoutTemplates = [
            {
                focus: "Upper Body",
                exercises: isGym
                    ? [
                        makeExercise("Chest Press", 4, 10, 20),
                        makeExercise("Lat Pulldown", 4, 10, 25),
                        makeExercise("Shoulder Press", 3, 10, 10),
                        makeExercise("Seated Row", 3, 10, 20),
                        makeExercise("Lateral Raise", 3, 12, 5),
                        makeExercise("Bicep Curl", 3, 12, 8),
                        makeExercise("Tricep Pushdown", 3, 12, 10),
                    ]
                    : [
                        makeExercise("Push-ups", 4, 12, 0),
                        makeExercise("Band Rows", 4, 12, 0),
                        makeExercise("Shoulder Taps", 3, 16, 0),
                        makeExercise("Pike Push-ups", 3, 10, 0),
                        makeExercise("Reverse Snow Angels", 3, 12, 0),
                        makeExercise("Chair Dips", 3, 12, 0),
                    ]
            },
            {
                focus: "Lower Body",
                exercises: isGym
                    ? [
                        makeExercise("Squats", 4, 10, 20),
                        makeExercise("Leg Press", 3, 12, 40),
                        makeExercise("Romanian Deadlift", 3, 10, 20),
                        makeExercise("Leg Curl", 3, 12, 20),
                        makeExercise("Walking Lunges", 3, 12, 10),
                        makeExercise("Calf Raises", 4, 15, 15),
                    ]
                    : [
                        makeExercise("Bodyweight Squats", 4, 15, 0),
                        makeExercise("Reverse Lunges", 3, 12, 0),
                        makeExercise("Glute Bridges", 3, 15, 0),
                        makeExercise("Wall Sit", 3, 25, 0),
                        makeExercise("Step-ups", 3, 12, 0),
                        makeExercise("Standing Calf Raises", 4, 20, 0),
                    ]
            }
        ];
    } else if (split.includes("rehab") || split.includes("modified")) {
        workoutTemplates = [
            {
                focus: "Low Impact Mobility",
                exercises: [
                    makeExercise("March in Place", 2, 20, 0),
                    makeExercise("Bodyweight Squats", 3, 12, 0),
                    makeExercise("Wall Push-ups", 3, 12, 0),
                    makeExercise("Bird Dog", 3, 12, 0),
                    makeExercise("Glute Bridge", 3, 15, 0),
                    makeExercise("Standing Calf Raises", 3, 15, 0),
                ]
            },
            {
                focus: "Core Stability",
                exercises: [
                    makeExercise("Dead Bug", 3, 12, 0),
                    makeExercise("Glute Bridge", 3, 15, 0),
                    makeExercise("Side Plank", 3, 10, 0),
                    makeExercise("Wall Sit", 3, 20, 0),
                    makeExercise("Heel Slides", 3, 12, 0),
                    makeExercise("Cat-Cow Mobility", 3, 12, 0),
                ]
            }
        ];
    } else {
        workoutTemplates = [
            {
                focus: targetArea || "Full Body",
                exercises: isGym
                    ? [
                        makeExercise("Chest Press", 3, 10, 20),
                        makeExercise("Lat Pulldown", 3, 10, 25),
                        makeExercise("Squats", 3, 12, 20),
                    ]
                    : [
                        makeExercise("Push-ups", 3, 12, 0),
                        makeExercise("Bodyweight Squats", 3, 15, 0),
                        makeExercise("Plank", 3, 30, 0),
                    ]
            }
        ];
    }

    const enrichWorkoutExercises = (mainExercises) => {
        const warmup = getWarmupExercises(isGym);
        const cooldown = getCooldownExercises();
        const isFatLoss = String(fitnessGoal || "").toLowerCase().includes("fat");

        let fullPlan = [...warmup, ...mainExercises];

        if (isFatLoss) {
            fullPlan = [...fullPlan, ...getFatLossCardio(isGym)];
        }

        fullPlan = [...fullPlan, ...cooldown];

        return fullPlan;
    };

    const days = [];
    let templateIndex = 0;
    let workoutCount = 0;

    for (let i = 0; i < 7; i++) {
        if (workoutCount < workoutDays && i % 2 === 0) {
            const template = workoutTemplates[templateIndex % workoutTemplates.length];
            days.push(
                makeWorkoutDay(
                    daysOfWeek[i],
                    template.focus,
                    enrichWorkoutExercises(template.exercises),
                    `Warm up first, complete the main workout, then finish with cooldown${String(fitnessGoal || "").toLowerCase().includes("fat") ? " and cardio finisher" : ""}. ML-predicted split: ${predictedSplit}`
                )
            );
            workoutCount++;
            templateIndex++;
        } else {
            days.push(makeRestDay(daysOfWeek[i]));
        }
    }

    return {
        title: `ML ${predictedSplit} Plan`,
        goal: fitnessGoal,
        locationType: workoutLocation,
        notes: `Generated using local ML model. Predicted split: ${predictedSplit}.`,
        days
    };
};

const generateRoutine = asyncHandler(async (req, res) => {
    const userId = getRequestUserId(req);

    const {
        age,
        gender,
        height,
        weight,
        fitness_goal,
        experience_level,
        equipment,
        days_per_week,
        injury,
        activity_level,
        body_type,
        sleep_quality,
        stress_level,
        workoutLocation,
        targetArea
    } = req.body;

    if (!userId) {
        return res.status(400).json({ message: "userId is required." });
    }

    if (
        !age ||
        !gender ||
        !height ||
        !weight ||
        !fitness_goal ||
        !experience_level ||
        !equipment ||
        !days_per_week ||
        !injury ||
        !activity_level ||
        !body_type ||
        !sleep_quality ||
        !stress_level
    ) {
        return res.status(400).json({
            message: "Missing required ML input fields."
        });
    }

    const payload = {
        age,
        gender,
        height,
        weight,
        fitness_goal,
        experience_level,
        equipment,
        days_per_week,
        injury,
        activity_level,
        body_type,
        sleep_quality,
        stress_level,

        // extra app-side fields
        location: workoutLocation || "Gym",
        target_area: targetArea || "Full Body",
        session_duration: 60
    };

    try {
        const mlServiceUrl = process.env.ML_SERVICE_URL || "http://127.0.0.1:8001";

        const mlResponse = await axios.post(`${mlServiceUrl}/predict`, payload);

        if (!mlResponse.data || !mlResponse.data.success) {
            throw new Error("ML service returned unsuccessful response.");
        }

        let predictedSplit = mlResponse.data.predicted_split;
        if (
            predictedSplit === "Modified / Rehab" &&
            injury === "No" &&
            String(fitness_goal).toLowerCase() === "muscle gain"
        ) {
            predictedSplit = equipment === "Full Gym" ? "Push Pull Legs" : "Full Body";
        }

        const routine = buildRoutineFromSplit({
            predictedSplit,
            fitnessGoal: fitness_goal,
            experienceLevel: experience_level,
            workoutLocation: workoutLocation || "Gym",
            availableDays: days_per_week,
            targetArea: targetArea || "Full Body",
        });

        return res.status(200).json({
            routine,
            mode: "ml_model",
            predictedSplit
        });
    } catch (error) {
        console.error("❌ ML SERVICE ERROR:", error.message);

        const fallbackPayload = {
            fitnessGoal: fitness_goal || "General Fitness",
            targetArea: targetArea || "Full Body",
            workoutLocation: workoutLocation || "Gym",
            availableDays: Number(days_per_week) || 4
        };

        return res.status(200).json({
            routine: mockRoutineFallback(fallbackPayload),
            mode: "offline",
            error: "ML model unavailable. Showing fallback routine."
        });
    }
});

module.exports = {
    generateRoutine
};
