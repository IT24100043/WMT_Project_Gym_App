import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { AuthContext } from '@/context/AuthContext';
import { API_ENDPOINTS } from '@/constants/api';
import { useCallback } from 'react';
import HamburgerMenu from '@/components/HamburgerMenu';

const API_URL = API_ENDPOINTS.WORKOUTS;

export default function WorkoutListScreen() {
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const handleProfilePress = () => {
    router.back();
  };

  useFocusEffect(
    useCallback(() => {
      fetchWorkouts();
    }, [])
  );

  const fetchWorkouts = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/user/${user?.id || user?._id || 'testUser123'}`);
      const data = await res.json();

      if (res.ok) {
        setWorkouts(data.workouts);
      } else {
        Alert.alert('Error', data.message || 'Failed to fetch workouts');
      }
    } catch (error: any) {
      Alert.alert('Network Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
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
              body: JSON.stringify({ userId: user?.id || user?._id || 'testUser123' })
            });
            const data = await res.json();
            if (res.ok) {
              setWorkouts((prev) => prev.filter((w) => w._id !== id));
            } else {
              Alert.alert('Error', data.message);
            }
          } catch (error: any) {
            Alert.alert('Error', error.message);
          }
        }
      }
    ]);
  };

  const handleActivate = async (id: string) => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await fetch(API_ENDPOINTS.WORKOUT_ACTIVATE(id), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id || user?._id || 'testUser123' })
      });

      if (res.ok) {
        fetchWorkouts();
      } else {
        const data = await res.json();
        Alert.alert('Error', data.message || 'Failed to activate routine');
        setLoading(false);
      }
    } catch (error: any) {
      Alert.alert('Network Error', error.message);
      setLoading(false);
    }
  };

  const renderWorkout = ({ item, index }: { item: any, index: number }) => {
    // Summarize the 7-day construct intelligently natively
    const workoutDays = item.days?.filter((d: any) => d.dayType === 'workout').length || 0;
    const restDays = item.days?.filter((d: any) => d.dayType === 'rest').length || 0;

    return (
      <View testID={`workout-card-${index}`} style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <View style={styles.badgeContainer}>
            {item.isActive && (
              <View style={[styles.badge, styles.activeBadge]}>
                <Text style={[styles.badgeText, styles.activeBadgeText]}>ACTIVE</Text>
              </View>
            )}
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.locationType}</Text>
            </View>
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
          {!item.isActive && (
            <TouchableOpacity style={[styles.editBtn, styles.setActiveBtn]} onPress={() => handleActivate(item._id)}>
              <Text style={[styles.btnText, { color: '#fff' }]}>✨ Set Active</Text>
            </TouchableOpacity>
          )}
          <View style={styles.secondaryActionRow}>
            <TouchableOpacity style={[styles.editBtn, styles.viewBtn]} onPress={() => router.push(`/workouts/view?id=${item._id}`)}>
              <Text style={[styles.btnText, { color: '#fff' }]}>👁️‍🗨️ View Routine</Text>
            </TouchableOpacity>

            <TouchableOpacity testID={`workout-edit-btn-${index}`} style={styles.editBtn} onPress={() => router.push(`/workouts/edit?id=${item._id}`)}>
              <Text style={styles.btnText}>✏️ Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity testID={`workout-delete-btn-${index}`} style={styles.deleteBtn} onPress={() => handleDelete(item._id)}>
              <Text style={styles.btnText}>🗑️</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <HamburgerMenu
        pageType="user"
        onProfilePress={handleProfilePress}
      />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text testID="workout-list-title" style={styles.pageTitle}>Manage Workouts</Text>

        </View>

        {!loading && (
          <TouchableOpacity testID="workout-list-add-btn" style={styles.addButton} onPress={() => router.push('/workouts/add')}>
            <Text style={styles.addBtnText}>+ Add New Routine</Text>
          </TouchableOpacity>
        )}

        {loading ? (
          <ActivityIndicator size="large" color="#4A60E6" style={{ marginTop: 50 }} />
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  header: { paddingHorizontal: 20, paddingVertical: 15, paddingTop: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 25 },
  pageTitle: { fontSize: 36, fontWeight: 'bold', color: '#333', textAlign: 'center' },

  addButton: { backgroundColor: '#4A60E6', padding: 16, borderRadius: 14, alignItems: 'center', marginBottom: 25, shadowColor: '#4A60E6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 },
  addBtnText: { color: 'white', fontWeight: '800', fontSize: 16, letterSpacing: 0.5 },

  emptyBox: { alignItems: 'center', marginTop: 80, paddingHorizontal: 20 },
  emptyIcon: { fontSize: 45, marginBottom: 15 },
  emptyText: { textAlign: 'center', fontSize: 16, color: '#6b7280', lineHeight: 24, fontWeight: '500' },

  replaceContext: { alignItems: 'center', marginBottom: 20 },
  helperText: { fontSize: 13, color: '#6b7280', fontStyle: 'italic', marginBottom: 10 },
  replaceButton: { backgroundColor: '#eef2ff', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10, borderWidth: 1, borderColor: '#c7d2fe' },
  replaceBtnText: { color: '#4A60E6', fontWeight: '800', fontSize: 13 },

  card: { backgroundColor: 'white', padding: 22, borderRadius: 16, marginBottom: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: '#f3f4f6' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  cardTitle: { fontSize: 20, fontWeight: '800', color: '#1f2937', flex: 1, marginRight: 10 },
  badgeContainer: { alignItems: 'flex-end' },
  badge: { backgroundColor: '#eef2ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 6 },
  badgeText: { fontSize: 12, color: '#4A60E6', fontWeight: '700', textTransform: 'uppercase' },
  activeBadge: { backgroundColor: '#d1fae5' },
  activeBadgeText: { color: '#059669' },

  detailsBlock: { backgroundColor: '#f9fafb', padding: 15, borderRadius: 12, marginBottom: 18 },
  cardDetail: { fontSize: 16, color: '#1f2937', marginBottom: 6, fontWeight: '700' },
  daySummaryBox: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
  workoutDayText: { fontSize: 14, fontWeight: '700', color: '#10b981' },
  restDayText: { fontSize: 14, fontWeight: '700', color: '#9ca3af' },

  actionRow: { flexDirection: 'column', paddingTop: 5 },
  secondaryActionRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' },
  editBtn: { backgroundColor: '#f3f4f6', paddingVertical: 10, paddingHorizontal: 18, borderRadius: 10, marginRight: 10, marginBottom: 10 },
  deleteBtn: { backgroundColor: '#fee2e2', paddingVertical: 10, paddingHorizontal: 18, borderRadius: 10, marginBottom: 10 },
  btnText: { color: '#374151', fontWeight: '700', fontSize: 14 },
  setActiveBtn: { backgroundColor: '#4f46e5', width: '100%', alignItems: 'center', marginRight: 0 },
  viewBtn: { backgroundColor: '#10b981' }
});
