import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { AuthContext } from '@/context/AuthContext';

const API_URL = 'http://192.168.1.5:5000/api/workouts';

export default function EditWorkoutScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams(); // captures ?id= from URL
  const { user } = useContext(AuthContext);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [workoutType, setWorkoutType] = useState('');
  const [goal, setGoal] = useState('');
  const [locationType, setLocationType] = useState('');
  const [exerciseName, setExerciseName] = useState('');
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');

  // Fetch Existing Workout Data
  useEffect(() => {
    if (id) fetchWorkoutData();
  }, [id]);

  const fetchWorkoutData = async () => {
    try {
      const res = await fetch(`${API_URL}/${id}?userId=${user?.id || user?._id || 'testUser123'}`);
      const data = await res.json();
      
      if (res.ok) {
        setTitle(data.workout.title);
        setWorkoutType(data.workout.workoutType);
        setGoal(data.workout.goal);
        setLocationType(data.workout.locationType);
        setExerciseName(data.workout.exerciseName);
        setSets(data.workout.sets.toString());
        setReps(data.workout.reps.toString());
        setDuration(data.workout.duration.toString());
        setNotes(data.workout.notes || '');
      } else {
        Alert.alert('Error', data.message || 'Failed to fetch workout');
        router.back();
      }
    } catch (error) {
      Alert.alert('Network Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!title || !exerciseName || !sets || !reps || !duration) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    try {
      setSaving(true);
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

      const res = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        Alert.alert('Success', 'Workout updated successfully!', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        Alert.alert('Error', data.message || 'Failed to update workout');
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
        <ActivityIndicator size="large" color="#007BFF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>{"< Back"}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Edit Workout</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Workout Title *</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} />

        <Text style={styles.label}>Workout Type *</Text>
        <TextInput style={styles.input} value={workoutType} onChangeText={setWorkoutType} />

        <Text style={styles.label}>Goal *</Text>
        <TextInput style={styles.input} value={goal} onChangeText={setGoal} />

        <Text style={styles.label}>Location Type *</Text>
        <TextInput style={styles.input} value={locationType} onChangeText={setLocationType} />

        <Text style={styles.label}>Primary Exercise Name *</Text>
        <TextInput style={styles.input} value={exerciseName} onChangeText={setExerciseName} />

        <View style={styles.row}>
          <View style={[styles.inputGroup, { marginRight: 10 }]}>
            <Text style={styles.label}>Sets *</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={sets} onChangeText={setSets} />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Reps *</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={reps} onChangeText={setReps} />
          </View>
        </View>

        <Text style={styles.label}>Duration (mins) *</Text>
        <TextInput style={styles.input} keyboardType="numeric" value={duration} onChangeText={setDuration} />

        <Text style={styles.label}>Notes</Text>
        <TextInput 
          style={[styles.input, styles.textArea]} 
          multiline numberOfLines={3}
          value={notes} onChangeText={setNotes} 
        />

        <TouchableOpacity style={styles.saveButton} onPress={handleUpdate} disabled={saving}>
          {saving ? <ActivityIndicator color="white" /> : <Text style={styles.saveBtnText}>Update Workout</Text>}
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
  saveButton: { backgroundColor: '#FFC107', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});
