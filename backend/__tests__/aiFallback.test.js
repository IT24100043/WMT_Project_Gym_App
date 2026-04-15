/**
 * Backend Test: AI Fallback + Validation
 * Tests mockRoutineFallback always returns a valid 7-day routine
 * Tests validateRoutineSchema catches invalid structures
 */

// We need to extract the functions from AiController.
// Since they aren't exported, we test the logic pattern directly.
// For now, replicate the exact logic for unit-level coverage.

const mockRoutineFallback = (payload) => {
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

const validateRoutineSchema = (routine, locOpts) => {
    if (!routine || !routine.days || routine.days.length !== 7) return false;
    
    for (let d of routine.days) {
         if (d.dayType === 'workout') {
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

describe('mockRoutineFallback', () => {
    test('always returns exactly 7 days', () => {
        const result = mockRoutineFallback({
            fitnessGoal: 'Muscle Gain',
            targetArea: 'Full Body',
            workoutLocation: 'gym',
            availableDays: 4
        });
        expect(result.days).toHaveLength(7);
    });

    test('never creates more workout days than availableDays', () => {
        for (let available = 1; available <= 7; available++) {
            const result = mockRoutineFallback({
                fitnessGoal: 'Weight Loss',
                targetArea: 'Core',
                workoutLocation: 'home',
                availableDays: available
            });
            const workoutDays = result.days.filter(d => d.dayType === 'workout').length;
            expect(workoutDays).toBeLessThanOrEqual(available);
        }
    });

    test('all 7 day names are valid', () => {
        const validDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
        const result = mockRoutineFallback({
            fitnessGoal: 'General Fitness',
            targetArea: 'Upper Body',
            workoutLocation: 'gym',
            availableDays: 3
        });
        result.days.forEach(d => {
            expect(validDays).toContain(d.dayName);
        });
    });

    test('workout days have exercises, rest days have none', () => {
        const result = mockRoutineFallback({
            fitnessGoal: 'Muscle Gain',
            targetArea: 'Full Body',
            workoutLocation: 'gym',
            availableDays: 4
        });
        result.days.forEach(d => {
            if (d.dayType === 'workout') {
                expect(d.exercises.length).toBeGreaterThan(0);
            } else {
                expect(d.exercises).toHaveLength(0);
            }
        });
    });

    test('returns title containing target area', () => {
        const result = mockRoutineFallback({
            fitnessGoal: 'Endurance',
            targetArea: 'Legs',
            workoutLocation: 'gym',
            availableDays: 3
        });
        expect(result.title).toContain('Legs');
    });

    test('home workouts have bodyweight exercises (Plank) instead of Dumbbell Press', () => {
        const result = mockRoutineFallback({
            fitnessGoal: 'General Fitness',
            targetArea: 'Core',
            workoutLocation: 'home',
            availableDays: 3
        });
        const workoutDay = result.days.find(d => d.dayType === 'workout');
        const exerciseNames = workoutDay.exercises.map(e => e.exerciseName);
        expect(exerciseNames).toContain('Plank');
        expect(exerciseNames).not.toContain('Dumbbell Press');
    });
});

describe('validateRoutineSchema', () => {
    test('returns false for null/undefined input', () => {
        expect(validateRoutineSchema(null, 'gym')).toBe(false);
        expect(validateRoutineSchema(undefined, 'gym')).toBe(false);
    });

    test('returns false if days array is not exactly 7', () => {
        expect(validateRoutineSchema({ days: [] }, 'gym')).toBe(false);
        expect(validateRoutineSchema({ days: [{ dayType: 'rest' }] }, 'gym')).toBe(false);
    });

    test('returns true for valid fallback routine', () => {
        const routine = mockRoutineFallback({
            fitnessGoal: 'Muscle Gain',
            targetArea: 'Full Body',
            workoutLocation: 'gym',
            availableDays: 4
        });
        expect(validateRoutineSchema(routine, 'gym')).toBe(true);
    });

    test('returns false if workout day has no exercises', () => {
        const routine = mockRoutineFallback({
            fitnessGoal: 'Muscle Gain',
            targetArea: 'Full Body',
            workoutLocation: 'gym',
            availableDays: 4
        });
        // Sabotage: remove exercises from first workout day
        const workoutDay = routine.days.find(d => d.dayType === 'workout');
        workoutDay.exercises = [];
        expect(validateRoutineSchema(routine, 'gym')).toBe(false);
    });

    test('returns false if rest day has exercises', () => {
        const routine = mockRoutineFallback({
            fitnessGoal: 'Muscle Gain',
            targetArea: 'Full Body',
            workoutLocation: 'gym',
            availableDays: 3
        });
        // Sabotage: add exercise to rest day
        const restDay = routine.days.find(d => d.dayType === 'rest');
        restDay.exercises = [{ exerciseName: 'Fake', type: 'reps', reps: 10 }];
        expect(validateRoutineSchema(routine, 'gym')).toBe(false);
    });

    test('zeros out weight for home workouts', () => {
        const routine = mockRoutineFallback({
            fitnessGoal: 'Muscle Gain',
            targetArea: 'Full Body',
            workoutLocation: 'gym',
            availableDays: 3
        });
        // Manually set a weight
        const workoutDay = routine.days.find(d => d.dayType === 'workout');
        workoutDay.exercises[0].defaultWeight = 20;
        // Validate with 'home' — should zero it out
        validateRoutineSchema(routine, 'home');
        expect(workoutDay.exercises[0].defaultWeight).toBe(0);
    });
});
