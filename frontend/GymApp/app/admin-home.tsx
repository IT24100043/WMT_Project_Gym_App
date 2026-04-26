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
import * as ImagePicker from 'expo-image-picker';
import { AuthContext } from '@/context/AuthContext';
import { API_ENDPOINTS } from '@/constants/api';
import HamburgerMenu from '@/components/HamburgerMenu';

interface AdminDetails {
  _id: string;
  adminName: string;
  adminEmail: string;
  adminContactNumber: string;
  dpUrl: string;
  adminAge: number;
  adminNICcardNumber: string;
  role?: string;
}

interface UserDetails {
  _id: string;
  name: string;
  userEmail: string;
  userContactNumber: string;
  dpUrl?: string;
  userAge?: number;
  userNICcardNumber?: string;
  role?: string;
}

interface CoachDetails {
  _id: string;
  coachName: string;
  coachEmail: string;
  coachContactNumber: string;
  dpUrl?: string;
  coachAge?: number;
  coachNICcardNumber?: string;
  role?: string;
}

interface GymDetails {
  _id: string;
  GymName: string;
  email: string;
  ownerContactNumber: string;
  logoUrl?: string;
  OwnerName?: string;
  Address?: string;
  role?: string;
}

interface AdminDetailsList {
  _id: string;
  adminName: string;
  adminEmail: string;
  adminContactNumber: string;
  dpUrl?: string;
  adminAge?: number;
  adminNICcardNumber?: string;
  role?: string;
}

