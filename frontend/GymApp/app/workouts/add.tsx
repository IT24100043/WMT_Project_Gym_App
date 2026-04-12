import React, { useState, useContext } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthContext } from '@/context/AuthContext';

const API_URL = 'http://localhost:5000/api/workouts';

export default function AddWorkoutScreen() {
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [workoutType, setWorkoutType] = useState('Strength');
  const [goal, setGoal] = useState('Muscle Gain');
  const [locationType, setLocationType] = useState('Gym');
  const [exerciseName, setExerciseName] = useState('');
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');

  const handleSave = async () => {
    // Basic validation
    if (!title || !exerciseName || !sets || !reps || !duration) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        userId: user?.id || user?._id || 'testUser123',
        title,
        workoutType,
        goal,
        locationType,
        exerciseName,
        sets: parseInt(sets),
        reps: parseInt(reps),
        duration: parseInt(duration),
        notes
      };

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok || res.status === 201) {
        Alert.alert('Success', 'Workout created successfully!', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        Alert.alert('Error', data.message || 'Failed to create workout');
      }
    } catch (error) {
      Alert.alert('Network Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>{"< Back"}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Add Workout</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Workout Title *</Text>
        <TextInput style={styles.input} placeholder="e.g. Evening Pull Day" value={title} onChangeText={setTitle} />

        <Text style={styles.label}>Workout Type *</Text>
        <TextInput style={styles.input} placeholder="e.g. Strength, Cardio" value={workoutType} onChangeText={setWorkoutType} />

        <Text style={styles.label}>Goal *</Text>
        <TextInput style={styles.input} placeholder="e.g. Muscle Gain, Weight Loss" value={goal} onChangeText={setGoal} />

        <Text style={styles.label}>Location Type *</Text>
        <TextInput style={styles.input} placeholder="e.g. Gym, Home" value={locationType} onChangeText={setLocationType} />

        <Text style={styles.label}>Primary Exercise Name *</Text>
        <TextInput style={styles.input} placeholder="e.g. Pull-ups, Squats" value={exerciseName} onChangeText={setExerciseName} />

        <View style={styles.row}>
          <View style={[styles.inputGroup, { marginRight: 10 }]}>
            <Text style={styles.label}>Sets *</Text>
            <TextInput style={styles.input} placeholder="3" keyboardType="numeric" value={sets} onChangeText={setSets} />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Reps *</Text>
            <TextInput style={styles.input} placeholder="10" keyboardType="numeric" value={reps} onChangeText={setReps} />
          </View>
        </View>

        <Text style={styles.label}>Duration (mins) *</Text>
        <TextInput style={styles.input} placeholder="e.g. 45" keyboardType="numeric" value={duration} onChangeText={setDuration} />

        <Text style={styles.label}>Notes</Text>
        <TextInput 
          style={[styles.input, styles.textArea]} 
          placeholder="Any specific focus?" 
          multiline 
          numberOfLines={3}
          value={notes} 
          onChangeText={setNotes} 
        />

        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator color="white" /> : <Text style={styles.saveBtnText}>Save Workout</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20, paddingTop: 40 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backBtn: { paddingRight: 15 },
  backBtnText: { fontSize: 16, color: '#007BFF', fontWeight: 'bold' },
  title: { fontSize: 26, fontWeight: 'bold', color: '#333' },
  card: { backgroundColor: 'white', padding: 20, borderRadius: 12, marginBottom: 40, shadowColor: '#000', shadowOffset: { width:0, height:2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  label: { fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 5 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 15, backgroundColor: '#fafafa' },
  row: { flexDirection: 'row' },
  inputGroup: { flex: 1 },
  textArea: { height: 80, textAlignVertical: 'top' },
  saveButton: { backgroundColor: '#34c759', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});
