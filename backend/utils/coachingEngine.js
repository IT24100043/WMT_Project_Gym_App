// Native Coaching Rules Engine
// Takes Active Routine configurations & Historical Progression data determining targeted optimization

function evaluateExercise(exerciseName, planned, logs) {
    if (!logs || logs.length < 2) return null;

    const newest = logs[0];
    const previous = logs[1];

    // Helper: Falling short of layout?
    const isFailing = (log) => {
        if (log.actualSets < planned.sets) return true;
        if (planned.type === 'reps' && log.actualReps < planned.reps) return true;
        if (planned.type === 'time' && log.actualDuration < planned.duration) return true;
        return false;
    };

    // Helper: Meeting Target completely?
    const isMeetingTarget = (log) => {
        if (log.actualSets < planned.sets) return false;
        if (planned.type === 'reps' && log.actualReps >= planned.reps) return true;
        if (planned.type === 'time' && log.actualDuration >= planned.duration) return true;
        return false;
    };

    // Priority 1: Reduce load mapping if consistently failing structurally
    if (isFailing(newest) && isFailing(previous)) {
         if (planned.type === 'reps') {
              if (planned.weight > 5) {
                  return {
                      action: 'reduce_load',
                      field: 'defaultWeight',
                      oldValue: planned.weight,
                      newValue: planned.weight - 2.5,
                      reason: "📉 Needs Recalibration. You're falling shy of targets recently. Shedding weight to lock down form and rebuild."
                  };
              }
              if (planned.reps > 4) {
                  return {
                      action: 'reduce_reps',
                      field: 'reps',
                      oldValue: planned.reps,
                      newValue: planned.reps - 2,
                      reason: "📉 Endurance Limit Reached. Tapering reps downwards dynamically to allow muscular recovery."
                  };
              }
         } else if (planned.type === 'time') {
              return {
                  action: 'reduce_duration',
                  field: 'duration',
                  oldValue: planned.duration,
                  newValue: Math.max(10, planned.duration - 5),
                  reason: "📉 Form Priority. Let's shave off a few seconds structurally to ensure you hold perfect core stability."
              };
         }
    }

    // Priority 2 & 3: Progression scaling
    if (isMeetingTarget(newest) && isMeetingTarget(previous)) {
        if (planned.type === 'time') {
             if (newest.actualDuration > planned.duration) {
                  return {
                      action: 'increase_duration',
                      field: 'duration',
                      oldValue: planned.duration,
                      newValue: planned.duration + 5,
                      reason: "📈 Strong Progress Detected! Consistently cracking the time boundary. Let's escalate your timer dynamically."
                  };
             }
             return null;
        }

        // Reps based scaling
        if (newest.actualReps >= planned.reps && previous.actualReps >= planned.reps) {
             // If weight is tracked
             if (planned.weight > 0 || newest.actualWeight > 0) {
                 // Push weight
                 return {
                     action: 'increase_weight',
                     field: 'defaultWeight',
                     oldValue: planned.weight,
                     newValue: (planned.weight || newest.actualWeight) + 2.5,
                     reason: `📈 Peak Strength Reached! You successfully mastered the targets 2 sessions in a row. It is time to increase resistance.`
                 };
             } else {
                 // Bodyweight fallback
                 return {
                     action: 'increase_reps',
                     field: 'reps',
                     oldValue: planned.reps,
                     newValue: planned.reps + 1,
                     reason: "📈 Volume Matched! Pushing target repetitions linearly to force hypertrophy."
                 };
             }
        }

        // Exceeding reps massively (Volume check)
        if (newest.actualReps > planned.reps && previous.actualReps > planned.reps) {
             return {
                 action: 'increase_reps',
                 field: 'reps',
                 oldValue: planned.reps,
                 newValue: planned.reps + 1,
                 reason: "📈 High Endurance Detected! Punching above planned rep targets globally. Normalizing threshold up natively."
             };
        }
    }

    // Priority 4: Increase Sets natively (Requires 3 overlapping perfect records)
    if (logs.length >= 3) {
         if (isMeetingTarget(logs[0]) && isMeetingTarget(logs[1]) && isMeetingTarget(logs[2])) {
             if (logs[0].actualReps >= planned.reps + 2) {
                  return {
                      action: 'increase_sets',
                      field: 'sets',
                      oldValue: planned.sets,
                      newValue: planned.sets + 1,
                      reason: "🔥 Elite Status. Supercharged endurance reserves detected explicitly. Tactical extra set injection!"
                  };
             }
         }
    }

    return null; // Stable;
}

module.exports = { evaluateExercise };
