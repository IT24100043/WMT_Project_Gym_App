import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { AuthContext } from '@/context/AuthContext';
import { API_ENDPOINTS } from '@/constants/api';

const WORKOUTS_API = API_ENDPOINTS.WORKOUTS;
const SESSIONS_API = API_ENDPOINTS.SESSION_FINISH;

const NumberStepper = ({ value, label, onChange }) => {
  const [localText, setLocalText] = useState(value);

  useEffect(() => { setLocalText(value); }, [value]);

  const numValue = isNaN(parseInt(value)) ? 0 : parseInt(value);
  
  const decrement = () => {
    if (numValue > 0) {
       const v = (numValue - 1).toString();
       setLocalText(v);
       onChange(v);
    }
  };
  
  const increment = () => {
    const v = (numValue + 1).toString();
    setLocalText(v);
    onChange(v);
  };

  const handleTextChange = (text) => {
    const cleanText = text.replace(/[^0-9]/g, '');
    setLocalText(cleanText);
    onChange(cleanText === '' ? '0' : cleanText);
  };

  return (
    <View style={styles.stepperContainer}>
      <Text style={styles.subLabel}>{label}</Text>
      <View style={styles.stepperControl}>
        <TouchableOpacity style={styles.stepBtn} onPress={decrement}>
           <Text style={styles.stepBtnText}>-</Text>
        </TouchableOpacity>
        <TextInput 
           style={styles.stepInput} 
           value={localText} 
           onChangeText={handleTextChange} 
           keyboardType="numeric" 
           selectTextOnFocus={true} 
           placeholder="0"
        />
        <TouchableOpacity style={styles.stepBtn} onPress={increment}>
           <Text style={styles.stepBtnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function CarouselSessionScreen() {
  const router = useRouter();
  const { workoutId, dayName } = useLocalSearchParams();
  const { user } = useContext(AuthContext);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [routineTitle, setRoutineTitle] = useState('');
  const [exercises, setExercises] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  useEffect(() => {
    if (workoutId && dayName) fetchRoutineDay();
  }, [workoutId, dayName]);

  const fetchRoutineDay = async () => {
    try {
      const res = await fetch(`${WORKOUTS_API}/${workoutId}?userId=${user?.id || user?._id || 'testUser123'}`);
      const data = await res.json();
      
      if (res.ok) {
        setRoutineTitle(data.workout.title);
        
        const targetDay = data.workout.days.find(d => d.dayName === dayName);
        if (!targetDay || targetDay.dayType !== 'workout') {
             Alert.alert('Error', 'Invalid Session Configuration');
             return;
        }

        const mappedExercises = targetDay.exercises.map((ex, idx) => ({
            id: ex._id || Date.now().toString() + idx,
            exerciseName: ex.exerciseName,
            type: ex.type,
            
            plannedSets: ex.sets || 0,
            plannedReps: ex.reps || 0,
            plannedDuration: ex.duration || 0,
            plannedWeight: ex.defaultWeight || 0,
            
            actualSets: (ex.sets || 0).toString(),
            actualReps: (ex.reps || 0).toString(),
            actualDuration: (ex.duration || 0).toString(),
            actualWeight: (ex.defaultWeight || 0).toString(),
            
            skipped: false
        }));

        setExercises(mappedExercises);
        setCurrentIndex(0);

      }
    } catch (error) {
      Alert.alert('Network Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateActual = (field, value) => {
      const cloned = [...exercises];
      cloned[currentIndex][field] = value;
      cloned[currentIndex].skipped = false; // Retain tracking context smoothly natively
      setExercises(cloned);
  };
  
  const handleSkipExercise = () => {
      const cloned = [...exercises];
      cloned[currentIndex].actualSets = '0';
      cloned[currentIndex].actualReps = '0';
      cloned[currentIndex].actualDuration = '0';
      cloned[currentIndex].actualWeight = '0';
      cloned[currentIndex].skipped = true;
      setExercises(cloned);
      setCurrentIndex(prev => prev + 1);
  };

  const handleCancelSession = () => {
      Alert.alert('Confirm Exit', 'Your session progress will be lost. Continue?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Exit Session', style: 'destructive', onPress: () => router.back() }
      ]);
  };

  const handleFinishSession = async () => {
    try {
      setSubmitting(true);
      
      const payloadExercises = exercises.map(ex => ({
          exerciseName: ex.exerciseName,
          type: ex.type,
          plannedSets: parseInt(ex.plannedSets),
          plannedReps: parseInt(ex.plannedReps),
          plannedDuration: parseInt(ex.plannedDuration),
          plannedWeight: parseInt(ex.plannedWeight),
          
          actualSets: isNaN(parseInt(ex.actualSets)) ? 0 : parseInt(ex.actualSets),
          actualReps: isNaN(parseInt(ex.actualReps)) ? 0 : parseInt(ex.actualReps),
          actualDuration: isNaN(parseInt(ex.actualDuration)) ? 0 : parseInt(ex.actualDuration),
          actualWeight: isNaN(parseInt(ex.actualWeight)) ? 0 : parseInt(ex.actualWeight)
      }));

      const payload = {
        userId: user?.id || user?._id || 'testUser123',
        workoutId,
        dayName,
        sessionType: 'workout',
        exercises: payloadExercises
      };

      const res = await fetch(SESSIONS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok || res.status === 201) {
        Alert.alert('Superior Effort!', 'Session completed and preserved natively!', [{ text: 'Awesome', onPress: () => router.push('/workouts') }]);
      } else {
        const data = await res.json();
        Alert.alert('Submission Error', data.message || 'Failed to map history natively.');
      }
    } catch (error) {
      Alert.alert('Network Error', error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || currentIndex === -1) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  // Final Summary Screen Block
  if (currentIndex >= exercises.length) {
      return (
         <ScrollView contentContainerStyle={{ padding: 16 }}>
             <Text style={styles.summaryTitle}>Mission Accomplished! 🏆</Text>
             <Text style={styles.summarySubtitle}>Review your actual metrics before pushing.</Text>
             
             {exercises.map((ex, idx) => (
                <View key={idx} style={[styles.summaryCard, ex.skipped && { borderColor: '#fca5a5', backgroundColor: '#fef2f2' }]}>
                    <Text style={styles.summaryExName}>{ex.exerciseName} {ex.skipped && '(Skipped)'}</Text>
                    <View style={styles.summaryGrid}>
                        <View style={styles.summaryCol}>
                            <Text style={styles.summaryLabel}>Planned</Text>
                            <Text style={styles.summaryStat}>
                                {ex.type === 'reps' ? `${ex.plannedSets}x${ex.plannedReps} @ ${ex.plannedWeight}kg` : `${ex.plannedDuration}s @ ${ex.plannedWeight}kg`}
                            </Text>
                        </View>
                        <View style={styles.summaryCol}>
                            <Text style={styles.summaryLabel}>Actual Log</Text>
                            <Text style={[styles.summaryStatActual, ex.skipped && { color: '#ef4444' }]}>
                                {ex.type === 'reps' ? `${ex.actualSets}x${ex.actualReps} @ ${ex.actualWeight}kg` : `${ex.actualDuration}s @ ${ex.actualWeight}kg`}
                            </Text>
                        </View>
                    </View>
                </View>
             ))}

             <TouchableOpacity style={styles.finishBtn} onPress={handleFinishSession} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.finishBtnText}>✅ Finish Workout Session</Text>}
             </TouchableOpacity>

             <TouchableOpacity style={styles.backToWorkoutBtn} onPress={() => setCurrentIndex(exercises.length - 1)}>
                 <Text style={styles.backToWorkoutText}>← Wait, let me edit the last exercise</Text>
             </TouchableOpacity>

             <View style={{height: 50}}/>
         </ScrollView>
      );
  }

  // Active Carousel Rendering Engine
  const activeEx = exercises[currentIndex];

  return (
    <View style={styles.carouselContainer}>
        <View style={styles.progressHeader}>
           <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
               <Text style={styles.progressText}>Exercise {currentIndex + 1} of {exercises.length}</Text>
               <TouchableOpacity onPress={handleCancelSession} style={styles.abortBtn}>
                   <Text style={styles.abortBtnText}>✕ Cancel</Text>
               </TouchableOpacity>
           </View>
           <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${((currentIndex) / exercises.length) * 100}%` }]} />
           </View>
        </View>

        <ScrollView contentContainerStyle={{flexGrow: 1}} showsVerticalScrollIndicator={false}>
            <View style={styles.carouselCard}>
                <Text style={styles.activeRoutineTitle}>{routineTitle} - {dayName}</Text>
                <Text style={styles.activeExName}>{activeEx.exerciseName}</Text>
                
                <View style={styles.targetBlock}>
                   <Text style={styles.targetTitle}>🎯 Goal Target</Text>
                   <Text style={styles.targetMetrics}>
                       {activeEx.type === 'reps' 
                         ? `${activeEx.plannedSets} Sets × ${activeEx.plannedReps} Reps` 
                         : `${activeEx.plannedDuration} Seconds`}
                   </Text>
                   <Text style={styles.targetWeight}>Weight Setup: {activeEx.plannedWeight}kg</Text>
                </View>

                <Text style={styles.logLabel}>Log your actual outputs:</Text>

                <View style={styles.stepperGrid}>
                    {activeEx.type === 'reps' ? (
                        <View style={{flexDirection: 'row', gap: 15}}>
                            <NumberStepper label="Sets Completed" value={activeEx.actualSets} onChange={(val) => updateActual('actualSets', val)} />
                            <NumberStepper label="Reps Achieved" value={activeEx.actualReps} onChange={(val) => updateActual('actualReps', val)} />
                        </View>
                    ) : (
                        <NumberStepper label="Total Duration (Sec)" value={activeEx.actualDuration} onChange={(val) => updateActual('actualDuration', val)} />
                    )}
                    <View style={{height: 15}}/>
                    <NumberStepper label="Actual Weight (kg)" value={activeEx.actualWeight} onChange={(val) => updateActual('actualWeight', val)} />
                </View>
            </View>

            <View style={styles.bottomControls}>
               <TouchableOpacity 
                  style={[styles.secondaryBtn, currentIndex === 0 && { opacity: 0.3 }]} 
                  disabled={currentIndex === 0} 
                  onPress={() => setCurrentIndex(prev => prev - 1)}
               >
                   <Text style={styles.navBtnText}>Prev</Text>
               </TouchableOpacity>

               <TouchableOpacity 
                  style={styles.skipBtn} 
                  onPress={handleSkipExercise}
               >
                   <Text style={styles.skipBtnText}>Skip</Text>
               </TouchableOpacity>

               <TouchableOpacity 
                  style={styles.primaryBtn} 
                  onPress={() => setCurrentIndex(prev => prev + 1)}
               >
                   <Text style={styles.doneBtnText}>Next</Text>
               </TouchableOpacity>
            </View>
        </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f3f5' },
  carouselContainer: { flex: 1, backgroundColor: '#f0f3f5', padding: 16, paddingTop: 40 },
  
  progressHeader: { paddingHorizontal: 20, paddingBottom: 20 },
  progressText: { fontSize: 13, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 },
  abortBtn: { paddingBottom: 5 },
  abortBtnText: { fontSize: 13, fontWeight: '800', color: '#ef4444' },
  progressBar: { height: 6, backgroundColor: '#e5e7eb', borderRadius: 5, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#10b981' },

  carouselCard: { backgroundColor: '#ffffff', marginHorizontal: 20, padding: 25, borderRadius: 20, shadowColor: '#000', shadowOffset: { width:0, height:6 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 6 },
  activeRoutineTitle: { fontSize: 13, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', marginBottom: 5 },
  activeExName: { fontSize: 32, fontWeight: '900', color: '#1f2937', marginBottom: 20 },

  targetBlock: { backgroundColor: '#f0fdf4', padding: 20, borderRadius: 14, borderWidth: 1, borderColor: '#bbf7d0', marginBottom: 25 },
  targetTitle: { fontSize: 13, fontWeight: '800', color: '#166534', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  targetMetrics: { fontSize: 24, fontWeight: '800', color: '#15803d' },
  targetWeight: { fontSize: 15, fontWeight: '600', color: '#16a34a', marginTop: 5 },

  logLabel: { fontSize: 16, fontWeight: '800', color: '#374151', marginBottom: 15 },
  stepperGrid: { width: '100%' },

  stepperContainer: { flex: 1, backgroundColor: '#f9fafb', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  stepperControl: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  stepBtn: { backgroundColor: '#eef2ff', width: 45, height: 45, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  stepBtnText: { fontSize: 24, fontWeight: '800', color: '#4A60E6' },
  stepInput: { fontSize: 22, fontWeight: '800', color: '#374151', textAlign: 'center', minWidth: 60, padding: 0, margin: 0 },
  subLabel: { fontSize: 12, fontWeight: '800', color: '#6b7280', textTransform: 'uppercase' },

  bottomControls: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginTop: 20, paddingHorizontal: 20, paddingBottom: 40 },
  secondaryBtn: { flex: 1, padding: 12, backgroundColor: '#e5e7eb', borderRadius: 10, alignItems: 'center' },
  navBtnText: { fontSize: 16, fontWeight: '800', color: '#4b5563' },
  
  skipBtn: { flex: 1, padding: 12, backgroundColor: '#fee2e2', borderRadius: 10, alignItems: 'center' },
  skipBtnText: { fontSize: 16, fontWeight: '800', color: '#ef4444' },
  
  primaryBtn: { flex: 1, padding: 12, backgroundColor: '#10b981', borderRadius: 10, alignItems: 'center' },
  doneBtnText: { fontSize: 16, fontWeight: '900', color: '#ffffff' },

  summaryTitle: { fontSize: 32, fontWeight: '900', color: '#1f2937', marginBottom: 10, marginTop: 40, textAlign: 'center' },
  summarySubtitle: { fontSize: 15, color: '#6b7280', textAlign: 'center', marginBottom: 30, fontWeight: '600' },
  summaryCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2, borderWidth: 1, borderColor: '#f3f4f6' },
  summaryExName: { fontSize: 18, fontWeight: '800', color: '#1f2937', marginBottom: 12 },
  summaryGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryCol: { flex: 1 },
  summaryLabel: { fontSize: 11, fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase', marginBottom: 4 },
  summaryStat: { fontSize: 14, fontWeight: '700', color: '#4b5563' },
  summaryStatActual: { fontSize: 14, fontWeight: '800', color: '#10b981' },

  finishBtn: { backgroundColor: '#10b981', padding: 20, borderRadius: 14, alignItems: 'center', marginTop: 20, shadowColor: '#10b981', shadowOffset: { width:0, height:5 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 6 },
  finishBtnText: { color: 'white', fontWeight: '900', fontSize: 18, letterSpacing: 1 },
  backToWorkoutBtn: { marginTop: 20, alignItems: 'center' },
  backToWorkoutText: { fontSize: 14, fontWeight: '700', color: '#6b7280' }
});
