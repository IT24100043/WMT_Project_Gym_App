import React, { useState, useEffect, useContext } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import HamburgerMenu from '@/components/HamburgerMenu';
import { AuthContext } from '@/context/AuthContext';
import { API_ENDPOINTS } from '@/constants/api';
import { Apple, Plus, Trash2, Edit2, AlertTriangle, Target } from 'lucide-react-native';

interface FoodEntry {
  _id: string;
  foodName: string;
  calories: number;
}

export default function CalorieManagementScreen() {
  const { user } = useContext(AuthContext);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  const [totalCalories, setTotalCalories] = useState(0);
  const [calorieGoal, setCalorieGoal] = useState(2500); // default if not set
  const [caloriesRemaining, setCaloriesRemaining] = useState(2500);
  const [isCalorieOver, setIsCalorieOver] = useState(false);
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([]);
  
  // Need this to preserve it when updating goals
  const [currentWaterGoal, setCurrentWaterGoal] = useState(3000); 
  
  const [foodNameInput, setFoodNameInput] = useState('');
  const [foodCalorieInput, setFoodCalorieInput] = useState('');
  
  // Modals state
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingEntry, setEditingEntry] = useState<FoodEntry | null>(null);
  const [editFoodName, setEditFoodName] = useState('');
  const [editFoodCalories, setEditFoodCalories] = useState('');
  
  const [isGoalModalVisible, setIsGoalModalVisible] = useState(false);
  const [newGoalAmount, setNewGoalAmount] = useState('');

  const today = new Date().toISOString().split('T')[0];

  const handleProfilePress = () => {
    router.back();
  };

  useEffect(() => {
    if (user?.id) {
      fetchDailyStatus();
    }
  }, [user]);

  const fetchDailyStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_ENDPOINTS.INTAKE_STATUS(user!.id, today));
      const data = await response.json();
      
      if (response.ok) {
        setTotalCalories(data.totalCalories || 0);
        setCalorieGoal(data.calorieGoal || 2500);
        setCaloriesRemaining(data.caloriesRemaining || Math.max(0, 2500 - (data.totalCalories || 0)));
        setIsCalorieOver(data.isCalorieOver || false);
        setFoodEntries(data.foodEntries || []);
        setCurrentWaterGoal(data.waterGoal || 3000);
      }
    } catch (error) {
      console.error('Failed to fetch status:', error);
      Alert.alert('Error', 'Failed to fetch daily intake data.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFood = async () => {
    const calories = parseInt(foodCalorieInput);
    
    if (!foodNameInput.trim()) {
      Alert.alert('Invalid Input', 'Please enter a food name.');
      return;
    }
    
    if (!calories || calories <= 0) {
      Alert.alert('Invalid Calories', 'Please enter a valid calorie amount greater than 0.');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(API_ENDPOINTS.INTAKE_ADD_FOOD, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: user!.id, 
          date: today, 
          foodName: foodNameInput.trim(),
          calories: calories
        }),
      });
      
      if (response.ok) {
        setFoodNameInput('');
        setFoodCalorieInput('');
        fetchDailyStatus();
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.message || 'Failed to add food');
        setLoading(false);
      }
    } catch (error) {
      console.error('Failed to add food:', error);
      setLoading(false);
    }
  };

  const handleUpdateFood = async () => {
    const calories = parseInt(editFoodCalories);
    
    if (!editFoodName.trim()) {
      Alert.alert('Invalid Input', 'Please enter a food name.');
      return;
    }
    
    if (!calories || calories <= 0) {
      Alert.alert('Invalid Calories', 'Please enter a valid calorie amount.');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(API_ENDPOINTS.INTAKE_UPDATE_FOOD, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: user!.id, 
          date: today, 
          entryId: editingEntry!._id, 
          foodName: editFoodName.trim(),
          calories: calories 
        }),
      });

      if (response.ok) {
        setIsEditModalVisible(false);
        fetchDailyStatus();
      } else {
        setLoading(false);
        Alert.alert('Error', 'Failed to update entry');
      }
    } catch (error) {
      setLoading(false);
      console.error('Update failed:', error);
    }
  };

  const handleDeleteFood = async (entryId: string) => {
    Alert.alert('Delete Entry', 'Are you sure you want to remove this meal?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive',
        onPress: async () => {
          try {
            setLoading(true);
            const response = await fetch(API_ENDPOINTS.INTAKE_DELETE_FOOD, {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: user!.id, date: today, entryId }),
            });
            if (response.ok) {
              fetchDailyStatus();
            } else {
              setLoading(false);
              Alert.alert('Error', 'Failed to delete entry');
            }
          } catch (error) {
            setLoading(false);
            console.error('Delete failed:', error);
          }
        }
      }
    ]);
  };

  const handleGoalUpdate = async () => {
    const goal = parseInt(newGoalAmount);
    if (!goal || goal <= 0) {
      Alert.alert('Invalid', 'Enter a valid amount');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(API_ENDPOINTS.INTAKE_UPDATE_GOALS, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: user!.id, 
          date: today, 
          calorieGoal: goal,
          waterGoal: currentWaterGoal // Pass water goal back so it's not lost
        }),
      });
      
      if (response.ok) {
        setIsGoalModalVisible(false);
        fetchDailyStatus();
      } else {
        setLoading(false);
        Alert.alert('Error', 'Failed to update target');
      }
    } catch (error) {
      setLoading(false);
      console.error(error);
    }
  };

  const renderProgress = () => {
    const progressPerc = Math.min(100, Math.max(0, (totalCalories / calorieGoal) * 100));
    
    // Color varies based on whether limit is reached
    const progressColor = isCalorieOver ? '#EF4444' : '#10B981'; 
    
    return (
      <View style={styles.summaryCard}>
        <View style={styles.summaryStatsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Goal</Text>
            <Text style={styles.statValue}>{calorieGoal}</Text>
          </View>
          
          <View style={[styles.statBox, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#E5E7EB' }]}>
            <Text style={styles.statLabel}>Consumed</Text>
            <Text style={[styles.statValue, { color: progressColor }]}>{totalCalories}</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Remaining</Text>
            <Text style={[styles.statValue, isCalorieOver && { color: '#EF4444' }]}>
              {isCalorieOver ? 0 : caloriesRemaining}
            </Text>
          </View>
        </View>

        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBarFill, { width: `${progressPerc}%`, backgroundColor: progressColor }]} />
        </View>

        <TouchableOpacity 
          style={styles.changeGoalBtn}
          onPress={() => {
            setNewGoalAmount(calorieGoal.toString());
            setIsGoalModalVisible(true);
          }}
        >
          <Target size={16} color="#007AFF" />
          <Text style={styles.changeGoalText}>Change Target</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderFoodEntry = ({ item }: { item: FoodEntry }) => (
    <View style={styles.entryRow}>
      <Apple size={24} color="#10B981" />
      <View style={styles.entryInfo}>
        <Text style={styles.entryTitle}>{item.foodName}</Text>
        <Text style={styles.entryAmount}>{item.calories} kcal</Text>
      </View>
      <View style={styles.entryActions}>
        <TouchableOpacity 
          style={styles.iconBtn}
          onPress={() => {
            setEditingEntry(item);
            setEditFoodName(item.foodName);
            setEditFoodCalories(item.calories.toString());
            setIsEditModalVisible(true);
          }}
        >
          <Edit2 size={20} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.iconBtn}
          onPress={() => handleDeleteFood(item._id)}
        >
          <Trash2 size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading && !totalCalories && foodEntries.length === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <HamburgerMenu
        pageType="user"
        onProfilePress={handleProfilePress}
      />
      <FlatList
        data={foodEntries.slice().reverse()} // show newest first
        keyExtractor={(item) => item._id}
        ListHeaderComponent={(
          <>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Calorie Management</Text>
            </View>

            {isCalorieOver && (
              <View style={styles.warningBanner}>
                <AlertTriangle size={24} color="#DC2626" style={styles.warningIcon} />
                <View style={styles.warningTextContainer}>
                  <Text style={styles.warningTitle}>Calorie Goal Exceeded!</Text>
                  <Text style={styles.warningDesc}>You have passed your daily target.</Text>
                </View>
              </View>
            )}

            {renderProgress()}

            {/* Add Food Section */}
            <View style={styles.addSection}>
              <Text style={styles.sectionTitle}>Add a Meal</Text>
              
              <TextInput
                style={styles.inputField}
                placeholder="Food Name (e.g., Chicken Salad)"
                value={foodNameInput}
                onChangeText={setFoodNameInput}
              />
              
              <View style={styles.customAddRow}>
                <TextInput
                  style={[styles.inputField, { flex: 1, marginBottom: 0, marginRight: 12 }]}
                  placeholder="Calories (e.g., 350)"
                  keyboardType="numeric"
                  value={foodCalorieInput}
                  onChangeText={setFoodCalorieInput}
                />
                
                <TouchableOpacity 
                  style={styles.customAddBtn}
                  onPress={handleAddFood}
                  disabled={loading}
                >
                  <Plus size={20} color="#fff" />
                  <Text style={styles.customAddBtnText}>Add Food</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Today's Logs</Text>
          </>
        )}
        renderItem={renderFoodEntry}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={(
          <Text style={styles.emptyText}>No food logged today. Time to eat!</Text>
        )}
      />

      {/* Edit Entry Modal */}
      <Modal
        visible={isEditModalVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Meal</Text>
            
            <Text style={styles.inputLabel}>Food Name</Text>
            <TextInput
              style={styles.modalInput}
              value={editFoodName}
              onChangeText={setEditFoodName}
            />
            
            <Text style={styles.inputLabel}>Calories</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              value={editFoodCalories}
              onChangeText={setEditFoodCalories}
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalBtnCancel} 
                onPress={() => setIsEditModalVisible(false)}
              >
                <Text style={styles.modalBtnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalBtnSave} 
                onPress={handleUpdateFood}
              >
                <Text style={styles.modalBtnSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Goal Modal */}
      <Modal
        visible={isGoalModalVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Set Daily Calorie Limit</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              value={newGoalAmount}
              onChangeText={setNewGoalAmount}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalBtnCancel} 
                onPress={() => setIsGoalModalVisible(false)}
              >
                <Text style={styles.modalBtnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalBtnSave} 
                onPress={handleGoalUpdate}
              >
                <Text style={styles.modalBtnSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  warningBanner: {
    flexDirection: 'row',
    backgroundColor: '#FEF2F2',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  warningIcon: {
    marginRight: 10,
  },
  warningTextContainer: {
    flex: 1,
  },
  warningTitle: {
    color: '#B91C1C',
    fontWeight: 'bold',
    fontSize: 16,
  },
  warningDesc: {
    color: '#DC2626',
    fontSize: 14,
    marginTop: 2,
  },
  summaryCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    overflow: 'hidden',
    alignSelf: 'stretch',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 10,
  },
  changeGoalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  changeGoalText: {
    color: '#007AFF',
    fontWeight: '600',
    marginLeft: 6,
  },
  addSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  inputField: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  customAddRow: {
    flexDirection: 'row',
  },
  customAddBtn: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customAddBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 6,
  },
  entryRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  entryInfo: {
    flex: 1,
    marginLeft: 16,
  },
  entryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  entryAmount: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  entryActions: {
    flexDirection: 'row',
  },
  iconBtn: {
    padding: 8,
    marginLeft: 4,
  },
  emptyText: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 16,
    marginTop: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    width: '85%',
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#111827',
  },
  inputLabel: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 6,
    fontWeight: '500',
  },
  modalInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  modalBtnCancel: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 10,
  },
  modalBtnCancelText: {
    color: '#6B7280',
    fontWeight: '600',
    fontSize: 16,
  },
  modalBtnSave: {
    backgroundColor: '#10B981', // green for save to match apple
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  modalBtnSaveText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
