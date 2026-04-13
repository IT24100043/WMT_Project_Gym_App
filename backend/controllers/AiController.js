const asyncHandler = require('../middleware/asyncHandler');
const { GoogleGenerativeAI } = require('@google/generative-ai');

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
        title: `GPT-5.1 Engine Fallback Plan (${targetArea})`,
        goal: fitnessGoal,
        locationType: workoutLocation,
        notes: "Generated deterministically via Mock AI fallback.",
        days: daysArr
    };
};

const validateRoutineSchema = (routine, locOpts) => {
    if (!routine || !routine.days || routine.days.length !== 7) return false;
    
    let workoutCount = 0;
    for (let d of routine.days) {
         if (d.dayType === 'workout') {
             workoutCount++;
             if (!d.exercises || d.exercises.length === 0) return false;
             for (let e of d.exercises) {
                 if (locOpts === 'home' && e.defaultWeight > 0) e.defaultWeight = 0; 
                 if (e.type === 'reps' && !e.reps) return false;
                 if (e.type === 'time' && !e.duration) return false;
             }
         } else if (d.dayType === 'rest') {
             if (d.exercises && d.exercises.length > 0) return false;
         }
    }
    return true;
};

const generateRoutine = asyncHandler(async (req, res) => {
    const userId = getRequestUserId(req);
    const { age, gender, height, weight, fitnessGoal, experienceLevel, workoutLocation, availableDays, targetArea } = req.body;

    if (!userId || !age || !gender || !fitnessGoal || !workoutLocation || !availableDays) {
         return res.status(400).json({ message: "Missing required core fields natively." });
    }

    const payload = { age, gender, height, weight, fitnessGoal, experienceLevel, workoutLocation, availableDays, targetArea };

    console.log("🔍 AI MODE:", process.env.GEMINI_API_KEY ? "ONLINE (Connected to Gemini)" : "OFFLINE (No Key)");

    if (!process.env.GEMINI_API_KEY) {
        // Mock AI Fallback 
        await new Promise(resolve => setTimeout(resolve, 2500));
        const mockRoutine = mockRoutineFallback(payload);
        return res.status(200).json({ routine: mockRoutine, mode: 'offline' });
    }

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const prompt = `You are a professional fitness architect. Generate EXACTLY one raw JSON object containing a 7-day fitness routine natively. No formatting markdown around it. Do not include \`\`\`json or \`\`\`. Just raw JSON data.
        
        Goals: ${fitnessGoal}, Focus: ${targetArea}, Age: ${age}, Gender: ${gender}, Weight: ${weight}kg.
        Constraints:
        - Output strictly exactly 7 days (Monday through Sunday) inside a "days" array.
        - Use exactly ${availableDays} "workout" days. The remaining must be "rest" days.
        - Location: ${workoutLocation}. If home, NO machines or weights (defaultWeight=0). If gym, keep defaultWeights realistic for ${experienceLevel} (10-40kg).
        - Exercise type MUST be strictly "reps" or "time". If "reps", include "sets" and "reps". If "time", include "duration" in seconds.
        - Schema exactly mimicking this structure globally:
          { "title": "string", "goal": "string", "locationType": "${workoutLocation}", "notes": "string", "days": [ { "dayName": "string", "dayType": "workout" | "rest", "focus": "string", "notes": "string", "exercises": [ { "exerciseName": "string", "type": "reps" | "time", "sets": number, "reps": number, "duration": number, "defaultWeight": number } ] } ] }`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        
        // Strip markdown backticks if Gemini hallucinated them
        const cleanText = text.replace(/```json|```/g, "").trim();
        const generatedRoutine = JSON.parse(cleanText);

        // Run Local Security checks
        if (!validateRoutineSchema(generatedRoutine, workoutLocation)) {
             throw new Error("Validation Failed internally. Generating fallback structurally.");
        }

        return res.status(200).json({ routine: generatedRoutine, mode: 'online' });

    } catch (error) {
        console.error("❌ GEMINI ERROR:", error.message);
        await new Promise(resolve => setTimeout(resolve, 1500));
        return res.status(200).json({ 
             routine: mockRoutineFallback(payload), 
             mode: 'offline',
             error: error.message 
        });
    }
});

module.exports = {
    generatePlan,
    generateRoutine
};
