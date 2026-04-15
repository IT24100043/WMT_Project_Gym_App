import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { AuthContext } from '@/context/AuthContext';
import { API_ENDPOINTS } from '@/constants/api';
import { useCallback } from 'react';

const API_URL = API_ENDPOINTS.WORKOUTS;

export default function WorkoutListScreen() {
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchWorkouts();
    }, [])
  );

  const fetchWorkouts = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/user/${user.id || user._id || 'testUser123'}`);
      const data = await res.json();
      
      if (res.ok) {
        setWorkouts(data.workouts);
      } else {
        Alert.alert('Error', data.message || 'Failed to fetch workouts');
      }
    } catch (error) {
      Alert.alert('Network Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Blueprint', 'Are you sure you want to permanently delete this weekly routine?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await fetch(`${API_URL}/${id}`, {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: user.id || user._id || 'testUser123' })
            });
            const data = await res.json();
            if (res.ok) {
              setWorkouts((prev) => prev.filter((w) => w._id !== id));
            } else {
              Alert.alert('Error', data.message);
            }
          } catch (error) {
            Alert.alert('Error', error.message);
          }
        }
      }
    ]);
  };

  const renderWorkout = ({ item, index }) => {
    // Summarize the 7-day construct intelligently natively
    const workoutDays = item.days?.filter(d => d.dayType === 'workout').length || 0;
    const restDays = item.days?.filter(d => d.dayType === 'rest').length || 0;

    return (
      <View testID={`workout-card-${index}`} style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <View style={styles.badge}>
             <Text style={styles.badgeText}>{item.locationType}</Text>
          </View>
        </View>
        
        <View style={styles.detailsBlock}>
            <Text style={styles.cardDetail}>🎯 {item.goal}</Text>
            <View style={styles.daySummaryBox}>
                <Text style={styles.workoutDayText}>🏃‍♂️ {workoutDays} Workout Days</Text>
                <Text style={styles.restDayText}>🛋️ {restDays} Rest Days</Text>
            </View>
        </View>
        
        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.editBtn, { backgroundColor: '#10b981', marginRight: 10 }]} onPress={() => router.push(`/workouts/view?id=${item._id}`)}>
            <Text style={[styles.btnText, {color: '#fff'}]}>👁️‍🗨️ View Routine</Text>
          </TouchableOpacity>
          
          <TouchableOpacity testID={`workout-edit-btn-${index}`} style={styles.editBtn} onPress={() => router.push(`/workouts/edit?id=${item._id}`)}>
            <Text style={styles.btnText}>✏️ Edit</Text>
          </TouchableOpacity>
          
          <TouchableOpacity testID={`workout-delete-btn-${index}`} style={styles.deleteBtn} onPress={() => handleDelete(item._id)}>
            <Text style={styles.btnText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>{"← Dashboard"}</Text>
        </TouchableOpacity>
        <Text testID="workout-list-title" style={styles.title}>Weekly Routines</Text>
      </View>

      {workouts.length === 0 && !loading && (
          <TouchableOpacity testID="workout-list-add-btn" style={styles.addButton} onPress={() => router.push('/workouts/add')}>
            <Text style={styles.addBtnText}>+ Draft New Routine</Text>
          </TouchableOpacity>
      )}

      {workouts.length > 0 && !loading && (
        <View style={styles.replaceContext}>
            <Text style={styles.helperText}>Creating a new routine will make it the active routine.</Text>
            <TouchableOpacity testID="workout-list-add-btn" style={styles.replaceButton} onPress={() => router.push('/workouts/add')}>
               <Text style={styles.replaceBtnText}>+ Replace Active Routine</Text>
            </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#4A60E6" style={{ marginTop: 50 }}/>
      ) : workouts.length === 0 ? (
        <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyText}>No weekly routines crafted yet. Master your week by designing one today!</Text>
        </View>
      ) : (
        <FlatList
          testID="workout-list"
          data={workouts}
          keyExtractor={(item) => item._id}
          renderItem={renderWorkout}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f3f5', padding: 20, paddingTop: 40 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  backBtn: { paddingRight: 15 },
  backBtnText: { fontSize: 16, color: '#4A60E6', fontWeight: 'bold' },
  title: { fontSize: 28, fontWeight: '800', color: '#1f2937' },
  
  addButton: { backgroundColor: '#4A60E6', padding: 16, borderRadius: 14, alignItems: 'center', marginBottom: 25, shadowColor: '#4A60E6', shadowOffset: { width:0, height:4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 },
  addBtnText: { color: 'white', fontWeight: '800', fontSize: 16, letterSpacing: 0.5 },
  
  emptyBox: { alignItems: 'center', marginTop: 80, paddingHorizontal: 20 },
  emptyIcon: { fontSize: 45, marginBottom: 15 },
  emptyText: { textAlign: 'center', fontSize: 16, color: '#6b7280', lineHeight: 24, fontWeight: '500' },
  
  replaceContext: { alignItems: 'center', marginBottom: 20 },
  helperText: { fontSize: 13, color: '#6b7280', fontStyle: 'italic', marginBottom: 10 },
  replaceButton: { backgroundColor: '#eef2ff', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10, borderWidth: 1, borderColor: '#c7d2fe' },
  replaceBtnText: { color: '#4A60E6', fontWeight: '800', fontSize: 13 },
  
  card: { backgroundColor: 'white', padding: 22, borderRadius: 16, marginBottom: 18, shadowColor: '#000', shadowOffset: { width:0, height:4 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: '#f3f4f6' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  cardTitle: { fontSize: 20, fontWeight: '800', color: '#1f2937', flex: 1 },
  badge: { backgroundColor: '#eef2ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  badgeText: { fontSize: 12, color: '#4A60E6', fontWeight: '700', textTransform: 'uppercase' },
  
  detailsBlock: { backgroundColor: '#f9fafb', padding: 15, borderRadius: 12, marginBottom: 18 },
  cardDetail: { fontSize: 16, color: '#1f2937', marginBottom: 6, fontWeight: '700' },
  daySummaryBox: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
  workoutDayText: { fontSize: 14, fontWeight: '700', color: '#10b981' },
  restDayText: { fontSize: 14, fontWeight: '700', color: '#9ca3af' },

  actionRow: { flexDirection: 'row', justifyContent: 'flex-end', paddingTop: 5 },
  editBtn: { backgroundColor: '#f3f4f6', paddingVertical: 10, paddingHorizontal: 18, borderRadius: 10, marginRight: 12 },
  deleteBtn: { backgroundColor: '#fee2e2', paddingVertical: 10, paddingHorizontal: 18, borderRadius: 10 },
  btnText: { color: '#374151', fontWeight: '700', fontSize: 14 }
});
