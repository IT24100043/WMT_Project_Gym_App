import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { AuthContext } from '@/context/AuthContext';
import { API_ENDPOINTS } from '@/constants/api';

const WORKOUTS_API = API_ENDPOINTS.WORKOUTS;
const SESSIONS_API = API_ENDPOINTS.SESSION_FINISH;

export default function RoutineViewScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [loggingRest, setLoggingRest] = useState(false);
  const [routine, setRoutine] = useState<any>(null);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  useEffect(() => {
    if (id) fetchRoutine();
  }, [id]);

  const fetchRoutine = async () => {
    try {
      const res = await fetch(`${WORKOUTS_API}/${id}?userId=${user?.id || user?._id || 'testUser123'}`);
      const data = await res.json();
      if (res.ok) {
        setRoutine(data.workout);
      } else {
        Alert.alert('Error', data.message || 'Failed to fetch routine');
        router.back();
      }
    } catch (error: any) {
      Alert.alert('Network Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRestDay = async (dayName: string) => {
    try {
      setLoggingRest(true);
      const payload = {
        userId: user?.id || user?._id || 'testUser123',
        workoutId: id,
        dayName,
        sessionType: 'rest',
        exercises: []
      };

      const res = await fetch(SESSIONS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        Alert.alert('Rest day logged ✅', `Excellent choice! Recovery track mapped natively to maintain algorithms safely.`);
      } else {
        const data = await res.json();
        Alert.alert('Error', data.message || 'Failed to log rest day.');
      }
    } catch (error: any) {
       Alert.alert('Network Error', error.message);
    } finally {
      setLoggingRest(false);
    }
  };

  if (loading || !routine) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>{"← Back"}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Routine Overview</Text>
      </View>

      <View style={styles.infoCard}>
         <Text style={styles.routineTitle}>{routine.title}</Text>
         <View style={{flexDirection: 'row', gap: 10, marginTop: 8}}>
            <View style={styles.badge}><Text style={styles.badgeText}>{routine.goal}</Text></View>
            <View style={styles.badge}><Text style={styles.badgeText}>{routine.locationType}</Text></View>
         </View>
         {routine.notes ? <Text style={styles.notesText}>{routine.notes}</Text> : null}
      </View>

      <Text style={styles.sectionHeader}>📅 Execution Plan</Text>

      {routine.days.map((day: any) => (
         <View key={day.dayName} style={styles.dayCard}>
            <TouchableOpacity style={styles.dayHeader} onPress={() => setExpandedDay(expandedDay === day.dayName ? null : day.dayName)}>
               <View>
                 <Text style={styles.dayTitle}>{day.dayName}</Text>
                 <Text style={styles.daySubtitle}>{day.dayType === 'workout' ? (day.focus || 'Workout Day') : 'Rest Day'}</Text>
               </View>
               <Text style={styles.arrow}>{expandedDay === day.dayName ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {expandedDay === day.dayName && (
               <View style={styles.dayBody}>
                   {day.notes ? <Text style={styles.dayNotes}>📝 Note: {day.notes}</Text> : null}

                   {day.dayType === 'workout' ? (
                       <View>
                           <Text style={styles.metricsLabel}>{day.exercises.length} Mapped Exercises</Text>
                           <TouchableOpacity 
                               style={styles.startSessionBtn} 
                               onPress={() => router.push(`/workouts/session?workoutId=${id}&dayName=${day.dayName}`)}
                           >
                               <Text style={styles.startSessionBtnText}>▶ START SESSION</Text>
                           </TouchableOpacity>
                       </View>
                   ) : (
                       <View style={styles.restContainer}>
                           <Text style={styles.restText}>Recovery is part of progress. Log your rest natively to preserve your weekly streaks cleanly.</Text>
                           <TouchableOpacity 
                               style={styles.markRestBtn} 
                               onPress={() => handleMarkRestDay(day.dayName)}
                               disabled={loggingRest}
                           >
                               {loggingRest ? <ActivityIndicator color="#4A60E6" /> : <Text style={styles.markRestBtnText}>🧘‍♂️ Mark Rest Day Active</Text>}
                           </TouchableOpacity>
                       </View>
                   )}
               </View>
            )}
         </View>
      ))}
      <View style={{height: 50}}/>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f3f5', padding: 18, paddingTop: 40 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  backBtn: { paddingRight: 15 },
  backBtnText: { fontSize: 16, color: '#10b981', fontWeight: 'bold' },
  title: { fontSize: 28, fontWeight: '800', color: '#1f2937' },

  infoCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width:0, height:2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  routineTitle: { fontSize: 24, fontWeight: '800', color: '#1f2937' },
  badge: { backgroundColor: '#eef2ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignSelf: 'flex-start' },
  badgeText: { fontSize: 13, color: '#4A60E6', fontWeight: '700' },
  notesText: { marginTop: 15, fontSize: 15, color: '#4b5563', fontStyle: 'italic' },

  sectionHeader: { fontSize: 20, fontWeight: '800', color: '#1f2937', marginBottom: 15 },

  dayCard: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 12, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width:0, height:2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  dayHeader: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff' },
  dayTitle: { fontSize: 18, fontWeight: '800', color: '#1f2937' },
  daySubtitle: { fontSize: 14, fontWeight: '600', color: '#6b7280', marginTop: 2 },
  arrow: { fontSize: 14, color: '#9ca3af' },
  dayBody: { padding: 16, borderTopWidth: 1, borderTopColor: '#f3f4f6', backgroundColor: '#f9fafb' },
  dayNotes: { fontSize: 14, color: '#4b5563', marginBottom: 15 },

  metricsLabel: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 15, textAlign: 'center' },
  
  startSessionBtn: { backgroundColor: '#10b981', paddingVertical: 18, borderRadius: 12, alignItems: 'center', shadowColor: '#10b981', shadowOffset: { width:0, height:4 }, shadowOpacity: 0.4, shadowRadius: 5, elevation: 4 },
  startSessionBtnText: { color: 'white', fontWeight: '900', fontSize: 16, letterSpacing: 1.2 },

  restContainer: { alignItems: 'center', paddingTop: 5 },
  restText: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 20, fontStyle: 'italic', paddingHorizontal: 10 },
  markRestBtn: { backgroundColor: '#eef2ff', borderWidth: 1, borderColor: '#c7d2fe', paddingVertical: 15, paddingHorizontal: 25, borderRadius: 12, width: '100%', alignItems: 'center' },
  markRestBtnText: { color: '#4A60E6', fontWeight: '800', fontSize: 15 }
});
