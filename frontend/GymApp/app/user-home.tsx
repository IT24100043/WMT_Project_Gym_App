import React, { useContext, useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
  TextInput,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AuthContext } from '@/context/AuthContext';
import { API_ENDPOINTS } from '@/constants/api';

interface UserDetails {
  _id: string;
  name: string;
  userEmail: string;
  userContactNumber: string;
  dpUrl: string;
  age: number;
  userNICcardNumber: string;
  role?: string;
}

export default function UserHomeScreen() {
  const router = useRouter();
  const { user, logout } = useContext(AuthContext);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [contactModalVisible, setContactModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [contactForm, setContactForm] = useState({
    newContactNumber: '',
  });

  const [deleteForm, setDeleteForm] = useState({
    password: '',
  });

  // Fetch user details on mount
  useEffect(() => {
    fetchUserDetails();
  }, []);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      if (!user?.id) {
        Alert.alert('Error', 'User ID not found');
        return;
      }

      const response = await fetch(API_ENDPOINTS.USER_DETAILS(user.id));
      const data = await response.json();

      if (data.user) {
        setUserDetails(data.user);
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      Alert.alert('Error', 'Failed to load user details');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    try {
      if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
        Alert.alert('Error', 'All password fields are required');
        return;
      }

      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        Alert.alert('Error', 'New passwords do not match');
        return;
      }

      if (!user?.id) {
        Alert.alert('Error', 'User ID not found');
        return;
      }

      const response = await fetch(API_ENDPOINTS.USER_UPDATE_PASSWORD(user.id), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          oldPassword: passwordForm.oldPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setPasswordModalVisible(false);
        setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
        Alert.alert('Success', 'Password updated successfully');
      } else {
        Alert.alert('Error', data.message || 'Failed to update password');
      }
    } catch (error) {
      console.error('Error updating password:', error);
      Alert.alert('Error', 'Failed to update password');
    }
  };

  const handleUpdateContact = async () => {
    try {
      if (!contactForm.newContactNumber) {
        Alert.alert('Error', 'Contact number is required');
        return;
      }

      if (!user?.id) {
        Alert.alert('Error', 'User ID not found');
        return;
      }

      const response = await fetch(API_ENDPOINTS.USER_UPDATE_CONTACT(user.id), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newContactNumber: contactForm.newContactNumber }),
      });

      const data = await response.json();

      if (response.ok) {
        setUserDetails(data.user);
        setContactModalVisible(false);
        setContactForm({ newContactNumber: '' });
        Alert.alert('Success', 'Contact number updated successfully');
      } else {
        Alert.alert('Error', data.message || 'Failed to update contact number');
      }
    } catch (error) {
      console.error('Error updating contact:', error);
      Alert.alert('Error', 'Failed to update contact number');
    }
  };

  const handleDeleteUser = () => {
    Alert.alert(
      'Delete User Account',
      'This action cannot be undone. Are you sure you want to delete your account?',
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Delete',
          onPress: () => {
            setDeleteModalVisible(true);
          },
          style: 'destructive',
        },
      ]
    );
  };

  const performDelete = async () => {
    try {
      if (!deleteForm.password) {
        Alert.alert('Error', 'Password is required');
        return;
      }

      if (!user?.id) {
        Alert.alert('Error', 'User ID not found');
        return;
      }

      const response = await fetch(API_ENDPOINTS.USER_DELETE(user.id), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: deleteForm.password }),
      });

      const data = await response.json();

      if (response.ok) {
        setDeleteModalVisible(false);
        setDeleteForm({ password: '' });
        Alert.alert('Success', 'User account deleted successfully');
        await logout();
        router.replace('/login');
      } else {
        Alert.alert('Error', data.message || 'Failed to delete user account');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      Alert.alert('Error', 'Failed to delete user account');
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Logout',
        onPress: async () => {
          await logout();
          router.replace('/login');
        },
        style: 'destructive',
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header Section with Profile Picture */}
      <View style={styles.headerSection}>
        {userDetails?.dpUrl && (
          <Image
            source={{ uri: userDetails.dpUrl }}
            style={styles.topLogo}
          />
        )}
        <Text style={styles.greeting}>Hi {userDetails?.name}!</Text>
        <Text style={styles.subtitle}>Welcome to gym fitness</Text>
      </View>

      {/* Profile Info Card */}
      <View style={styles.profileCard}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Name</Text>
          <Text style={styles.detailValue}>{userDetails?.name}</Text>
        </View>
        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Email</Text>
          <Text style={styles.detailValue}>{userDetails?.userEmail}</Text>
        </View>
        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Contact Number</Text>
          <Text style={styles.detailValue}>{userDetails?.userContactNumber}</Text>
        </View>
        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Age</Text>
          <Text style={styles.detailValue}>{userDetails?.age}</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsSection}>
        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryAction]}
          onPress={() => setContactModalVisible(true)}
        >
          <Text style={styles.secondaryActionText}>📞 Update Contact</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryAction]}
          onPress={() => setPasswordModalVisible(true)}
        >
          <Text style={styles.secondaryActionText}>🔐 Change Password</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.dangerAction]}
          onPress={handleDeleteUser}
        >
          <Text style={styles.actionButtonText}>🗑️ Delete Account</Text>
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>

      <View style={styles.bottomSpacer} />

      {/* Update Contact Modal */}
      <Modal
        visible={contactModalVisible}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Contact Number</Text>

            <TextInput
              style={styles.input}
              value={contactForm.newContactNumber}
              onChangeText={(text) =>
                setContactForm({ newContactNumber: text })
              }
              placeholder="Enter new contact number"
              keyboardType="phone-pad"
            />

            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleUpdateContact}
              >
                <Text style={styles.buttonText}>Update</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setContactModalVisible(false);
                  setContactForm({ newContactNumber: '' });
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Update Password Modal */}
      <Modal
        visible={passwordModalVisible}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Password</Text>

            <TextInput
              style={styles.input}
              value={passwordForm.oldPassword}
              onChangeText={(text) =>
                setPasswordForm({ ...passwordForm, oldPassword: text })
              }
              placeholder="Enter current password"
              secureTextEntry
            />

            <TextInput
              style={styles.input}
              value={passwordForm.newPassword}
              onChangeText={(text) =>
                setPasswordForm({ ...passwordForm, newPassword: text })
              }
              placeholder="Enter new password"
              secureTextEntry
            />

            <TextInput
              style={styles.input}
              value={passwordForm.confirmPassword}
              onChangeText={(text) =>
                setPasswordForm({ ...passwordForm, confirmPassword: text })
              }
              placeholder="Confirm new password"
              secureTextEntry
            />

            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleUpdatePassword}
              >
                <Text style={styles.buttonText}>Update Password</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setPasswordModalVisible(false);
                  setPasswordForm({
                    oldPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                  });
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Account Modal */}
      <Modal
        visible={deleteModalVisible}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delete User Account</Text>
            <Text style={styles.modalDescription}>
              Enter your password to confirm account deletion:
            </Text>

            <TextInput
              style={styles.input}
              value={deleteForm.password}
              onChangeText={(text) =>
                setDeleteForm({ password: text })
              }
              placeholder="Enter your password"
              secureTextEntry
            />

            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={performDelete}
              >
                <Text style={styles.buttonText}>Delete Account</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setDeleteModalVisible(false);
                  setDeleteForm({ password: '' });
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerSection: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  profileCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
    marginLeft: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
  },
  actionsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  actionButton: {
    backgroundColor: 'white',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  secondaryAction: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    flex: 1,
    marginRight: 6,
  },
  dangerAction: {
    backgroundColor: '#FF3B30',
    width: '100%',
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'white',
  },
  secondaryActionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  logoutButton: {
    backgroundColor: 'white',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingVertical: 15,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  logoutButtonText: {
    color: '#333',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  topLogo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
    marginTop: 15,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 20,
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    lineHeight: 20,
  },
  bottomSpacer: {
    height: 20,
  },
});
