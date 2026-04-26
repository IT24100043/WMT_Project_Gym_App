import React, { useContext, useState, useEffect, useCallback } from 'react';
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
import { useRouter, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { AuthContext } from '@/context/AuthContext';
import { API_ENDPOINTS, API_BASE_URL } from '@/constants/api';
import HamburgerMenu from '@/components/HamburgerMenu';

interface CoachDetails {
  _id: string;
  coachName: string;
  coachEmail: string;
  coachContactNumber: string;
  dpUrl: string;
  coachAge: number;
  coachNICcardNumber: string;
  coachId: string;
  role?: string;
}

interface CoachPost {
  _id: string;
  coachId: string;
  fullname: string;
  description: string;
  experience: string;
  duration: string;
  fee: number;
  contactNumber: string;
}

export default function CoachHomeScreen() {
  const router = useRouter();
  const { user, logout } = useContext(AuthContext);
  const [coachDetails, setCoachDetails] = useState<CoachDetails | null>(null);
  const [coachPost, setCoachPost] = useState<CoachPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [contactModalVisible, setContactModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [changeProfileImageModal, setChangeProfileImageModal] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);

  // Coach Post Edit Modals
  const [editDescriptionModalVisible, setEditDescriptionModalVisible] = useState(false);
  const [editExperienceModalVisible, setEditExperienceModalVisible] = useState(false);
  const [editDurationModalVisible, setEditDurationModalVisible] = useState(false);
  const [editFeeModalVisible, setEditFeeModalVisible] = useState(false);
  const [editContactModalVisible, setEditContactModalVisible] = useState(false);
  const [deletePostModalVisible, setDeletePostModalVisible] = useState(false);
  const [editingLoading, setEditingLoading] = useState(false);

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

  // Coach Post Edit Forms
  const [editForm, setEditForm] = useState({
    description: '',
    experience: '',
    duration: '',
    fee: '',
    contactNumber: '',
  });

  // Fetch coach details on mount
  useEffect(() => {
    fetchCoachDetails();
    fetchCoachPost();
  }, []);

  // Refresh coach post when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('Screen focused - refreshing coach post');
      fetchCoachPost();
    }, [])
  );

  const fetchCoachDetails = async () => {
    try {
      setLoading(true);
      if (!user?.id) {
        Alert.alert('Error', 'Coach ID not found');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/coaches/coach-details/${user.id}`);
      const data = await response.json();

      if (data.coach) {
        setCoachDetails(data.coach);
      }
    } catch (error) {
      console.error('Error fetching coach details:', error);
      Alert.alert('Error', 'Failed to load coach details');
    } finally {
      setLoading(false);
    }
  };

  const fetchCoachPost = async () => {
    try {
      if (!user?.id) {
        console.log('No user ID found');
        return;
      }

      console.log('Fetching coach posts for coach ID:', user.id);

      // Add a small delay to ensure data is saved
      await new Promise(resolve => setTimeout(resolve, 500));

      // First get all coach posts to find the one belonging to this coach
      const response = await fetch(API_ENDPOINTS.COACHPOST_GET_ALL);
      const data = await response.json();

      console.log('API Response:', data);

      if (data.coachPosts && Array.isArray(data.coachPosts)) {
        console.log('Coach posts array:', data.coachPosts);
        console.log('Number of posts:', data.coachPosts.length);

        // Find the post for this coach - handle both populated object and string ID
        const myPost = data.coachPosts.find((post: CoachPost) => {
          // If coachId is an object (populated), get its _id
          const postCoachId = typeof post.coachId === 'object' && (post.coachId as any)._id
            ? (post.coachId as any)._id
            : post.coachId;

          console.log('Comparing:', {
            postCoachId: postCoachId?.toString(),
            userId: user.id?.toString(),
            match: postCoachId?.toString() === user.id?.toString()
          });

          return postCoachId?.toString() === user.id?.toString();
        });

        console.log('Found coach post:', myPost);

        if (myPost) {
          setCoachPost(myPost);
        } else {
          console.log('No post found for this coach');
          setCoachPost(null);
        }
      } else {
        console.log('No coachPosts array in response');
        setCoachPost(null);
      }
    } catch (error) {
      console.error('Error fetching coach post:', error);
      setCoachPost(null);
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
        Alert.alert('Error', 'Coach ID not found');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/coaches/coach-password/${user.id}`, {
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
        Alert.alert('Error', 'Coach ID not found');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/coaches/coach-contact/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newContactNumber: contactForm.newContactNumber }),
      });

      const data = await response.json();

      if (response.ok) {
        setCoachDetails(data.coach);
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

  const handleDeleteCoach = () => {
    Alert.alert(
      'Delete Coach Account',
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
        Alert.alert('Error', 'Coach ID not found');
        setImageLoading(false);
        return;
      }

      const updateUrl = `${API_BASE_URL}/api/coaches/coach-profile/${user.id}`;
      console.log('Updating coach profile at:', updateUrl);
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
        setCoachDetails(data.coach);
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
        Alert.alert('Error', 'Coach ID not found');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/coaches/coach-delete/${user.id}`, {
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
        Alert.alert('Success', 'Coach account deleted successfully');
        await logout();
        router.replace('/login');
      } else {
        Alert.alert('Error', data.message || 'Failed to delete coach account');
      }
    } catch (error) {
      console.error('Error deleting coach:', error);
      Alert.alert('Error', 'Failed to delete coach account');
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

  // Coach Post Edit Functions
  const handleEditDescription = async () => {
    try {
      if (!editForm.description.trim()) {
        Alert.alert('Error', 'Description cannot be empty');
        return;
      }
      if (!coachPost) return;

      setEditingLoading(true);
      const response = await fetch(
        API_ENDPOINTS.COACHPOST_UPDATE_DESCRIPTION(coachPost._id),
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ description: editForm.description }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        setCoachPost(data.coachPost);
        setEditDescriptionModalVisible(false);
        setEditForm({ ...editForm, description: '' });
        Alert.alert('Success', 'Description updated successfully');
      } else {
        Alert.alert('Error', data.message || 'Failed to update description');
      }
    } catch (error) {
      console.error('Error updating description:', error);
      Alert.alert('Error', 'Failed to update description');
    } finally {
      setEditingLoading(false);
    }
  };

  const handleEditExperience = async () => {
    try {
      if (!editForm.experience.trim()) {
        Alert.alert('Error', 'Experience cannot be empty');
        return;
      }
      if (!coachPost) return;

      setEditingLoading(true);
      const response = await fetch(
        API_ENDPOINTS.COACHPOST_UPDATE_EXPERIENCE(coachPost._id),
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ experience: editForm.experience }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        setCoachPost(data.coachPost);
        setEditExperienceModalVisible(false);
        setEditForm({ ...editForm, experience: '' });
        Alert.alert('Success', 'Experience updated successfully');
      } else {
        Alert.alert('Error', data.message || 'Failed to update experience');
      }
    } catch (error) {
      console.error('Error updating experience:', error);
      Alert.alert('Error', 'Failed to update experience');
    } finally {
      setEditingLoading(false);
    }
  };

  const handleEditDuration = async () => {
    try {
      if (!editForm.duration.trim()) {
        Alert.alert('Error', 'Duration cannot be empty');
        return;
      }
      if (!coachPost) return;

      setEditingLoading(true);
      const response = await fetch(
        API_ENDPOINTS.COACHPOST_UPDATE_DURATION(coachPost._id),
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ duration: editForm.duration }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        setCoachPost(data.coachPost);
        setEditDurationModalVisible(false);
        setEditForm({ ...editForm, duration: '' });
        Alert.alert('Success', 'Duration updated successfully');
      } else {
        Alert.alert('Error', data.message || 'Failed to update duration');
      }
    } catch (error) {
      console.error('Error updating duration:', error);
      Alert.alert('Error', 'Failed to update duration');
    } finally {
      setEditingLoading(false);
    }
  };

  const handleEditFee = async () => {
    try {
      if (!editForm.fee.trim()) {
        Alert.alert('Error', 'Fee cannot be empty');
        return;
      }
      if (isNaN(parseFloat(editForm.fee)) || parseFloat(editForm.fee) <= 0) {
        Alert.alert('Error', 'Fee must be a valid positive number');
        return;
      }
      if (!coachPost) return;

      setEditingLoading(true);
      const response = await fetch(
        API_ENDPOINTS.COACHPOST_UPDATE_FEE(coachPost._id),
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fee: parseFloat(editForm.fee) }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        setCoachPost(data.coachPost);
        setEditFeeModalVisible(false);
        setEditForm({ ...editForm, fee: '' });
        Alert.alert('Success', 'Fee updated successfully');
      } else {
        Alert.alert('Error', data.message || 'Failed to update fee');
      }
    } catch (error) {
      console.error('Error updating fee:', error);
      Alert.alert('Error', 'Failed to update fee');
    } finally {
      setEditingLoading(false);
    }
  };

  const handleEditContactNumber = async () => {
    try {
      if (!editForm.contactNumber.trim()) {
        Alert.alert('Error', 'Contact number cannot be empty');
        return;
      }
      const cleanedNumber = editForm.contactNumber.replace(/\D/g, '');
      if (cleanedNumber.length !== 10) {
        Alert.alert('Error', 'Contact number must contain exactly 10 digits');
        return;
      }
      if (!coachPost) return;

      setEditingLoading(true);
      const response = await fetch(
        API_ENDPOINTS.COACHPOST_UPDATE_CONTACT_NUMBER(coachPost._id),
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contactNumber: editForm.contactNumber }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        setCoachPost(data.coachPost);
        setEditContactModalVisible(false);
        setEditForm({ ...editForm, contactNumber: '' });
        Alert.alert('Success', 'Contact number updated successfully');
      } else {
        Alert.alert('Error', data.message || 'Failed to update contact number');
      }
    } catch (error) {
      console.error('Error updating contact number:', error);
      Alert.alert('Error', 'Failed to update contact number');
    } finally {
      setEditingLoading(false);
    }
  };

  const handleDeleteCoachPost = async () => {
    try {
      if (!coachPost) return;

      setEditingLoading(true);
      const response = await fetch(
        API_ENDPOINTS.COACHPOST_DELETE(coachPost._id),
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const data = await response.json();
      if (response.ok) {
        setCoachPost(null);
        setDeletePostModalVisible(false);
        Alert.alert('Success', 'Coach post deleted successfully');
      } else {
        Alert.alert('Error', data.message || 'Failed to delete coach post');
      }
    } catch (error) {
      console.error('Error deleting coach post:', error);
      Alert.alert('Error', 'Failed to delete coach post');
    } finally {
      setEditingLoading(false);
    }
  };

  const confirmDeleteCoachPost = () => {
    Alert.alert(
      'Delete Coach Post',
      'Are you sure you want to delete your coach post? This action cannot be undone.',
      [
        { text: 'Cancel', onPress: () => { } },
        {
          text: 'Delete',
          onPress: () => {
            setDeletePostModalVisible(true);
          },
          style: 'destructive',
        },
      ]
    );
  };

  // Hamburger Menu Handlers
  const handleProfilePress = () => {
    // Already on coach home page, so just return
    return;
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
        pageType="coach"
        onProfilePress={handleProfilePress}
      />

      <ScrollView style={styles.container}>
        {/* Header Section with Profile Picture */}
        <View style={styles.headerSection}>
          {coachDetails?.dpUrl ? (
            <Image
              source={{ uri: coachDetails.dpUrl }}
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
          <Text style={styles.greeting} numberOfLines={2}>Hi Coach {coachDetails?.coachName}!</Text>
          <Text style={styles.subtitle}>Welcome to gym fitness</Text>
        </View>

        {/* Profile Info Card */}
        <View style={styles.profileCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Name</Text>
            <Text style={styles.detailValue}>{coachDetails?.coachName}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Coach ID</Text>
            <Text style={styles.detailValue}>{coachDetails?.coachId}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Email</Text>
            <Text style={styles.detailValue}>{coachDetails?.coachEmail}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Contact Number</Text>
            <Text style={styles.detailValue}>{coachDetails?.coachContactNumber}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Age</Text>
            <Text style={styles.detailValue}>{coachDetails?.coachAge}</Text>
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

        {/* Coach Post Section */}
        <View style={styles.coachPostSection}>
          <Text style={styles.coachPostHeading}>Coach Post</Text>

          {coachPost ? (
            // Display Coach Post
            <View style={styles.postCard}>
              {/* Name */}
              <View style={styles.postNameSection}>
                <Text style={styles.postName}>{coachPost.fullname}</Text>
              </View>

              {/* Description */}
              <View style={styles.postInfoSection}>
                <View style={styles.postInfoRow}>
                  <Text style={styles.postInfoLabel}>Description</Text>
                  <TouchableOpacity
                    style={styles.smallEditButton}
                    onPress={() => {
                      setEditForm({ ...editForm, description: coachPost.description });
                      setEditDescriptionModalVisible(true);
                    }}
                  >
                    <Text style={styles.smallEditButtonText}>✏️</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.postInfoText}>{coachPost.description}</Text>
              </View>

              <View style={styles.dividerLine} />

              {/* Experience */}
              <View style={styles.postInfoSection}>
                <View style={styles.postInfoRow}>
                  <Text style={styles.postInfoLabel}>Experience</Text>
                  <TouchableOpacity
                    style={styles.smallEditButton}
                    onPress={() => {
                      setEditForm({ ...editForm, experience: coachPost.experience });
                      setEditExperienceModalVisible(true);
                    }}
                  >
                    <Text style={styles.smallEditButtonText}>✏️</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.postInfoText}>{coachPost.experience}</Text>
              </View>

              <View style={styles.dividerLine} />

              {/* Fee & Duration */}
              <View style={styles.postInfoSection}>
                <View style={styles.postInfoRow}>
                  <Text style={styles.postInfoLabel}>Fee (Duration)</Text>
                  <TouchableOpacity
                    style={styles.smallEditButton}
                    onPress={() => {
                      setEditForm({ ...editForm, fee: coachPost.fee.toString() });
                      setEditFeeModalVisible(true);
                    }}
                  >
                    <Text style={styles.smallEditButtonText}>✏️</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.feeSection}>
                  <Text style={styles.postInfoText}>Rs. {coachPost.fee}</Text>
                  <Text style={styles.durationText}>{coachPost.duration}</Text>
                </View>
                {coachPost.duration && (
                  <TouchableOpacity
                    style={styles.durationEditButton}
                    onPress={() => {
                      setEditForm({ ...editForm, duration: coachPost.duration });
                      setEditDurationModalVisible(true);
                    }}
                  >
                    <Text style={styles.durationEditButtonText}>Edit Duration</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.dividerLine} />

              {/* Contact Number */}
              <View style={styles.postInfoSection}>
                <View style={styles.postInfoRow}>
                  <Text style={styles.postInfoLabel}>Contact Number</Text>
                  <TouchableOpacity
                    style={styles.smallEditButton}
                    onPress={() => {
                      setEditForm({ ...editForm, contactNumber: coachPost.contactNumber });
                      setEditContactModalVisible(true);
                    }}
                  >
                    <Text style={styles.smallEditButtonText}>✏️</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.postInfoText}>{coachPost.contactNumber}</Text>
              </View>

              {/* Delete Button */}
              <TouchableOpacity
                style={styles.deletePostButton}
                onPress={confirmDeleteCoachPost}
              >
                <Text style={styles.deletePostButtonText}>🗑️ Delete Coach Post</Text>
              </TouchableOpacity>
            </View>
          ) : (
            // Show Create Button
            <TouchableOpacity
              style={[styles.actionButton, styles.coachPostButton]}
              onPress={() => {
                router.push('/coach-post');
              }}
            >
              <Text style={styles.coachPostButtonText}>📝 Create Coach Post</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Delete Account Button */}
        <TouchableOpacity
          style={styles.deleteAccountButton}
          onPress={handleDeleteCoach}
        >
          <Text style={styles.deleteAccountButtonText}>🗑️ Delete Account</Text>
        </TouchableOpacity>

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
              <Text style={styles.modalTitle}>Delete Coach Account</Text>
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

        {/* Edit Description Modal */}
        <Modal visible={editDescriptionModalVisible} transparent={true} animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit Description</Text>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                value={editForm.description}
                onChangeText={(text) => setEditForm({ ...editForm, description: text })}
                placeholder="Enter description"
                multiline
                numberOfLines={4}
                editable={!editingLoading}
              />
              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={[styles.button, styles.saveButton]}
                  onPress={handleEditDescription}
                  disabled={editingLoading}
                >
                  <Text style={styles.buttonText}>
                    {editingLoading ? 'Updating...' : 'Update'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => {
                    setEditDescriptionModalVisible(false);
                    setEditForm({ ...editForm, description: '' });
                  }}
                  disabled={editingLoading}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Edit Experience Modal */}
        <Modal visible={editExperienceModalVisible} transparent={true} animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit Experience</Text>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                value={editForm.experience}
                onChangeText={(text) => setEditForm({ ...editForm, experience: text })}
                placeholder="Enter experience"
                multiline
                numberOfLines={4}
                editable={!editingLoading}
              />
              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={[styles.button, styles.saveButton]}
                  onPress={handleEditExperience}
                  disabled={editingLoading}
                >
                  <Text style={styles.buttonText}>
                    {editingLoading ? 'Updating...' : 'Update'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => {
                    setEditExperienceModalVisible(false);
                    setEditForm({ ...editForm, experience: '' });
                  }}
                  disabled={editingLoading}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Edit Duration Modal */}
        <Modal visible={editDurationModalVisible} transparent={true} animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit Duration</Text>
              <TextInput
                style={styles.input}
                value={editForm.duration}
                onChangeText={(text) => setEditForm({ ...editForm, duration: text })}
                placeholder="e.g., 4 weeks, 1 month, 3 months"
                editable={!editingLoading}
              />
              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={[styles.button, styles.saveButton]}
                  onPress={handleEditDuration}
                  disabled={editingLoading}
                >
                  <Text style={styles.buttonText}>
                    {editingLoading ? 'Updating...' : 'Update'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => {
                    setEditDurationModalVisible(false);
                    setEditForm({ ...editForm, duration: '' });
                  }}
                  disabled={editingLoading}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Edit Fee Modal */}
        <Modal visible={editFeeModalVisible} transparent={true} animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit Fee</Text>
              <TextInput
                style={styles.input}
                value={editForm.fee}
                onChangeText={(text) => setEditForm({ ...editForm, fee: text })}
                placeholder="Enter fee"
                keyboardType="decimal-pad"
                editable={!editingLoading}
              />
              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={[styles.button, styles.saveButton]}
                  onPress={handleEditFee}
                  disabled={editingLoading}
                >
                  <Text style={styles.buttonText}>
                    {editingLoading ? 'Updating...' : 'Update'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => {
                    setEditFeeModalVisible(false);
                    setEditForm({ ...editForm, fee: '' });
                  }}
                  disabled={editingLoading}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Edit Contact Number Modal */}
        <Modal visible={editContactModalVisible} transparent={true} animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit Contact Number</Text>
              <TextInput
                style={styles.input}
                value={editForm.contactNumber}
                onChangeText={(text) => setEditForm({ ...editForm, contactNumber: text })}
                placeholder="Enter 10-digit contact number"
                keyboardType="phone-pad"
                maxLength={10}
                editable={!editingLoading}
              />
              <Text style={styles.helperText}>Must be exactly 10 digits</Text>
              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={[styles.button, styles.saveButton]}
                  onPress={handleEditContactNumber}
                  disabled={editingLoading}
                >
                  <Text style={styles.buttonText}>
                    {editingLoading ? 'Updating...' : 'Update'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => {
                    setEditContactModalVisible(false);
                    setEditForm({ ...editForm, contactNumber: '' });
                  }}
                  disabled={editingLoading}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Delete Coach Post Modal */}
        <Modal visible={deletePostModalVisible} transparent={true} animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Delete Coach Post</Text>
              <Text style={styles.modalDescription}>
                Are you sure you want to delete your coach post? This action cannot be undone.
              </Text>
              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={[styles.button, styles.saveButton, styles.deleteButton]}
                  onPress={handleDeleteCoachPost}
                  disabled={editingLoading}
                >
                  <Text style={styles.buttonText}>
                    {editingLoading ? 'Deleting...' : 'Delete'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => {
                    setDeletePostModalVisible(false);
                  }}
                  disabled={editingLoading}
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
  deleteAccountButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    paddingVertical: 15,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  deleteAccountButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  coachPostSection: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  coachPostHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  coachPostButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    marginHorizontal: 20,
    marginBottom: 12,
  },
  coachPostButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
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
  postCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  postNameSection: {
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 16,
  },
  postName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  postInfoSection: {
    marginBottom: 16,
  },
  postInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  postInfoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  postInfoText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  smallEditButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  smallEditButtonText: {
    fontSize: 16,
    color: '#333',
  },
  dividerLine: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 12,
  },
  feeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  durationText: {
    fontSize: 13,
    color: '#999',
    fontStyle: 'italic',
  },
  durationEditButton: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
    alignSelf: 'flex-start',
  },
  durationEditButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  deletePostButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 16,
    alignItems: 'center',
  },
  deletePostButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  multilineInput: {
    minHeight: 100,
    paddingTop: 10,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    marginTop: 6,
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
});
