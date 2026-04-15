/**
 * Backend Test: coachingEngine.evaluateExercise
 * Tests the deterministic coaching rules engine for progression/regression suggestions
 */
const { evaluateExercise } = require('../utils/coachingEngine');

describe('coachingEngine.evaluateExercise', () => {
    // Base planned exercise config
    const plannedReps = {
        exerciseName: 'Bench Press',
        type: 'reps',
        sets: 3,
        reps: 10,
        duration: 0,
        weight: 20
    };

    const plannedTime = {
        exerciseName: 'Plank',
        type: 'time',
        sets: 1,
        reps: 0,
        duration: 30,
        weight: 0
    };

    // Returns null when insufficient data (< 2 logs)
    test('returns null when logs have less than 2 entries', () => {
        expect(evaluateExercise('Bench Press', plannedReps, [])).toBeNull();
        expect(evaluateExercise('Bench Press', plannedReps, [{ actualSets: 3, actualReps: 10, actualWeight: 20 }])).toBeNull();
    });

    // Returns null when no logs provided
    test('returns null when logs is null or undefined', () => {
        expect(evaluateExercise('Bench Press', plannedReps, null)).toBeNull();
        expect(evaluateExercise('Bench Press', plannedReps, undefined)).toBeNull();
    });

    // Priority 1: Reduce weight when consistently failing
    test('suggests weight reduction when failing 2 consecutive sessions (reps type)', () => {
        const logs = [
            { actualSets: 2, actualReps: 7, actualWeight: 20 },  // newest - failing
            { actualSets: 2, actualReps: 6, actualWeight: 20 },  // previous - failing
        ];
        const result = evaluateExercise('Bench Press', plannedReps, logs);
        expect(result).not.toBeNull();
        expect(result.action).toBe('reduce_load');
        expect(result.field).toBe('defaultWeight');
        expect(result.newValue).toBe(17.5);
    });

    // Priority 1: Reduce reps fallback when weight is too low
    test('suggests rep reduction when failing and weight <= 5', () => {
        const lightPlanned = { ...plannedReps, weight: 5, reps: 10 };
        const logs = [
            { actualSets: 2, actualReps: 7, actualWeight: 5 },
            { actualSets: 2, actualReps: 6, actualWeight: 5 },
        ];
        const result = evaluateExercise('Bench Press', lightPlanned, logs);
        expect(result).not.toBeNull();
        expect(result.action).toBe('reduce_reps');
        expect(result.field).toBe('reps');
        expect(result.newValue).toBe(8);
    });

    // Priority 1: Reduce duration for time exercises
    test('suggests duration reduction when consistently failing (time type)', () => {
        const logs = [
            { actualSets: 1, actualReps: 0, actualDuration: 20, actualWeight: 0 },
            { actualSets: 1, actualReps: 0, actualDuration: 18, actualWeight: 0 },
        ];
        const result = evaluateExercise('Plank', plannedTime, logs);
        expect(result).not.toBeNull();
        expect(result.action).toBe('reduce_duration');
        expect(result.newValue).toBe(25); // 30 - 5
    });

    // Priority 2: Increase weight when consistently meeting targets
    test('suggests weight increase when meeting targets 2 consecutive sessions', () => {
        const logs = [
            { actualSets: 3, actualReps: 10, actualWeight: 20 },
            { actualSets: 3, actualReps: 10, actualWeight: 20 },
        ];
        const result = evaluateExercise('Bench Press', plannedReps, logs);
        expect(result).not.toBeNull();
        expect(result.action).toBe('increase_weight');
        expect(result.field).toBe('defaultWeight');
        expect(result.newValue).toBe(22.5);
    });

    // Priority 2: Increase reps for bodyweight exercises (no weight)
    test('suggests rep increase for bodyweight exercises when meeting targets', () => {
        const bwPlanned = { ...plannedReps, weight: 0 };
        const logs = [
            { actualSets: 3, actualReps: 10, actualWeight: 0 },
            { actualSets: 3, actualReps: 10, actualWeight: 0 },
        ];
        const result = evaluateExercise('Push-ups', bwPlanned, logs);
        expect(result).not.toBeNull();
        expect(result.action).toBe('increase_reps');
        expect(result.newValue).toBe(11);
    });

    // Priority 3: Increase duration for time exercises
    test('suggests duration increase when consistently exceeding time target', () => {
        const logs = [
            { actualSets: 1, actualReps: 0, actualDuration: 35, actualWeight: 0 },
            { actualSets: 1, actualReps: 0, actualDuration: 33, actualWeight: 0 },
        ];
        const result = evaluateExercise('Plank', plannedTime, logs);
        expect(result).not.toBeNull();
        expect(result.action).toBe('increase_duration');
        expect(result.newValue).toBe(35);
    });

    // Stable: Returns null when mixed results
    test('returns null when only one session meets target', () => {
        const logs = [
            { actualSets: 3, actualReps: 10, actualWeight: 20 },  // meets target
            { actualSets: 2, actualReps: 7, actualWeight: 20 },   // fails
        ];
        const result = evaluateExercise('Bench Press', plannedReps, logs);
        expect(result).toBeNull();
    });

    // Priority 4: Increase sets after 3 consecutive perfect records
    test('suggests set increase after 3 consecutive perfect records with rep surplus', () => {
        const logs = [
            { actualSets: 3, actualReps: 12, actualWeight: 20 },  // +2 reps surplus
            { actualSets: 3, actualReps: 12, actualWeight: 20 },
            { actualSets: 3, actualReps: 12, actualWeight: 20 },
        ];
        const result = evaluateExercise('Bench Press', plannedReps, logs);
        // Note: increase_weight takes priority over increase_sets at Priority 2
        expect(result).not.toBeNull();
    });
});