export default function AdminHomeScreen() {
  const router = useRouter();
  const { user, logout } = useContext(AuthContext);
  const [adminDetails, setAdminDetails] = useState<AdminDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserDetails[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [deleteUserLoading, setDeleteUserLoading] = useState<string | null>(null);
  const [coaches, setCoaches] = useState<CoachDetails[]>([]);
  const [coachesLoading, setCoachesLoading] = useState(false);
  const [deleteCoachLoading, setDeleteCoachLoading] = useState<string | null>(null);
  const [gyms, setGyms] = useState<GymDetails[]>([]);
  const [gymsLoading, setGymsLoading] = useState(false);
  const [deleteGymLoading, setDeleteGymLoading] = useState<string | null>(null);
  const [admins, setAdmins] = useState<AdminDetailsList[]>([]);
  const [adminsLoading, setAdminsLoading] = useState(false);
  const [deleteAdminLoading, setDeleteAdminLoading] = useState<string | null>(null);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [contactModalVisible, setContactModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [changeProfileImageModal, setChangeProfileImageModal] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);

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

  // Fetch admin details on mount
  useEffect(() => {
    fetchAdminDetails();
    fetchAllUsers();
    fetchAllCoaches();
    fetchAllGyms();
    fetchAllAdmins();
  }, []);

  const fetchAdminDetails = async () => {
    try {
      setLoading(true);
      if (!user?.id) {
        Alert.alert('Error', 'Admin ID not found');
        return;
      }

      const response = await fetch(API_ENDPOINTS.ADMIN_DETAILS(user.id));
      const data = await response.json();

      if (data.admin) {
        setAdminDetails(data.admin);
      }
    } catch (error) {
      console.error('Error fetching admin details:', error);
      Alert.alert('Error', 'Failed to load admin details');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      setUsersLoading(true);
      const response = await fetch(API_ENDPOINTS.USER_GET_ALL);
      const data = await response.json();

      if (data.users && Array.isArray(data.users)) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchAllCoaches = async () => {
    try {
      setCoachesLoading(true);
      const response = await fetch(API_ENDPOINTS.COACH_GET_ALL);
      const data = await response.json();

      if (data.coaches && Array.isArray(data.coaches)) {
        setCoaches(data.coaches);
      }
    } catch (error) {
      console.error('Error fetching coaches:', error);
      Alert.alert('Error', 'Failed to load coaches');
    } finally {
      setCoachesLoading(false);
    }
  };

  const fetchAllGyms = async () => {
    try {
      setGymsLoading(true);
      const response = await fetch(API_ENDPOINTS.GYM_GET_ALL);
      const data = await response.json();

      if (data.gyms && Array.isArray(data.gyms)) {
        setGyms(data.gyms);
      }
    } catch (error) {
      console.error('Error fetching gyms:', error);
      Alert.alert('Error', 'Failed to load gyms');
    } finally {
      setGymsLoading(false);
    }
  };

  const fetchAllAdmins = async () => {
    try {
      setAdminsLoading(true);
      const response = await fetch(API_ENDPOINTS.ADMIN_GET_ALL);
      const data = await response.json();

      if (data.admins && Array.isArray(data.admins)) {
        setAdmins(data.admins);
      }
    } catch (error) {
      console.error('Error fetching admins:', error);
      Alert.alert('Error', 'Failed to load admins');
    } finally {
      setAdminsLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    Alert.alert(
      'Delete User',
      'Are you sure you want to delete this user?',
      [
        { text: 'Cancel', onPress: () => { } },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              setDeleteUserLoading(userId);
              const response = await fetch(API_ENDPOINTS.USER_DELETE(userId), {
                method: 'DELETE',
              });

              const data = await response.json();

              if (response.ok) {
                setUsers(users.filter(user => user._id !== userId));
                Alert.alert('Success', 'User deleted successfully');
              } else {
                Alert.alert('Error', data.message || 'Failed to delete user');
              }
            } catch (error) {
              console.error('Error deleting user:', error);
              Alert.alert('Error', 'Failed to delete user');
            } finally {
              setDeleteUserLoading(null);
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleDeleteCoach = async (coachId: string) => {
    Alert.alert(
      'Delete Coach',
      'Are you sure you want to delete this coach?',
      [
        { text: 'Cancel', onPress: () => { } },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              setDeleteCoachLoading(coachId);
              const response = await fetch(API_ENDPOINTS.COACH_DELETE(coachId), {
                method: 'DELETE',
              });

              const data = await response.json();

              if (response.ok) {
                setCoaches(coaches.filter(coach => coach._id !== coachId));
                Alert.alert('Success', 'Coach deleted successfully');
              } else {
                Alert.alert('Error', data.message || 'Failed to delete coach');
              }
            } catch (error) {
              console.error('Error deleting coach:', error);
              Alert.alert('Error', 'Failed to delete coach');
            } finally {
              setDeleteCoachLoading(null);
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleDeleteGym = async (gymId: string) => {
    Alert.alert(
      'Delete Gym',
      'Are you sure you want to delete this gym?',
      [
        { text: 'Cancel', onPress: () => { } },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              setDeleteGymLoading(gymId);
              const response = await fetch(API_ENDPOINTS.GYM_DELETE_BY_ADMIN(gymId), {
                method: 'DELETE',
              });

              const data = await response.json();

              if (response.ok) {
                setGyms(gyms.filter(gym => gym._id !== gymId));
                Alert.alert('Success', 'Gym deleted successfully');
              } else {
                Alert.alert('Error', data.message || 'Failed to delete gym');
              }
            } catch (error) {
              console.error('Error deleting gym:', error);
              Alert.alert('Error', 'Failed to delete gym');
            } finally {
              setDeleteGymLoading(null);
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleDeleteAdmin = async (adminId: string) => {
    Alert.alert(
      'Delete Admin',
      'Are you sure you want to delete this admin?',
      [
        { text: 'Cancel', onPress: () => { } },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              setDeleteAdminLoading(adminId);
              const response = await fetch(API_ENDPOINTS.ADMIN_DELETE_BY_ADMIN(adminId), {
                method: 'DELETE',
              });

              const data = await response.json();

              if (response.ok) {
                setAdmins(admins.filter(admin => admin._id !== adminId));
                Alert.alert('Success', 'Admin deleted successfully');
              } else {
                Alert.alert('Error', data.message || 'Failed to delete admin');
              }
            } catch (error) {
              console.error('Error deleting admin:', error);
              Alert.alert('Error', 'Failed to delete admin');
            } finally {
              setDeleteAdminLoading(null);
            }
          },
          style: 'destructive',
        },
      ]
    );
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
        Alert.alert('Error', 'Admin ID not found');
        return;
      }

      const response = await fetch(API_ENDPOINTS.ADMIN_UPDATE_PASSWORD(user.id), {
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

      // Validate contact number - must be exactly 10 digits
      const cleanedNumber = contactForm.newContactNumber.replace(/\D/g, '');
      if (cleanedNumber.length !== 10) {
        Alert.alert('Error', 'Contact number must contain exactly 10 digits');
        return;
      }

      if (!user?.id) {
        Alert.alert('Error', 'Admin ID not found');
        return;
      }

      const response = await fetch(API_ENDPOINTS.ADMIN_UPDATE_CONTACT(user.id), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newContactNumber: contactForm.newContactNumber }),
      });

      const data = await response.json();

      if (response.ok) {
        setAdminDetails(data.admin);
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

  const handleDeleteAdminAccount = () => {
    Alert.alert(
      'Delete Admin Account',
      'This action cannot be undone. Are you sure you want to delete your account?',
      [
        { text: 'Cancel', onPress: () => { } },
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

  const pickImageForChange = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        setSelectedImageUri(result.assets[0].uri);
        setChangeProfileImageModal(true);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadImageToCloudinary = async (imageUri: string): Promise<string | null> => {
    try {
      const formData = new FormData();
      const filename = imageUri.split('/').pop() || 'profile-image.jpg';

      formData.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: filename,
      } as any);
      formData.append('upload_preset', 'gym_logo');
      formData.append('cloud_name', 'dcahmv4lj');

      console.log('Uploading image to Cloudinary...');
      const response = await fetch('https://api.cloudinary.com/v1_1/dcahmv4lj/image/upload', {
        method: 'POST',
        body: formData,
      });

      const responseText = await response.text();
      console.log('Cloudinary response:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse response:', responseText);
        throw new Error('Invalid response from Cloudinary');
      }

      if (!response.ok) {
        console.error('Cloudinary error:', data);
        throw new Error(data.error?.message || `Upload failed: ${response.status}`);
      }

      if (data.secure_url) {
        console.log('Image uploaded successfully:', data.secure_url);
        return data.secure_url;
      } else {
        throw new Error('No secure URL returned from Cloudinary');
      }
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      Alert.alert('Upload Error', `Failed to upload image: ${error}`);
      return null;
    }
  };

  const handleUpdateProfileImage = async () => {
    try {
      if (!selectedImageUri) {
        Alert.alert('Error', 'Please select an image first');
        return;
      }

      setImageLoading(true);

      // Upload to Cloudinary
      const imageUrl = await uploadImageToCloudinary(selectedImageUri);

      if (!imageUrl) {
        Alert.alert('Error', 'Failed to upload image');
        setImageLoading(false);
        return;
      }

      // Update in database
      if (!user?.id) {
        Alert.alert('Error', 'Admin ID not found');
        setImageLoading(false);
        return;
      }

      const updateUrl = API_ENDPOINTS.ADMIN_UPDATE_PROFILE(user.id);
      console.log('Updating admin profile at:', updateUrl);
      console.log('Sending dpUrl:', imageUrl);

      const response = await fetch(
        updateUrl,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dpUrl: imageUrl }),
        }
      );

      const responseText = await response.text();
      let data;

      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse response:', responseText);
        Alert.alert('Error', 'Server error: Invalid response from server');
        setImageLoading(false);
        return;
      }

      if (response.ok) {
        setAdminDetails(data.admin);
        Alert.alert('Success', 'Profile picture updated successfully');
        setChangeProfileImageModal(false);
        setSelectedImageUri(null);
      } else {
        Alert.alert('Error', data.message || 'Failed to update profile picture');
      }
    } catch (error) {
      console.error('Error updating profile picture:', error);
      Alert.alert('Error', 'Failed to update profile picture');
    } finally {
      setImageLoading(false);
    }
  };

  const performDelete = async () => {
    try {
      if (!deleteForm.password) {
        Alert.alert('Error', 'Password is required');
        return;
      }

      if (!user?.id) {
        Alert.alert('Error', 'Admin ID not found');
        return;
      }

      const response = await fetch(API_ENDPOINTS.ADMIN_DELETE(user.id), {
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
        Alert.alert('Success', 'Admin account deleted successfully');
        await logout();
        router.replace('/login');
      } else {
        Alert.alert('Error', data.message || 'Failed to delete admin account');
      }
    } catch (error) {
      console.error('Error deleting admin:', error);
      Alert.alert('Error', 'Failed to delete admin account');
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', onPress: () => { } },
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

  // Hamburger Menu Handlers
  const handleProfilePress = () => {
    // Already on admin home page, so just return
    return;
  };

  const handleAdminRegistration = () => {
    router.push({ pathname: '/register', params: { type: 'admin', from: 'admin-home' } });
  };

  const handleAddSupplements = () => {
    router.push('/add-supplements');
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Hamburger Menu */}
      <HamburgerMenu
        pageType="admin"
        onProfilePress={handleProfilePress}
      />

      <ScrollView style={styles.container}>
        {/* Header Section with Profile Picture */}
        <View style={styles.headerSection}>
          {adminDetails?.dpUrl ? (
            <Image
              source={{ uri: adminDetails.dpUrl }}
              style={styles.topLogo}
            />
          ) : (
            <View style={styles.topLogo}>
              <Text style={styles.placeholderText}>Empty</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.compactImageButton}
            onPress={pickImageForChange}
          >
            <Text style={styles.compactImageButtonText}>Change Profile</Text>
          </TouchableOpacity>
          <Text style={styles.greeting} numberOfLines={2}>Hi Admin {adminDetails?.adminName}!</Text>
          <Text style={styles.subtitle}>Admin Dashboard</Text>
        </View>

        {/* Profile Info Card */}
        <View style={styles.profileCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Name</Text>
            <Text style={styles.detailValue}>{adminDetails?.adminName}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Email</Text>
            <Text style={styles.detailValue}>{adminDetails?.adminEmail}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Contact Number</Text>
            <Text style={styles.detailValue}>{adminDetails?.adminContactNumber}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Age</Text>
            <Text style={styles.detailValue}>{adminDetails?.adminAge}</Text>
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
        </View>

        {/* Register Admin Button */}
        <TouchableOpacity
          style={styles.optionButton}
          onPress={handleAdminRegistration}
        >
          <Text style={styles.optionIcon}>👨‍💼</Text>
          <Text style={styles.optionTitle}>Add New Admin</Text>
          <Text style={styles.optionDescription}>
            Join as an admin to manage the platform
          </Text>
        </TouchableOpacity>

        {/* Add Supplements Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleAddSupplements}>
          <Text style={styles.logoutButtonText}>Add Supplements</Text>
        </TouchableOpacity>

        {/* Registered Users Section */}
        <View style={styles.registeredUsersSection}>
          <Text style={styles.registeredUsersHeading}>Registered Users</Text>

          {usersLoading ? (
            <ActivityIndicator size="small" color="#007AFF" style={styles.userLoadingSpinner} />
          ) : users.length === 0 ? (
            <Text style={styles.noUsersText}>No registered users found</Text>
          ) : (
            <View style={styles.usersList}>
              {users.map((userItem) => (
                <View key={userItem._id} style={styles.userItem}>
                  {userItem.dpUrl ? (
                    <Image
                      source={{ uri: userItem.dpUrl }}
                      style={styles.userProfileImage}
                    />
                  ) : (
                    <View style={styles.userProfileImage}>
                      <Text style={styles.userProfilePlaceholder}>👤</Text>
                    </View>
                  )}
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{userItem.name}</Text>
                    <Text style={styles.userEmail}>{userItem.userEmail}</Text>
                    <Text style={styles.userContact}>{userItem.userContactNumber}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteUserButton}
                    onPress={() => handleDeleteUser(userItem._id)}
                    disabled={deleteUserLoading === userItem._id}
                  >
                    {deleteUserLoading === userItem._id ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text style={styles.deleteUserButtonText}>Delete</Text>
                    )}
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Registered Coaches Section */}
        <View style={styles.registeredUsersSection}>
          <Text style={styles.registeredUsersHeading}>Registered Coaches</Text>

          {coachesLoading ? (
            <ActivityIndicator size="small" color="#007AFF" style={styles.userLoadingSpinner} />
          ) : coaches.length === 0 ? (
            <Text style={styles.noUsersText}>No registered coaches found</Text>
          ) : (
            <View style={styles.usersList}>
              {coaches.map((coachItem) => (
                <View key={coachItem._id} style={styles.userItem}>
                  {coachItem.dpUrl ? (
                    <Image
                      source={{ uri: coachItem.dpUrl }}
                      style={styles.userProfileImage}
                    />
                  ) : (
                    <View style={styles.userProfileImage}>
                      <Text style={styles.userProfilePlaceholder}>👤</Text>
                    </View>
                  )}
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{coachItem.coachName}</Text>
                    <Text style={styles.userEmail}>{coachItem.coachEmail}</Text>
                    <Text style={styles.userContact}>{coachItem.coachContactNumber}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteUserButton}
                    onPress={() => handleDeleteCoach(coachItem._id)}
                    disabled={deleteCoachLoading === coachItem._id}
                  >
                    {deleteCoachLoading === coachItem._id ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text style={styles.deleteUserButtonText}>Delete</Text>
                    )}
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Registered Gyms Section */}
        <View style={styles.registeredUsersSection}>
          <Text style={styles.registeredUsersHeading}>Registered Gyms</Text>

          {gymsLoading ? (
            <ActivityIndicator size="small" color="#007AFF" style={styles.userLoadingSpinner} />
          ) : gyms.length === 0 ? (
            <Text style={styles.noUsersText}>No registered gyms found</Text>
          ) : (
            <View style={styles.usersList}>
              {gyms.map((gymItem) => (
                <View key={gymItem._id} style={styles.userItem}>
                  {gymItem.logoUrl ? (
                    <Image
                      source={{ uri: gymItem.logoUrl }}
                      style={styles.userProfileImage}
                    />
                  ) : (
                    <View style={styles.userProfileImage}>
                      <Text style={styles.userProfilePlaceholder}>🏋️</Text>
                    </View>
                  )}
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{gymItem.GymName}</Text>
                    <Text style={styles.userEmail}>{gymItem.email}</Text>
                    <Text style={styles.userContact}>{gymItem.ownerContactNumber}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteUserButton}
                    onPress={() => handleDeleteGym(gymItem._id)}
                    disabled={deleteGymLoading === gymItem._id}
                  >
                    {deleteGymLoading === gymItem._id ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text style={styles.deleteUserButtonText}>Delete</Text>
                    )}
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Registered Admins Section */}
        <View style={styles.registeredUsersSection}>
          <Text style={styles.registeredUsersHeading}>Registered Admins</Text>

          {adminsLoading ? (
            <ActivityIndicator size="small" color="#007AFF" style={styles.userLoadingSpinner} />
          ) : admins.length === 0 ? (
            <Text style={styles.noUsersText}>No registered admins found</Text>
          ) : (
            <View style={styles.usersList}>
              {admins.map((adminItem) => (
                <View key={adminItem._id} style={styles.userItem}>
                  {adminItem.dpUrl ? (
                    <Image
                      source={{ uri: adminItem.dpUrl }}
                      style={styles.userProfileImage}
                    />
                  ) : (
                    <View style={styles.userProfileImage}>
                      <Text style={styles.userProfilePlaceholder}>👨‍💼</Text>
                    </View>
                  )}
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{adminItem.adminName}</Text>
                    <Text style={styles.userEmail}>{adminItem.adminEmail}</Text>
                    <Text style={styles.userContact}>{adminItem.adminContactNumber}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteUserButton}
                    onPress={() => handleDeleteAdmin(adminItem._id)}
                    disabled={deleteAdminLoading === adminItem._id}
                  >
                    {deleteAdminLoading === adminItem._id ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text style={styles.deleteUserButtonText}>Delete</Text>
                    )}
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Delete Account Button */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={[styles.actionButton, styles.dangerAction]}
            onPress={handleDeleteAdminAccount}
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
              <Text style={styles.modalTitle}>Delete Admin Account</Text>
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

        {/* Change Profile Image Modal */}
        <Modal visible={changeProfileImageModal} transparent={true} animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Change Profile Picture</Text>

              <TouchableOpacity
                style={styles.imagePickerBox}
                onPress={pickImageForChange}
                disabled={imageLoading}
              >
                {selectedImageUri ? (
                  <Image
                    source={{ uri: selectedImageUri }}
                    style={styles.imagePreview}
                  />
                ) : (
                  <Text style={styles.imagePickerPlaceholder}>📸 Click to select image</Text>
                )}
              </TouchableOpacity>

              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={[styles.button, styles.saveButton]}
                  onPress={handleUpdateProfileImage}
                  disabled={!selectedImageUri || imageLoading}
                >
                  <Text style={styles.buttonText}>
                    {imageLoading ? 'Uploading...' : 'Update Image'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => {
                    setChangeProfileImageModal(false);
                    setSelectedImageUri(null);
                  }}
                  disabled={imageLoading}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </View>
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
    textAlign: 'center',
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
  optionButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginVertical: 10,
    marginHorizontal: 20,
  },
  optionIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  optionDescription: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
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
    justifyContent: 'center',
    alignItems: 'center',
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
  imagePickerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f9f9f9',
    height: 250,
    width: 250,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    alignSelf: 'center',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePickerPlaceholder: {
    fontSize: 16,
    color: '#999',
    fontWeight: '500',
  },
  compactImageButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactImageButtonText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#333',
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
  },
  registeredUsersSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
    marginTop: 20,
  },
  registeredUsersHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 15,
  },
  userLoadingSpinner: {
    marginVertical: 20,
  },
  noUsersText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
  },
  usersList: {
    gap: 12,
  },
  userItem: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    gap: 12,
  },
  userProfileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  userProfilePlaceholder: {
    fontSize: 24,
    fontWeight: '600',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  userContact: {
    fontSize: 13,
    color: '#666',
  },
  deleteUserButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 70,
  },
  deleteUserButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'white',
  },
});
