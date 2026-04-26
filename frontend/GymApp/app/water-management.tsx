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
import { Droplet, Plus, Trash2, Edit2, Trophy, Target } from 'lucide-react-native';

interface WaterEntry {
  _id: string;
  amount: number;
}

export default function WaterManagementScreen() {
  const { user } = useContext(AuthContext);
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const [totalWater, setTotalWater] = useState(0);
  const [waterGoal, setWaterGoal] = useState(3000); // default if not set
  const [isWaterGoalMet, setIsWaterGoalMet] = useState(false);
  const [waterEntries, setWaterEntries] = useState<WaterEntry[]>([]);

  const [customAmount, setCustomAmount] = useState('');

  // Modals state
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingEntry, setEditingEntry] = useState<WaterEntry | null>(null);
  const [editingAmount, setEditingAmount] = useState('');

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
        setTotalWater(data.totalWater || 0);
        setWaterGoal(data.waterGoal || 3000);
        setIsWaterGoalMet(data.isWaterGoalMet || false);
        setWaterEntries(data.waterEntries || []);
      }
    } catch (error) {
      console.error('Failed to fetch status:', error);
      Alert.alert('Error', 'Failed to fetch daily intake data.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddWater = async (amountToAdd: number) => {
    if (!amountToAdd || amountToAdd <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount greater than 0.');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(API_ENDPOINTS.INTAKE_ADD_WATER, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user!.id, date: today, amount: amountToAdd }),
      });

      if (response.ok) {
        setCustomAmount('');
        fetchDailyStatus();
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.message || 'Failed to add water');
        setLoading(false);
      }
    } catch (error) {
      console.error('Failed to add water:', error);
      setLoading(false);
    }
  };

  const handleUpdateWater = async () => {
    const amount = parseInt(editingAmount);
    if (!amount || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(API_ENDPOINTS.INTAKE_UPDATE_WATER, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user!.id,
          date: today,
          entryId: editingEntry!._id,
          amount
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

  const handleDeleteWater = async (entryId: string) => {
    Alert.alert('Delete Entry', 'Are you sure you want to remove this entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setLoading(true);
            const response = await fetch(API_ENDPOINTS.INTAKE_DELETE_WATER, {
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

  const handleUpdateGoal = async () => {
    const goal = parseInt(newGoalAmount);
    if (!goal || goal <= 0) {
      Alert.alert('Invalid Goal', 'Please enter a valid goal amount.');
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
          waterGoal: goal
          // Not sending calorieGoal so it doesn't get overwritten, wait, backend expects both? 
          // The backend uses $set: { waterGoal, calorieGoal }. If calorieGoal isn't passed, it might set to null!
          // We need to fetch the current calorieGoal or avoid changing it. Let's do a patch.
        }),
      });
      // But based on controller, the updateGoals endpoint expects both. So wait, I shouldn't overwrite calorieGoal! Let's pass current goal.
      // We don't have calorieGoal in this screen. Let's make an API call to get DailyStatus first if we override, but we already have daily status.
      // Wait, intakeController: `{$set: {waterGoal, calorieGoal}}`. If one is missing, it sets to undefined in mongo. Let's modify the body to only pass the water goal.
      // Wait, I am not supposed to change the backend. I should fetch first and grab the existing calorieGoal. Or just rely on the controller handling it?
    } catch (error) {
      console.log(error);
    }
  };

  const handleGoalUpdateWithCurrentCalories = async () => {
    const goal = parseInt(newGoalAmount);
    if (!goal || goal <= 0) return Alert.alert('Invalid', 'Enter a valid amount');

    try {
      setLoading(true);
      // Fetch latest daily log to get current calorieGoal safely before update
      const statusRes = await fetch(API_ENDPOINTS.INTAKE_STATUS(user!.id, today));
      const statusData = await statusRes.json();
      const currentCalorieGoal = statusData.calorieGoal || 2000;

      const response = await fetch(API_ENDPOINTS.INTAKE_UPDATE_GOALS, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user!.id,
          date: today,
          waterGoal: goal,
          calorieGoal: currentCalorieGoal
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
    const progressPerc = Math.min(100, Math.max(0, (totalWater / waterGoal) * 100));

    return (
      <View style={styles.progressContainer}>
        {/* Simple Bottle/Bar representation */}
        <View style={styles.bottleContainer}>
          <View style={styles.bottleFillContainer}>
            <View style={[styles.bottleFill, { height: `${progressPerc}%` }]} />
          </View>
        </View>

        <View style={styles.progressTextContainer}>
          <Text style={styles.progressValue}>{totalWater} / {waterGoal} ml</Text>
          <Text style={styles.progressPercentage}>{progressPerc.toFixed(1)}%</Text>
        </View>

        <TouchableOpacity
          style={styles.changeGoalBtn}
          onPress={() => {
            setNewGoalAmount(waterGoal.toString());
            setIsGoalModalVisible(true);
          }}
        >
          <Target size={16} color="#007AFF" />
          <Text style={styles.changeGoalText}>Change Target</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderWaterEntry = ({ item }: { item: WaterEntry }) => (
    <View style={styles.entryRow}>
      <Droplet size={24} color="#007AFF" />
      <View style={styles.entryInfo}>
        <Text style={styles.entryTitle}>Glass of water</Text>
        <Text style={styles.entryAmount}>{item.amount} ml</Text>
      </View>
      <View style={styles.entryActions}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => {
            setEditingEntry(item);
            setEditingAmount(item.amount.toString());
            setIsEditModalVisible(true);
          }}
        >
          <Edit2 size={20} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => handleDeleteWater(item._id)}
        >
          <Trash2 size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading && !totalWater && waterEntries.length === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#007AFF" />
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
        data={waterEntries.slice().reverse()} // show newest first
        keyExtractor={(item) => item._id}
        ListHeaderComponent={(
          <>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Water</Text>
              <Text style={styles.headerTitle}>Management</Text>
            </View>

            {isWaterGoalMet && (
              <View style={styles.goalMetBanner}>
                <Trophy size={24} color="#F59E0B" style={styles.goalIcon} />
                <Text style={styles.goalMetText}>Daily Water Goal Reached! Great job!</Text>
              </View>
            )}

            {renderProgress()}

            {/* Quick Add Section */}
            <View style={styles.addSection}>
              <Text style={styles.sectionTitle}>Add Water</Text>
              <View style={styles.quickAddRow}>
                <TouchableOpacity
                  style={styles.quickAddBtn}
                  onPress={() => handleAddWater(250)}
                  disabled={loading}
                >
                  <Droplet size={20} color="#fff" />
                  <Text style={styles.quickAddBtnText}>+ 250ml</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.quickAddBtn}
                  onPress={() => handleAddWater(500)}
                  disabled={loading}
                >
                  <Droplet size={20} color="#fff" />
                  <Text style={styles.quickAddBtnText}>+ 500ml</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.customAddRow}>
                <TextInput
                  style={styles.customInput}
                  placeholder="Custom amount (ml)"
                  keyboardType="numeric"
                  value={customAmount}
                  onChangeText={setCustomAmount}
                />
                <TouchableOpacity
                  style={styles.customAddBtn}
                  onPress={() => handleAddWater(parseInt(customAmount || '0'))}
                  disabled={loading}
                >
                  <Plus size={20} color="#fff" />
                  <Text style={styles.customAddBtnText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Today's Log</Text>
          </>
        )}
        renderItem={renderWaterEntry}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={(
          <Text style={styles.emptyText}>No water logged today. Let's hydrate!</Text>
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
            <Text style={styles.modalTitle}>Edit Amount</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              value={editingAmount}
              onChangeText={setEditingAmount}
              autoFocus
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
                onPress={handleUpdateWater}
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
            <Text style={styles.modalTitle}>Set New Target (ml)</Text>
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
                onPress={handleGoalUpdateWithCurrentCalories}
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
  goalMetBanner: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  goalIcon: {
    marginRight: 10,
  },
  goalMetText: {
    flex: 1,
    color: '#D97706',
    fontWeight: 'bold',
    fontSize: 16,
  },
  progressContainer: {
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 24,
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
  bottleContainer: {
    width: 100,
    height: 180,
    borderWidth: 4,
    borderColor: '#E5E7EB',
    borderRadius: 50,
    padding: 4,
    backgroundColor: '#F9FAFB',
    marginBottom: 16,
  },
  bottleFillContainer: {
    flex: 1,
    borderRadius: 42,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  bottleFill: {
    backgroundColor: '#3B82F6',
    width: '100%',
  },
  progressTextContainer: {
    alignItems: 'center',
  },
  progressValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  progressPercentage: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  changeGoalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 8,
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
  quickAddRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  quickAddBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#3B82F6',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  quickAddBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  customAddRow: {
    flexDirection: 'row',
  },
  customInput: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
    marginBottom: 16,
    color: '#111827',
  },
  modalInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
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
    backgroundColor: '#3B82F6',
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
