import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { AuthContext } from '@/context/AuthContext';
import { API_BASE_URL, API_ENDPOINTS } from '@/constants/api';

const SERVER_URL = API_BASE_URL; 
const WORKOUTS_API = API_ENDPOINTS.WORKOUTS;

export default function AIResultScreen() {
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const { planData } = useLocalSearchParams();
  const [result, setResult] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (planData) {
      try {
        const payload = Array.isArray(planData) ? planData[0] : planData;
        const parsed = JSON.parse(payload);
        setResult(parsed);
      } catch (err) {
        console.error("Failed to parse plan payload", err);
      }
    }
  }, [planData]);

  if (!result) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#6200EE" />
      </View>
    );
  }

  const { recommendation, imageUrl, userProfileConfigured } = result;

  const handleAddToWorkouts = async () => {
    try {
      setSaving(true);
      
      // Default to 1 array with 'AI Exercises' if the recommendation formatting is weird 
      // or map correctly over the ai generated strings securely.
      const exercisesList = (recommendation?.exercises?.length > 0) ? recommendation.exercises : ['Generated AI Exercise Routine'];

      const parsedExercises = exercisesList.map((str: any) => ({
        exerciseName: typeof str === 'string' ? str : 'Coach AI Routine',
        type: 'reps',
        sets: 3, // Safe beginner default parsing map
        reps: 10,
        duration: 0,
        durationUnit: 'seconds'
      }));

      const payload = {
        userId: user?.id || user?._id || 'testUser123',
        title: `AI Plan - ${recommendation?.title || 'Custom AI Builder'}`,
        goal: userProfileConfigured?.fitnessGoal || 'Muscle Gain',
        locationType: userProfileConfigured?.workoutLocation || 'Gym',
        notes: `Generated from AI recommendation.\nSets Logic: ${recommendation?.setsAndReps || 'N/A'}\nCoach Notes: ${recommendation?.notes || 'N/A'}`,
        exercises: parsedExercises
      };

      const res = await fetch(WORKOUTS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok || res.status === 201) {
        Alert.alert('Success', 'AI generated workout successfully saved to your routines!', [
          { text: 'Go to Workouts', onPress: () => router.push('/workouts') }
        ]);
      } else {
        const errData = await res.json();
        Alert.alert('Error', errData.message || 'Failed saving plan to DB.');
      }
    } catch (e: any) {
      Alert.alert('Network Error', e.message);
    } finally {
        setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>{"< Go Back"}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Your Custom Plan</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.profileBox}>
          {imageUrl && (
            <Image 
              source={{ uri: `${SERVER_URL}${imageUrl}` }} 
              style={styles.profileImg} 
            />
          )}
          <View style={styles.profileTextInfo}>
             <Text style={styles.profileSubHead}>Target: {userProfileConfigured?.targetArea}</Text>
             <Text style={styles.profileStats}>Ht: {userProfileConfigured?.height}cm | Wt: {userProfileConfigured?.weight}kg</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <Text style={styles.planTitle}>{recommendation?.title}</Text>
        <Text style={styles.freqBadge}>🗓️ {recommendation?.daysPerWeek} Days Per Week</Text>

        <Text style={styles.sectionHeader}>Prescribed Routine:</Text>
        <View style={styles.exercisesBox}>
            {recommendation?.exercises?.map((exercise: any, index: number) => (
               <Text key={index} style={styles.exerciseItem}>• {exercise}</Text>
            ))}
        </View>

        <Text style={styles.sectionHeader}>Sets and Reps Configuration</Text>
        <Text style={styles.infoText}>{recommendation?.setsAndReps}</Text>

        <Text style={styles.sectionHeader}>Coach's Notes</Text>
        <Text style={styles.notesText}>{recommendation?.notes}</Text>
      </View>

      <TouchableOpacity style={styles.addToWorkoutsBtn} onPress={handleAddToWorkouts} disabled={saving}>
        {saving ? <ActivityIndicator color="white" /> : <Text style={styles.addToWorkoutsText}>➕ Add to My Workouts</Text>}
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.saveActionBtn} onPress={() => router.push('/user-home')}>
        <Text style={styles.saveActionText}>Return to Dashboard</Text>
      </TouchableOpacity>

      <View style={{height: 60}} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f3f5', padding: 20, paddingTop: 40 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backBtn: { paddingRight: 15 },
  backBtnText: { fontSize: 16, color: '#6200EE', fontWeight: 'bold' },
  title: { fontSize: 26, fontWeight: '800', color: '#1f2937' },
  card: { backgroundColor: 'white', padding: 20, borderRadius: 16, marginBottom: 25, shadowColor: '#000', shadowOffset: { width:0, height:2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 3 },
  
  profileBox: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  profileImg: { width: 70, height: 95, borderRadius: 12, marginRight: 15, backgroundColor: '#ddd' },
  profileTextInfo: { flex: 1 },
  profileSubHead: { fontSize: 17, fontWeight: '800', color: '#333' },
  profileStats: { fontSize: 14, color: '#666', marginTop: 4, fontWeight: '600' },
  
  divider: { height: 1, backgroundColor: '#e5e7eb', marginVertical: 18 },

  planTitle: { fontSize: 22, fontWeight: '800', color: '#6200EE', marginBottom: 10 },
  freqBadge: { fontSize: 14, fontWeight: '800', color: '#fff', backgroundColor: '#10b981', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12, alignSelf: 'flex-start', marginBottom: 22 },

  sectionHeader: { fontSize: 17, fontWeight: '800', color: '#374151', marginBottom: 10, marginTop: 10 },
  exercisesBox: { backgroundColor: '#f9fafb', padding: 18, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  exerciseItem: { fontSize: 16, color: '#4b5563', marginBottom: 6, fontWeight: '500' },
  
  infoText: { fontSize: 15, color: '#4A60E6', backgroundColor: '#eef2ff', padding: 12, borderRadius: 8, overflow: 'hidden', fontWeight: '600', marginBottom: 5 }, 
  notesText: { fontSize: 15, color: '#92400e', fontStyle: 'italic', padding: 12, backgroundColor: '#fef3c7', borderRadius: 8, marginTop: 5, fontWeight: '500' },

  addToWorkoutsBtn: { backgroundColor: '#10b981', padding: 18, borderRadius: 12, alignItems: 'center', marginBottom: 12, shadowColor: '#10b981', shadowOffset: { width:0, height:4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 5 },
  addToWorkoutsText: { color: 'white', fontWeight: '800', fontSize: 16, textTransform: 'uppercase' },

  saveActionBtn: { backgroundColor: '#4b5563', padding: 18, borderRadius: 12, alignItems: 'center', marginBottom: 30 },
  saveActionText: { color: 'white', fontWeight: '800', fontSize: 16 }
});
