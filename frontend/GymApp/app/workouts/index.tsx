import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { AuthContext } from '@/context/AuthContext';
import { useCallback } from 'react';

const API_URL = 'http://localhost:5000/api/workouts';

export default function WorkoutListScreen() {
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);

  // useFocusEffect automatically runs whenever this screen comes into focus
  // so if we add or edit, this list always refreshes when we come back!
  useFocusEffect(
    useCallback(() => {
      fetchWorkouts();
    }, [])
  );

  const fetchWorkouts = async () => {
    if (!user) return;
    try {
      setLoading(true);
      // Fetch user specific workouts
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
    Alert.alert('Delete Workout', 'Are you sure you want to delete this workout?', [
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
              // Easily remove it from the list without re-fetching everything
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

  const renderWorkout = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardType}>{item.workoutType}</Text>
      </View>
      <Text style={styles.cardDetail}>Goal: {item.goal}</Text>
      <Text style={styles.cardDetail}>{item.exerciseName} - {item.sets}x{item.reps}</Text>
      
      <View style={styles.actionRow}>
        <TouchableOpacity 
          style={styles.editBtn} 
          onPress={() => router.push(`/workouts/edit?id=${item._id}`)}>
          <Text style={styles.btnText}>Edit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.deleteBtn} 
          onPress={() => handleDelete(item._id)}>
          <Text style={styles.btnText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>{"< Back"}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>My Workouts</Text>
      </View>

      <TouchableOpacity style={styles.addButton} onPress={() => router.push('/workouts/add')}>
        <Text style={styles.addBtnText}>+ Add New Workout</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" style={{ marginTop: 50 }}/>
      ) : workouts.length === 0 ? (
        <Text style={styles.emptyText}>No workouts found. Create one!</Text>
      ) : (
        <FlatList
          data={workouts}
          keyExtractor={(item) => item._id}
          renderItem={renderWorkout}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20, paddingTop: 40 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backBtn: { paddingRight: 15 },
  backBtnText: { fontSize: 16, color: '#007BFF', fontWeight: 'bold' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333' },
  addButton: {
    backgroundColor: '#007BFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20
  },
  addBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  emptyText: { textAlign: 'center', fontSize: 16, color: '#666', marginTop: 50 },
  card: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000', shadowOffset: { width:0, height:2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 3
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  cardType: { fontSize: 14, color: '#007BFF', fontWeight: '600' },
  cardDetail: { fontSize: 14, color: '#666', marginBottom: 5 },
  actionRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 15 },
  editBtn: { backgroundColor: '#FFC107', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 6, marginRight: 10 },
  deleteBtn: { backgroundColor: '#FF3B30', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 6 },
  btnText: { color: 'white', fontWeight: 'bold' }
});
