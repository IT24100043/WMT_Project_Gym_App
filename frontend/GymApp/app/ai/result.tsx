import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

// Our backend sends back a local static path like "/uploads/...", our RN app needs the absolute path
const SERVER_URL = 'http://localhost:5000'; 

export default function AIResultScreen() {
  const router = useRouter();
  const { planData } = useLocalSearchParams();
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (planData) {
      try {
        const parsed = JSON.parse(planData);
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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>{"< Go Back"}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Your Custom Plan</Text>
      </View>

      <View style={styles.card}>
        
        {/* Profile Recap Area */}
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

        {/* AI Recommendation Engine Data */}
        <Text style={styles.planTitle}>{recommendation?.title}</Text>
        <Text style={styles.freqBadge}>🗓️ {recommendation?.daysPerWeek} Days Per Week</Text>

        <Text style={styles.sectionHeader}>Prescribed Routine:</Text>
        <View style={styles.exercisesBox}>
            {recommendation?.exercises?.map((exercise, index) => (
               <Text key={index} style={styles.exerciseItem}>• {exercise}</Text>
            ))}
        </View>

        <Text style={styles.sectionHeader}>Sets and Reps Configuration</Text>
        <Text style={styles.infoText}>{recommendation?.setsAndReps}</Text>

        <Text style={styles.sectionHeader}>Coach's Notes</Text>
        <Text style={styles.notesText}>{recommendation?.notes}</Text>

      </View>

      <TouchableOpacity style={styles.saveActionBtn} onPress={() => router.push('/user-home')}>
        <Text style={styles.saveActionText}>Finish & Return to Dashboard</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20, paddingTop: 40 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backBtn: { paddingRight: 15 },
  backBtnText: { fontSize: 16, color: '#6200EE', fontWeight: 'bold' },
  title: { fontSize: 26, fontWeight: 'bold', color: '#333' },
  card: { backgroundColor: 'white', padding: 20, borderRadius: 12, marginBottom: 30, shadowColor: '#000', shadowOffset: { width:0, height:2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  
  profileBox: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  profileImg: { width: 60, height: 80, borderRadius: 8, marginRight: 15, backgroundColor: '#ddd' },
  profileTextInfo: { flex: 1 },
  profileSubHead: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  profileStats: { fontSize: 14, color: '#666', marginTop: 4 },
  
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 15 },

  planTitle: { fontSize: 22, fontWeight: 'bold', color: '#6200EE', marginBottom: 8 },
  freqBadge: { fontSize: 14, fontWeight: 'bold', color: '#fff', backgroundColor: '#34c759', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12, alignSelf: 'flex-start', marginBottom: 20 },

  sectionHeader: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 8, marginTop: 10 },
  exercisesBox: { backgroundColor: '#f9f9f9', padding: 15, borderRadius: 8, marginBottom: 10 },
  exerciseItem: { fontSize: 15, color: '#444', marginBottom: 4 },
  
  infoText: { fontSize: 15, color: '#555', backgroundColor: '#f0f4ff', padding: 10, borderRadius: 6, overflow: 'hidden' }, // overflow hidden applies bg color properly around text safely
  notesText: { fontSize: 15, color: '#666', fontStyle: 'italic', padding: 10, backgroundColor: '#fff9e6', borderRadius: 6, marginTop: 5 },

  saveActionBtn: { backgroundColor: '#333', padding: 15, borderRadius: 8, alignItems: 'center', marginBottom: 50 },
  saveActionText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});
