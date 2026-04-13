import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { AuthContext } from '@/context/AuthContext';

const API_URL = 'http://192.168.1.25:5000/api/workouts';

const PillSelector = ({ options, selected, onSelect }) => (
  <View style={styles.pillContainer}>
    {options.map(opt => (
      <TouchableOpacity 
        key={opt}
        style={[styles.pillBtn, selected === opt && styles.pillBtnActive]}
        onPress={() => onSelect(opt)}
      >
        <Text style={[styles.pillText, selected === opt && styles.pillTextActive]}>{opt}</Text>
      </TouchableOpacity>
    ))}
  </View>
);

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

export default function EditWorkoutScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useContext(AuthContext);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [goal, setGoal] = useState('Muscle Gain');
  const [locationType, setLocationType] = useState('Gym');
  const [notes, setNotes] = useState('');

  const [days, setDays] = useState([]);
  const [expandedDay, setExpandedDay] = useState(null);

  useEffect(() => {
    if (id) fetchWorkoutData();
  }, [id]);

  const fetchWorkoutData = async () => {
    try {
      const res = await fetch(`${API_URL}/${id}?userId=${user?.id || user?._id || 'testUser123'}`);
      const data = await res.json();
      
      if (res.ok) {
        setTitle(data.workout.title);
        setGoal(data.workout.goal);
        setLocationType(data.workout.locationType);
        setNotes(data.workout.notes || '');

        if (data.workout.days && Array.isArray(data.workout.days)) {
             setDays(data.workout.days.map(d => ({
                 dayName: d.dayName,
                 dayType: d.dayType,
                 focus: d.focus || '',
                 notes: d.notes || '',
                 exercises: d.exercises.map(ex => ({
                     ...ex,
                     id: ex._id || Date.now().toString() + Math.random(),
                     sets: ex.sets ? ex.sets.toString() : '0',
                     reps: ex.reps ? ex.reps.toString() : '0',
                     duration: ex.duration ? ex.duration.toString() : '0',
                     durationUnit: ex.durationUnit || 'seconds',
                     defaultWeight: ex.defaultWeight ? ex.defaultWeight.toString() : '0'
                 }))
             })));
        }
      } else {
        Alert.alert('Error', data.message || 'Failed to fetch routine');
        router.back();
      }
    } catch (error) {
      Alert.alert('Network Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateDay = (dayName, field, value) => {
    setDays(days.map(d => {
        if (d.dayName === dayName) {
            const updated = { ...d, [field]: value };
            if (field === 'dayType' && value === 'rest') updated.exercises = [];
            if (field === 'dayType' && value === 'workout' && updated.exercises.length === 0) {
                 updated.exercises = [{ id: Date.now().toString(), exerciseName: '', type: 'reps', sets: '0', reps: '0', duration: '0', durationUnit: 'seconds', defaultWeight: '0' }];
            }
            return updated;
        }
        return d;
    }));
  };

  const addExercise = (dayName) => {
    setDays(days.map(d => {
        if (d.dayName === dayName) {
            return {
                ...d, 
                exercises: [...d.exercises, { id: Date.now().toString() + Math.random(), exerciseName: '', type: 'reps', sets: '0', reps: '0', duration: '0', durationUnit: 'seconds', defaultWeight: '0' }]
            };
        }
        return d;
    }));
  };

  const removeExercise = (dayName, exId) => {
    setDays(days.map(d => {
        if (d.dayName === dayName) {
            if (d.exercises.length === 1) {
                Alert.alert('Warning', 'A workout day must have at least one exercise!');
                return d;
            }
            return { ...d, exercises: d.exercises.filter(ex => ex.id !== exId) };
        }
        return d;
    }));
  };

  const updateExercise = (dayName, exId, field, value) => {
    setDays(days.map(d => {
        if (d.dayName === dayName) {
             return {
                 ...d,
                 exercises: d.exercises.map(ex => ex.id === exId ? { ...ex, [field]: value } : ex)
             };
        }
        return d;
    }));
  };

  const handleUpdate = async () => {
    if (!title) {
        Alert.alert('Error', 'Please provide a routine title');
        return;
    }

    let err = null;
    days.forEach(d => {
        if (d.dayType === 'workout') {
            d.exercises.forEach(ex => {
                if (!ex.exerciseName) err = `Missing exercise name on ${d.dayName}`;
                if (ex.type === 'reps' && (parseInt(ex.sets) === 0 || parseInt(ex.reps) === 0)) err = `Sets/Reps required for ${ex.exerciseName} on ${d.dayName}`;
                if (ex.type === 'time' && parseInt(ex.duration) === 0) err = `Duration required for ${ex.exerciseName} on ${d.dayName}`;
            });
        }
    });

    if (err) {
        Alert.alert('Error', err);
        return;
    }

    const payloadDays = days.map(d => ({
        dayName: d.dayName,
        dayType: d.dayType,
        focus: d.focus,
        notes: d.notes,
        exercises: d.exercises.map(ex => ({
            exerciseName: ex.exerciseName,
            type: ex.type,
            sets: isNaN(parseInt(ex.sets)) ? 0 : parseInt(ex.sets),
            reps: isNaN(parseInt(ex.reps)) ? 0 : parseInt(ex.reps),
            duration: isNaN(parseInt(ex.duration)) ? 0 : parseInt(ex.duration),
            durationUnit: ex.durationUnit,
            defaultWeight: isNaN(parseInt(ex.defaultWeight)) ? 0 : parseInt(ex.defaultWeight)
        }))
    }));

    try {
      setSaving(true);
      const payload = {
        userId: user?.id || user?._id || 'testUser123',
        title,
        goal,
        locationType,
        notes,
        days: payloadDays
      };

      const res = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        Alert.alert('Success', 'Weekly Routine updated flawlessly!', [{ text: 'OK', onPress: () => router.back() }]);
      } else {
        Alert.alert('Error', data.message || 'Failed to update workflow');
      }
    } catch (error) {
      Alert.alert('Network Error', error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#4A60E6" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>{"← Back"}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Edit Weekly Routine</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardHeader}>📋 Edit Base Data</Text>
        <Text style={styles.label}>Routine Title *</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} />

        <Text style={styles.label}>Primary Goal</Text>
        <PillSelector options={['Muscle Gain', 'Weight Loss', 'Maintenance', 'Endurance']} selected={goal} onSelect={setGoal} />

        <Text style={styles.label}>Location Scope</Text>
        <PillSelector options={['Gym', 'Home', 'Outdoor']} selected={locationType} onSelect={setLocationType} />
        
        <Text style={styles.label}>General Notes</Text>
        <TextInput style={[styles.input, { height: 75, textAlignVertical: 'top' }]} multiline value={notes} onChangeText={setNotes} />
      </View>

      <Text style={styles.sectionHeader}>📅 Modulate Calendar</Text>
      
      {days.map((day) => (
        <View key={day.dayName} style={styles.dayCard}>
           <TouchableOpacity style={styles.dayHeader} onPress={() => setExpandedDay(expandedDay === day.dayName ? null : day.dayName)}>
              <Text style={styles.dayTitle}>{day.dayName}</Text>
              <Text style={styles.dayBadge}>{day.dayType === 'workout' ? '🏃‍♂️ Workout' : '🛋️ Rest'}</Text>
           </TouchableOpacity>

           {expandedDay === day.dayName && (
              <View style={styles.dayBody}>
                 <Text style={styles.subLabel}>Day Allocation</Text>
                 <PillSelector 
                    options={['workout', 'rest']} 
                    selected={day.dayType} 
                    onSelect={(val) => updateDay(day.dayName, 'dayType', val)} 
                 />

                 {day.dayType === 'workout' && (
                    <View>
                        <Text style={styles.subLabel}>Focus (e.g. Chest & Triceps)</Text>
                        <TextInput style={styles.input} value={day.focus} onChangeText={(val) => updateDay(day.dayName, 'focus', val)} />
                        
                        <Text style={styles.subLabel}>Coach's Notes for {day.dayName}</Text>
                        <TextInput style={[styles.input, { height: 60 }]} value={day.notes} onChangeText={(val) => updateDay(day.dayName, 'notes', val)} />

                        {day.exercises.map((ex, idx) => (
                            <View key={ex.id} style={styles.exerciseCard}>
                                <View style={styles.exerciseHeader}>
                                    <Text style={styles.exerciseIndex}>Exercise {idx + 1}</Text>
                                    <TouchableOpacity onPress={() => removeExercise(day.dayName, ex.id)}>
                                        <Text style={styles.removeText}>✖ Remove</Text>
                                    </TouchableOpacity>
                                </View>

                                <TextInput 
                                    style={styles.input} 
                                    placeholder="Exercise Name (e.g. Bench Press)" 
                                    value={ex.exerciseName} 
                                    onChangeText={(val) => updateExercise(day.dayName, ex.id, 'exerciseName', val)} 
                                />

                                <Text style={styles.subLabel}>Methodology</Text>
                                <PillSelector 
                                    options={['reps', 'time']} 
                                    selected={ex.type} 
                                    onSelect={(val) => updateExercise(day.dayName, ex.id, 'type', val)} 
                                />

                                {ex.type === 'reps' ? (
                                    <View style={styles.row}>
                                        <NumberStepper label="Sets" value={ex.sets} onChange={(val) => updateExercise(day.dayName, ex.id, 'sets', val)} />
                                        <View style={{ width: 10 }} />
                                        <NumberStepper label="Reps" value={ex.reps} onChange={(val) => updateExercise(day.dayName, ex.id, 'reps', val)} />
                                    </View>
                                ) : (
                                    <View>
                                        <NumberStepper label="Duration" value={ex.duration} onChange={(val) => updateExercise(day.dayName, ex.id, 'duration', val)} />
                                        <View style={{ height: 10 }} />
                                        <Text style={styles.subLabel}>Duration Unit</Text>
                                        <PillSelector 
                                            options={['seconds', 'minutes']} 
                                            selected={ex.durationUnit || 'seconds'} 
                                            onSelect={(val) => updateExercise(day.dayName, ex.id, 'durationUnit', val)} 
                                        />
                                    </View>
                                )}

                                <View style={{ height: 10 }} />
                                <NumberStepper label="Default Weight (kg)" value={ex.defaultWeight} onChange={(val) => updateExercise(day.dayName, ex.id, 'defaultWeight', val)} />
                            </View>
                        ))}

                        <TouchableOpacity style={styles.addExerciseBtn} onPress={() => addExercise(day.dayName)}>
                            <Text style={styles.addExerciseBtnText}>+ Attach Exercise</Text>
                        </TouchableOpacity>

                        {/* Execution mapping migrated cleanly to view.tsx */}
                    </View>
                 )}
                 {day.dayType === 'rest' && (
                     <Text style={styles.restText}>Enjoy your day off. Active recovery is highly recommended.</Text>
                 )}
              </View>
           )}
        </View>
      ))}

      <TouchableOpacity style={styles.saveBtn} onPress={handleUpdate} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Architecture Changes</Text>}
      </TouchableOpacity>

      <View style={{height: 60}}/>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f3f5', padding: 18, paddingTop: 40 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  backBtn: { paddingRight: 15 },
  backBtnText: { fontSize: 16, color: '#4A60E6', fontWeight: 'bold' },
  title: { fontSize: 26, fontWeight: '800', color: '#1f2937' },
  
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 16, marginBottom: 25, shadowColor: '#000', shadowOffset: { width:0, height:3 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3 },
  cardHeader: { fontSize: 18, fontWeight: '700', color: '#1f2937', marginBottom: 15 },
  sectionHeader: { fontSize: 20, fontWeight: '800', color: '#1f2937', marginBottom: 15, marginTop: 5 },
  
  label: { fontSize: 14, fontWeight: '600', color: '#4b5563', marginBottom: 6 },
  subLabel: { fontSize: 13, fontWeight: '600', color: '#6b7280', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 14, fontSize: 16, marginBottom: 15, backgroundColor: '#f9fafb', color: '#1f2937' },
  row: { flexDirection: 'row' },
  
  dayCard: { backgroundColor: '#fff', borderRadius: 14, marginBottom: 15, overflow: 'hidden', borderWidth: 1, borderColor: '#e5e7eb' },
  dayHeader: { padding: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9fafb' },
  dayTitle: { fontSize: 18, fontWeight: '700', color: '#1f2937' },
  dayBadge: { fontSize: 14, fontWeight: '700', color: '#4A60E6', backgroundColor: '#eef2ff', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 15 },
  dayBody: { padding: 18, borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  restText: { fontStyle: 'italic', color: '#6b7280', marginTop: 10 },

  pillContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 15 },
  pillBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e7eb' },
  pillBtnActive: { backgroundColor: '#4A60E6', borderColor: '#4A60E6' },
  pillText: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  pillTextActive: { color: '#ffffff' },

  exerciseCard: { backgroundColor: '#ffffff', padding: 15, borderRadius: 14, marginBottom: 15, borderWidth: 1, borderColor: '#f3f4f6', shadowColor: '#000', shadowOffset: { width:0, height:2 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  exerciseHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  exerciseIndex: { fontSize: 15, fontWeight: '700', color: '#374151' },
  removeText: { fontSize: 13, fontWeight: '700', color: '#ef4444' },

  stepperContainer: { flex: 1, backgroundColor: '#f9fafb', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb' },
  stepperControl: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  stepBtn: { backgroundColor: '#eef2ff', width: 35, height: 35, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  stepBtnText: { fontSize: 20, fontWeight: '800', color: '#4A60E6' },
  stepInput: { fontSize: 18, fontWeight: '700', color: '#374151', textAlign: 'center', minWidth: 40, padding: 0, margin: 0 },

  addExerciseBtn: { backgroundColor: '#eef2ff', padding: 15, borderRadius: 12, alignItems: 'center', marginBottom: 15, borderWidth: 1, borderColor: '#e0e7ff', borderStyle: 'dashed' },
  addExerciseBtnText: { color: '#4A60E6', fontWeight: 'bold', fontSize: 16 },

  sessionDivider: { marginTop: 25, paddingTop: 20, borderTopWidth: 2, borderTopColor: '#e5e7eb', alignItems: 'center' },
  sessionHintText: { fontSize: 13, fontWeight: '700', color: '#6b7280', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  startSessionBtn: { backgroundColor: '#10b981', paddingVertical: 16, paddingHorizontal: 30, borderRadius: 30, width: '100%', alignItems: 'center', shadowColor: '#10b981', shadowOffset: { width:0, height:4 }, shadowOpacity: 0.4, shadowRadius: 6, elevation: 5 },
  startSessionBtnText: { color: '#ffffff', fontWeight: '900', fontSize: 16, letterSpacing: 1.5 },

  saveBtn: { backgroundColor: '#f59e0b', padding: 18, borderRadius: 12, alignItems: 'center', marginVertical: 20, shadowColor: '#f59e0b', shadowOffset: { width:0, height:4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 5 },
  saveBtnText: { color: 'white', fontWeight: '800', fontSize: 17, textTransform: 'uppercase', letterSpacing: 1 }
});
