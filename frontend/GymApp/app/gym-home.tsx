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
import { API_ENDPOINTS } from '@/constants/api';
import HamburgerMenu from '../components/HamburgerMenu';

interface GymDetails {
  _id: string;
  GymName: string;
  email: string;
  OwnerName: string;
  ownerContactNumber: string;
  gymType: string;
  Address: string;
  logoUrl: string;
  role?: string;
}

interface GymPost {
  _id: string;
  gymId: string;
  gymImg?: string;
  gymInfotmation: string;
  openHours: string;
  closeHours: string;
  gymContactNumber: string;
  city: string;
  gymFasilities: Array<{ _id?: string; fasility: string }>;
  packages: Array<{
    _id?: string;
    packageName: string;
    packagePrice: number;
    packageDuration: string;
    features: string[];
  }>;
}

export default function GymHomeScreen() {
  const router = useRouter();
  const { user, logout } = useContext(AuthContext);
  const [gymDetails, setGymDetails] = useState<GymDetails | null>(null);
  const [gymPosts, setGymPosts] = useState<GymPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [contactModalVisible, setContactModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  
  // Post management modals
  const [updateDescriptionModal, setUpdateDescriptionModal] = useState(false);
  const [updateOpenHoursModal, setUpdateOpenHoursModal] = useState(false);
  const [updateCloseHoursModal, setUpdateCloseHoursModal] = useState(false);
  const [updateContactModal, setUpdateContactModal] = useState(false);
  const [updateCityModal, setUpdateCityModal] = useState(false);
  const [addFacilityModal, setAddFacilityModal] = useState(false);
  const [deleteFacilityModal, setDeleteFacilityModal] = useState(false);
  const [addPackageModal, setAddPackageModal] = useState(false);
  const [deletePackageModal, setDeletePackageModal] = useState(false);
  const [deletePostModal, setDeletePostModal] = useState(false);
  const [changeImageModal, setChangeImageModal] = useState(false);
  
  // Image loading state
  const [imageLoading, setImageLoading] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  
  // Current post being edited
  const [currentPostId, setCurrentPostId] = useState<string | null>(null);
  
  // Form data for post actions
  const [postUpdateData, setPostUpdateData] = useState({
    description: '',
    openHours: '',
    closeHours: '',
    contactNumber: '',
    city: '',
    facilityName: '',
    facilityId: '',
    packageName: '',
    packagePrice: '',
    packageDuration: '',
    packageFeatures: [''],
    packageId: '',
  });

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

  // Time input states for updating open hours
  const [updateOpenHourHour, setUpdateOpenHourHour] = useState('');
  const [updateOpenHourMinute, setUpdateOpenHourMinute] = useState('');
  const [updateOpenHourPeriod, setUpdateOpenHourPeriod] = useState<'AM' | 'PM'>('AM');

  // Time input states for updating close hours
  const [updateCloseHourHour, setUpdateCloseHourHour] = useState('');
  const [updateCloseHourMinute, setUpdateCloseHourMinute] = useState('');
  const [updateCloseHourPeriod, setUpdateCloseHourPeriod] = useState<'AM' | 'PM'>('PM');

  // Helper function to format time
  const formatTime = (hour: string, minute: string, period: 'AM' | 'PM'): string => {
    if (!hour || !minute) return '';
    const paddedHour = hour.padStart(2, '0');
    const paddedMinute = minute.padStart(2, '0');
    return `${paddedHour}:${paddedMinute} ${period}`;
  };

  // Validation function for time inputs
  const isValidTimeInput = (hour: string, minute: string): boolean => {
    if (!hour || !minute) return false;
    const hourNum = parseInt(hour, 10);
    const minuteNum = parseInt(minute, 10);
    return hourNum >= 1 && hourNum <= 12 && minuteNum >= 0 && minuteNum <= 59;
  };

  // Helper function to parse time string (e.g., "06:00 AM") into components
  const parseTimeString = (timeStr: string): { hour: string; minute: string; period: 'AM' | 'PM' } => {
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s(AM|PM)/i);
    if (match) {
      const normalizedHour = String(parseInt(match[1], 10));
      const normalizedMinute = String(parseInt(match[2], 10));
      return {
        hour: normalizedHour,
        minute: normalizedMinute,
        period: (match[3].toUpperCase() as 'AM' | 'PM'),
      };
    }
    return { hour: '', minute: '', period: 'AM' };
  };

  // Fetch gym details on mount
  useEffect(() => {
    fetchGymDetails();
    fetchGymPosts();
  }, []);

  // Refresh gym posts when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchGymPosts();
    }, [])
  );

  const fetchGymDetails = async () => {
    try {
      setLoading(true);
      if (!user?.id) {
        Alert.alert('Error', 'User ID not found');
        return;
      }

      const response = await fetch(API_ENDPOINTS.GYM_DETAILS(user.id));
      const data = await response.json();

      if (data.gym) {
        setGymDetails(data.gym);
      }
    } catch (error) {
      console.error('Error fetching gym details:', error);
      Alert.alert('Error', 'Failed to load gym details');
    } finally {
      setLoading(false);
    }
  };

  const fetchGymPosts = async () => {
    try {
      if (!user?.id) {
        return;
      }

      const url = API_ENDPOINTS.GYM_INFO_BY_GYM_ID(user.id);

      const response = await fetch(url);
      const text = await response.text();
      
      // Don't log if it's the expected "no gym information" response
      if (!text.includes('No gym information found')) {
        console.log('Fetching gym posts from:', url);
        console.log('Response status:', response.status);
      }

      if (response.ok) {
        try {
          const data = JSON.parse(text);
          if (data.gymInfos && Array.isArray(data.gymInfos)) {
            setGymPosts(data.gymInfos.reverse());
          } else {
            setGymPosts([]);
          }
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          setGymPosts([]);
        }
      } else {
        // Silently handle "No gym information found" - this is expected when user has no posts
        if (!text.includes('No gym information found')) {
          console.error('API error response:', text);
        }
        setGymPosts([]);
      }
    } catch (error) {
      console.error('Error fetching gym posts:', error);
      setGymPosts([]);
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

      const response = await fetch(API_ENDPOINTS.GYM_UPDATE_PASSWORD(user.id), {
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
      const cleanedContactNumber = contactForm.newContactNumber.replace(/\D/g, '');
      if (cleanedContactNumber.length !== 10) {
        Alert.alert('Error', 'Contact number must contain exactly 10 digits');
        return;
      }

      if (!user?.id) {
        Alert.alert('Error', 'User ID not found');
        return;
      }

      const response = await fetch(API_ENDPOINTS.GYM_UPDATE_CONTACT(user.id), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newContactNumber: contactForm.newContactNumber }),
      });

      const data = await response.json();

      if (response.ok) {
        setGymDetails(data.gym);
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

  const handleDeleteGym = () => {
    Alert.alert(
      'Delete Gym Account',
      'This action cannot be undone. Are you sure you want to delete your gym account?',
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

      const response = await fetch(API_ENDPOINTS.GYM_DELETE(user.id), {
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
        Alert.alert('Success', 'Gym account deleted successfully');
        await logout();
        router.replace('/login');
      } else {
        Alert.alert('Error', data.message || 'Failed to delete gym account');
      }
    } catch (error) {
      console.error('Error deleting gym:', error);
      Alert.alert('Error', 'Failed to delete gym account');
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

  // Hamburger Menu Handlers
  const handleProfilePress = () => {
    // Already on gym home page, so just return
    return;
  };

  // Post Management Handlers
  const handleUpdateDescription = async () => {
    try {
      if (!postUpdateData.description.trim()) {
        Alert.alert('Error', 'Description cannot be empty');
        return;
      }

      const response = await fetch(
        API_ENDPOINTS.GYM_INFO_UPDATE_DESCRIPTION(currentPostId || ''),
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gymInfotmation: postUpdateData.description }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        Alert.alert('Success', 'Description updated successfully');
        setUpdateDescriptionModal(false);
        fetchGymPosts();
      } else {
        Alert.alert('Error', data.message || 'Failed to update description');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update description');
    }
  };

  const handleUpdateOpenHours = async () => {
    try {
      if (!isValidTimeInput(updateOpenHourHour, updateOpenHourMinute)) {
        Alert.alert('Error', 'Please enter valid opening hours (Hour: 1-12, Minute: 0-59)');
        return;
      }

      const formattedOpenHours = formatTime(updateOpenHourHour, updateOpenHourMinute, updateOpenHourPeriod);

      const response = await fetch(
        API_ENDPOINTS.GYM_INFO_UPDATE_OPEN_HOURS(currentPostId || ''),
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ openHours: formattedOpenHours }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        Alert.alert('Success', 'Open hours updated successfully');
        setUpdateOpenHoursModal(false);
        setUpdateOpenHourHour('');
        setUpdateOpenHourMinute('');
        setUpdateOpenHourPeriod('AM');
        fetchGymPosts();
      } else {
        Alert.alert('Error', data.message || 'Failed to update open hours');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update open hours');
    }
  };

  const handleUpdateCloseHours = async () => {
    try {
      if (!isValidTimeInput(updateCloseHourHour, updateCloseHourMinute)) {
        Alert.alert('Error', 'Please enter valid closing hours (Hour: 1-12, Minute: 0-59)');
        return;
      }

      const formattedCloseHours = formatTime(updateCloseHourHour, updateCloseHourMinute, updateCloseHourPeriod);

      const response = await fetch(
        API_ENDPOINTS.GYM_INFO_UPDATE_CLOSE_HOURS(currentPostId || ''),
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ closeHours: formattedCloseHours }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        Alert.alert('Success', 'Close hours updated successfully');
        setUpdateCloseHoursModal(false);
        setUpdateCloseHourHour('');
        setUpdateCloseHourMinute('');
        setUpdateCloseHourPeriod('PM');
        fetchGymPosts();
      } else {
        Alert.alert('Error', data.message || 'Failed to update close hours');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update close hours');
    }
  };

  const handleUpdateContactNumber = async () => {
    try {
      if (!postUpdateData.contactNumber.trim()) {
        Alert.alert('Error', 'Contact number cannot be empty');
        return;
      }

      // Validate contact number - must be exactly 10 digits
      const cleanedContactNumber = postUpdateData.contactNumber.replace(/\D/g, '');
      if (cleanedContactNumber.length !== 10) {
        Alert.alert('Error', 'Contact number must contain exactly 10 digits');
        return;
      }

      const response = await fetch(
        API_ENDPOINTS.GYM_INFO_UPDATE_CONTACT_NUMBER(currentPostId || ''),
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newContactNumber: postUpdateData.contactNumber }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        Alert.alert('Success', 'Contact number updated successfully');
        setUpdateContactModal(false);
        fetchGymPosts();
      } else {
        Alert.alert('Error', data.message || 'Failed to update contact number');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update contact number');
    }
  };

  const handleUpdateCity = async () => {
    try {
      if (!postUpdateData.city.trim()) {
        Alert.alert('Error', 'City cannot be empty');
        return;
      }

      const response = await fetch(
        API_ENDPOINTS.GYM_INFO_UPDATE_CITY(currentPostId || ''),
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ city: postUpdateData.city }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        Alert.alert('Success', 'City updated successfully');
        setUpdateCityModal(false);
        fetchGymPosts();
      } else {
        Alert.alert('Error', data.message || 'Failed to update city');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update city');
    }
  };

  const handleAddFacility = async () => {
    try {
      if (!postUpdateData.facilityName.trim()) {
        Alert.alert('Error', 'Facility name cannot be empty');
        return;
      }

      const response = await fetch(
        API_ENDPOINTS.GYM_INFO_ADD_FACILITY(currentPostId || ''),
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fasility: postUpdateData.facilityName }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        Alert.alert('Success', 'Facility added successfully');
        setAddFacilityModal(false);
        setPostUpdateData({ ...postUpdateData, facilityName: '' });
        fetchGymPosts();
      } else {
        Alert.alert('Error', data.message || 'Failed to add facility');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add facility');
    }
  };

  const handleDeleteFacility = async () => {
    try {
      if (!postUpdateData.facilityId.trim()) {
        Alert.alert('Error', 'Please select a facility to delete');
        return;
      }

      const response = await fetch(
        API_ENDPOINTS.GYM_INFO_DELETE_FACILITY(currentPostId || ''),
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fasilityId: postUpdateData.facilityId }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        Alert.alert('Success', 'Facility deleted successfully');
        setDeleteFacilityModal(false);
        setPostUpdateData({ ...postUpdateData, facilityId: '' });
        fetchGymPosts();
      } else {
        Alert.alert('Error', data.message || 'Failed to delete facility');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to delete facility');
    }
  };

  const handleAddPackageFeature = () => {
    const newFeatures = [...postUpdateData.packageFeatures, ''];
    setPostUpdateData({ ...postUpdateData, packageFeatures: newFeatures });
  };

  const handleUpdatePackageFeature = (featureIndex: number, value: string) => {
    const newFeatures = [...postUpdateData.packageFeatures];
    newFeatures[featureIndex] = value;
    setPostUpdateData({ ...postUpdateData, packageFeatures: newFeatures });
  };

  const handleRemovePackageFeature = (featureIndex: number) => {
    const newFeatures = postUpdateData.packageFeatures.filter(
      (_, i) => i !== featureIndex
    );
    setPostUpdateData({
      ...postUpdateData,
      packageFeatures: newFeatures.length > 0 ? newFeatures : [''],
    });
  };

  const handleAddPackage = async () => {
    try {
      if (!postUpdateData.packageName.trim()) {
        Alert.alert('Error', 'Package name cannot be empty');
        return;
      }

      const response = await fetch(
        API_ENDPOINTS.GYM_INFO_ADD_PACKAGE(currentPostId || ''),
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            packageName: postUpdateData.packageName,
            packagePrice: parseFloat(postUpdateData.packagePrice) || 0,
            packageDuration: postUpdateData.packageDuration,
            features: postUpdateData.packageFeatures.filter((f) => f.trim()),
          }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        Alert.alert('Success', 'Package added successfully');
        setAddPackageModal(false);
        setPostUpdateData({
          ...postUpdateData,
          packageName: '',
          packagePrice: '',
          packageDuration: '',
          packageFeatures: [''],
        });
        fetchGymPosts();
      } else {
        Alert.alert('Error', data.message || 'Failed to add package');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add package');
    }
  };

  const handleDeletePackage = async () => {
    try {
      if (!postUpdateData.packageId.trim()) {
        Alert.alert('Error', 'Please select a package to delete');
        return;
      }

      const response = await fetch(
        API_ENDPOINTS.GYM_INFO_DELETE_PACKAGE(currentPostId || ''),
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ packageId: postUpdateData.packageId }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        Alert.alert('Success', 'Package deleted successfully');
        setDeletePackageModal(false);
        setPostUpdateData({ ...postUpdateData, packageId: '' });
        fetchGymPosts();
      } else {
        Alert.alert('Error', data.message || 'Failed to delete package');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to delete package');
    }
  };

  const handleDeletePost = async () => {
    try {
      const response = await fetch(
        API_ENDPOINTS.GYM_INFO_DELETE(currentPostId || ''),
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const data = await response.json();
      if (response.ok) {
        Alert.alert('Success', 'Post deleted successfully');
        setDeletePostModal(false);
        fetchGymPosts();
      } else {
        Alert.alert('Error', data.message || 'Failed to delete post');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to delete post');
    }
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
        setChangeImageModal(true);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadImageToCloudinary = async (imageUri: string): Promise<string | null> => {
    try {
      const formData = new FormData();
      const filename = imageUri.split('/').pop() || 'gym-image.jpg';
      
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

  const handleUpdateImage = async () => {
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

      // Determine if updating gym logo or post image
      if (!currentPostId) {
        // Update gym logo
        if (!user?.id) {
          Alert.alert('Error', 'User ID not found');
          setImageLoading(false);
          return;
        }

        const updateUrl = API_ENDPOINTS.GYM_UPDATE_PROFILE(user.id);
        console.log('Updating gym logo at:', updateUrl);
        console.log('Sending logoUrl:', imageUrl);

        const response = await fetch(
          updateUrl,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ logoUrl: imageUrl }),
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
          Alert.alert('Success', 'Gym logo updated successfully');
          setChangeImageModal(false);
          setSelectedImageUri(null);
          fetchGymDetails();
        } else {
          Alert.alert('Error', data.message || 'Failed to update gym logo');
        }
      } else {
        // Update gym post image
        const updateUrl = API_ENDPOINTS.GYM_INFO_UPDATE_IMAGE(currentPostId);
        console.log('Updating gym post image at:', updateUrl);
        console.log('Sending gymImg:', imageUrl);

        const response = await fetch(
          updateUrl,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gymImg: imageUrl }),
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
          Alert.alert('Success', 'Image updated successfully');
          setChangeImageModal(false);
          setSelectedImageUri(null);
          fetchGymPosts();
        } else {
          Alert.alert('Error', data.message || 'Failed to update image');
        }
      }
    } catch (error) {
      console.error('Error updating image:', error);
      Alert.alert('Error', 'Failed to update image');
    } finally {
      setImageLoading(false);
    }
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
        pageType="gym"
        onProfilePress={handleProfilePress}
      />

      <ScrollView style={styles.container}>
        {/* Header Section with Logo */}
        <View style={styles.headerSection}>
          {gymDetails?.logoUrl ? (
            <Image
              source={{ uri: gymDetails.logoUrl }}
              style={styles.topLogo}
            />
          ) : (
            <View style={styles.topLogo}>
              <Text style={styles.placeholderText}>Empty</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.compactImageButton}
            onPress={() => {
              setCurrentPostId(null);
              pickImageForChange();
            }}
          >
            <Text style={styles.compactImageButtonText}>Change Logo</Text>
          </TouchableOpacity>
          <Text style={styles.greeting} numberOfLines={2}>Hi {gymDetails?.GymName}!</Text>
          <Text style={styles.subtitle}>Manage Your Gym Operations</Text>
        </View>

        {/* Profile Info Card */}
        <View style={styles.profileCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Gym Name</Text>
            <Text style={styles.detailValue}>{gymDetails?.GymName}</Text>
          </View>
          <View style={styles.divider} />

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Email</Text>
          <Text style={styles.detailValue}>{gymDetails?.email}</Text>
        </View>
        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Owner Name</Text>
          <Text style={styles.detailValue}>{gymDetails?.OwnerName}</Text>
        </View>
        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Contact Number</Text>
          <Text style={styles.detailValue}>{gymDetails?.ownerContactNumber}</Text>
        </View>
        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Gym Type</Text>
          <Text style={styles.detailValue}>{gymDetails?.gymType}</Text>
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

      {/* Gym Post Section */}
      {gymPosts.length === 0 && (
        <View style={styles.gymPostSection}>
          <Text style={styles.gymPostHeading}>Gym Post</Text>
          <TouchableOpacity
            style={[styles.actionButton, styles.gymPostButton]}
            onPress={() => {
              router.push('/gym-post');
            }}
          >
            <Text style={styles.gymPostButtonText}>📝 Create Gym Post</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Gym Posts List */}
      {gymPosts.length > 0 && (
        <View style={styles.gymPostsListSection}>
          {gymPosts.map((post) => (
            <View key={post._id} style={styles.postCard}>
              {post.gymImg && (
                <Image
                  source={{ uri: post.gymImg }}
                  style={styles.postImage}
                />
              )}
              <View style={styles.postContent}>
                {/* Gym Name */}
                <Text style={styles.postGymName}>
                  {(post.gymId as any)?.GymName || 'Gym'}
                </Text>

                {/* City */}
                <Text style={styles.postCity}>
                  <Text style={styles.label}>City: </Text>
                  {post.city}
                </Text>

                {/* Description */}
                <Text style={styles.postDescription}>
                  {post.gymInfotmation}
                </Text>

                {/* Hours and Contact */}
                <View style={styles.postInfoRow}>
                  <Text style={styles.postInfo}>
                    <Text style={styles.label}>Open Hours: </Text>
                    {post.openHours}
                  </Text>
                  <Text style={styles.postInfo}>
                    <Text style={styles.label}>Close Hours: </Text>
                    {post.closeHours}
                  </Text>
                  <Text style={styles.postInfoContact}>
                    <Text style={styles.label}>Contact Number: </Text>
                    {post.gymContactNumber}
                  </Text>
                </View>

                {/* Facilities */}
                {post.gymFasilities && post.gymFasilities.length > 0 && (
                  <View style={styles.facilitiesSection}>
                    <Text style={styles.sectionTitle}>Facilities:</Text>
                    {post.gymFasilities.map((fac: any, idx: number) => (
                      <View key={idx} style={styles.facilityCard}>
                        <Text style={styles.facilityCardItem}>
                          ✓ {fac.fasility}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Packages */}
                {post.packages && post.packages.length > 0 && (
                  <View style={styles.packagesSection}>
                    <Text style={styles.sectionTitle}>Available Packages:</Text>
                    {post.packages.map((pkg: any, idx: number) => (
                      <View key={idx} style={styles.packageItem}>
                        <Text style={styles.packageName}>{pkg.packageName}</Text>
                        <Text style={styles.packagePrice}>
                          <Text style={styles.label}>Price: </Text>
                          Rs. {pkg.packagePrice}
                        </Text>
                        <Text style={styles.packageDuration}>
                          <Text style={styles.label}>Duration: </Text>
                          {pkg.packageDuration}
                        </Text>
                        {pkg.features && pkg.features.length > 0 && (
                          <View style={styles.packageFeatures}>
                            <Text style={styles.label}>Features: </Text>
                            {pkg.features.map((feature: string, fIdx: number) => (
                              <Text key={fIdx} style={styles.featureItem}>
                                ✓ {feature}
                              </Text>
                            ))}
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                )}

                {/* Action Buttons */}
                <View style={styles.postActionsSection}>
                  {/* Row 1: Update Description */}
                  <TouchableOpacity
                    style={[styles.postActionButton, styles.fullWidth]}
                    onPress={() => {
                      setCurrentPostId(post._id);
                      setPostUpdateData({ ...postUpdateData, description: post.gymInfotmation });
                      setUpdateDescriptionModal(true);
                    }}
                  >
                    <Text style={styles.postActionButtonText}>📝 Update Description</Text>
                  </TouchableOpacity>

                  {/* Row 1.5: Change Image */}
                  <TouchableOpacity
                    style={[styles.postActionButton, styles.fullWidth]}
                    onPress={() => {
                      setCurrentPostId(post._id);
                      setSelectedImageUri(null);
                      setChangeImageModal(true);
                    }}
                  >
                    <Text style={styles.postActionButtonText}>🖼️ Change Image</Text>
                  </TouchableOpacity>

                  {/* Row 2: Update Hours */}
                  <View style={styles.doubleButtonRow}>
                    <TouchableOpacity
                      style={[styles.postActionButton, styles.halfWidth]}
                      onPress={() => {
                        setCurrentPostId(post._id);
                        const parsed = parseTimeString(post.openHours);
                        setUpdateOpenHourHour(parsed.hour);
                        setUpdateOpenHourMinute(parsed.minute);
                        setUpdateOpenHourPeriod(parsed.period);
                        setUpdateOpenHoursModal(true);
                      }}
                    >
                      <Text style={styles.postActionButtonText}>🕐 Open Hours</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.postActionButton, styles.halfWidth, styles.marginLeft]}
                      onPress={() => {
                        setCurrentPostId(post._id);
                        const parsed = parseTimeString(post.closeHours);
                        setUpdateCloseHourHour(parsed.hour);
                        setUpdateCloseHourMinute(parsed.minute);
                        setUpdateCloseHourPeriod(parsed.period);
                        setUpdateCloseHoursModal(true);
                      }}
                    >
                      <Text style={styles.postActionButtonText}>🕘 Close Hours</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Row 3: Update Contact & City */}
                  <View style={styles.doubleButtonRow}>
                    <TouchableOpacity
                      style={[styles.postActionButton, styles.halfWidth]}
                      onPress={() => {
                        setCurrentPostId(post._id);
                        setPostUpdateData({ ...postUpdateData, contactNumber: post.gymContactNumber });
                        setUpdateContactModal(true);
                      }}
                    >
                      <Text style={styles.postActionButtonText}>📞 Contact</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.postActionButton, styles.halfWidth, styles.marginLeft]}
                      onPress={() => {
                        setCurrentPostId(post._id);
                        setPostUpdateData({ ...postUpdateData, city: post.city });
                        setUpdateCityModal(true);
                      }}
                    >
                      <Text style={styles.postActionButtonText}>🏙️ City</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Row 4: Facilities */}
                  <View style={styles.doubleButtonRow}>
                    <TouchableOpacity
                      style={[styles.postActionButton, styles.halfWidth]}
                      onPress={() => {
                        setCurrentPostId(post._id);
                        setPostUpdateData({ ...postUpdateData, facilityName: '' });
                        setAddFacilityModal(true);
                      }}
                    >
                      <Text style={styles.postActionButtonText}>➕ Add Facility</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.postActionButton, styles.halfWidth, styles.marginLeft, styles.dangerBg]}
                      onPress={() => {
                        setCurrentPostId(post._id);
                        setPostUpdateData({ ...postUpdateData, facilityId: '' });
                        setDeleteFacilityModal(true);
                      }}
                    >
                      <Text style={styles.dangerButtonText}>🗑️ Delete Facility</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Row 5: Packages */}
                  <View style={styles.doubleButtonRow}>
                    <TouchableOpacity
                      style={[styles.postActionButton, styles.halfWidth]}
                      onPress={() => {
                        setCurrentPostId(post._id);
                        setPostUpdateData({
                          ...postUpdateData,
                          packageName: '',
                          packagePrice: '',
                          packageDuration: '',
                          packageFeatures: [''],
                        });
                        setAddPackageModal(true);
                      }}
                    >
                      <Text style={styles.postActionButtonText}>➕ Add Package</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.postActionButton, styles.halfWidth, styles.marginLeft, styles.dangerBg]}
                      onPress={() => {
                        setCurrentPostId(post._id);
                        setPostUpdateData({ ...postUpdateData, packageId: '' });
                        setDeletePackageModal(true);
                      }}
                    >
                      <Text style={styles.dangerButtonText}>🗑️ Delete Package</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Row 6: Delete Post */}
                  <TouchableOpacity
                    style={[styles.postActionButton, styles.fullWidth, styles.dangerBg]}
                    onPress={() => {
                      setCurrentPostId(post._id);
                      setDeletePostModal(true);
                    }}
                  >
                    <Text style={styles.dangerButtonText}>🗑️ Delete Post</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={handleDeleteGym}
      >
        <Text style={styles.deleteButtonText}>🗑️ Delete Account</Text>
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
            <Text style={styles.modalTitle}>Delete Gym Account</Text>
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

      {/* Update Description Modal */}
      <Modal visible={updateDescriptionModal} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Description</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="Enter description"
              value={postUpdateData.description}
              onChangeText={(text) =>
                setPostUpdateData({ ...postUpdateData, description: text })
              }
              multiline
            />
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleUpdateDescription}
              >
                <Text style={styles.buttonText}>Update</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setUpdateDescriptionModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Update Open Hours Modal */}
      <Modal visible={updateOpenHoursModal} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Open Hours</Text>
            <View style={styles.timeInputRow}>
              <View style={styles.timeInputContainer}>
                <Text style={styles.timeInputLabel}>Hour</Text>
                <TextInput
                  style={[styles.input, styles.timeInput]}
                  placeholder="1-12"
                  value={updateOpenHourHour}
                  onChangeText={(text) => {
                    const num = parseInt(text, 10);
                    if (text === '' || (num >= 1 && num <= 12)) {
                      setUpdateOpenHourHour(text);
                    }
                  }}
                  keyboardType="number-pad"
                  maxLength={2}
                />
              </View>

              <View style={styles.timeInputContainer}>
                <Text style={styles.timeInputLabel}>Min</Text>
                <TextInput
                  style={[styles.input, styles.timeInput]}
                  placeholder="0-59"
                  value={updateOpenHourMinute}
                  onChangeText={(text) => {
                    const num = parseInt(text, 10);
                    if (text === '' || (num >= 0 && num <= 59)) {
                      setUpdateOpenHourMinute(text);
                    }
                  }}
                  keyboardType="number-pad"
                  maxLength={2}
                />
              </View>

              <View style={styles.timeInputContainer}>
                <Text style={styles.timeInputLabel}>Period</Text>
                <View style={styles.periodSelector}>
                  <TouchableOpacity
                    style={[
                      styles.periodButton,
                      updateOpenHourPeriod === 'AM' && styles.periodButtonActive,
                    ]}
                    onPress={() => setUpdateOpenHourPeriod('AM')}
                  >
                    <Text
                      style={[
                        styles.periodButtonText,
                        updateOpenHourPeriod === 'AM' && styles.periodButtonTextActive,
                      ]}
                    >
                      AM
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.periodButton,
                      updateOpenHourPeriod === 'PM' && styles.periodButtonActive,
                    ]}
                    onPress={() => setUpdateOpenHourPeriod('PM')}
                  >
                    <Text
                      style={[
                        styles.periodButtonText,
                        updateOpenHourPeriod === 'PM' && styles.periodButtonTextActive,
                      ]}
                    >
                      PM
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleUpdateOpenHours}
              >
                <Text style={styles.buttonText}>Update</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setUpdateOpenHoursModal(false);
                  setUpdateOpenHourHour('');
                  setUpdateOpenHourMinute('');
                  setUpdateOpenHourPeriod('AM');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Update Close Hours Modal */}
      <Modal visible={updateCloseHoursModal} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Close Hours</Text>
            <View style={styles.timeInputRow}>
              <View style={styles.timeInputContainer}>
                <Text style={styles.timeInputLabel}>Hour</Text>
                <TextInput
                  style={[styles.input, styles.timeInput]}
                  placeholder="1-12"
                  value={updateCloseHourHour}
                  onChangeText={(text) => {
                    const num = parseInt(text, 10);
                    if (text === '' || (num >= 1 && num <= 12)) {
                      setUpdateCloseHourHour(text);
                    }
                  }}
                  keyboardType="number-pad"
                  maxLength={2}
                />
              </View>

              <View style={styles.timeInputContainer}>
                <Text style={styles.timeInputLabel}>Min</Text>
                <TextInput
                  style={[styles.input, styles.timeInput]}
                  placeholder="0-59"
                  value={updateCloseHourMinute}
                  onChangeText={(text) => {
                    const num = parseInt(text, 10);
                    if (text === '' || (num >= 0 && num <= 59)) {
                      setUpdateCloseHourMinute(text);
                    }
                  }}
                  keyboardType="number-pad"
                  maxLength={2}
                />
              </View>

              <View style={styles.timeInputContainer}>
                <Text style={styles.timeInputLabel}>Period</Text>
                <View style={styles.periodSelector}>
                  <TouchableOpacity
                    style={[
                      styles.periodButton,
                      updateCloseHourPeriod === 'AM' && styles.periodButtonActive,
                    ]}
                    onPress={() => setUpdateCloseHourPeriod('AM')}
                  >
                    <Text
                      style={[
                        styles.periodButtonText,
                        updateCloseHourPeriod === 'AM' && styles.periodButtonTextActive,
                      ]}
                    >
                      AM
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.periodButton,
                      updateCloseHourPeriod === 'PM' && styles.periodButtonActive,
                    ]}
                    onPress={() => setUpdateCloseHourPeriod('PM')}
                  >
                    <Text
                      style={[
                        styles.periodButtonText,
                        updateCloseHourPeriod === 'PM' && styles.periodButtonTextActive,
                      ]}
                    >
                      PM
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleUpdateCloseHours}
              >
                <Text style={styles.buttonText}>Update</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setUpdateCloseHoursModal(false);
                  setUpdateCloseHourHour('');
                  setUpdateCloseHourMinute('');
                  setUpdateCloseHourPeriod('PM');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Update Contact Number Modal */}
      <Modal visible={updateContactModal} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Contact Number</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 0701234567"
              value={postUpdateData.contactNumber}
              onChangeText={(text) =>
                setPostUpdateData({ ...postUpdateData, contactNumber: text })
              }
              keyboardType="phone-pad"
            />
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleUpdateContactNumber}
              >
                <Text style={styles.buttonText}>Update</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setUpdateContactModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Update City Modal */}
      <Modal visible={updateCityModal} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update City</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Colombo"
              value={postUpdateData.city}
              onChangeText={(text) =>
                setPostUpdateData({ ...postUpdateData, city: text })
              }
            />
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleUpdateCity}
              >
                <Text style={styles.buttonText}>Update</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setUpdateCityModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Facility Modal */}
      <Modal visible={addFacilityModal} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Facility</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Dumbbells, Treadmills"
              value={postUpdateData.facilityName}
              onChangeText={(text) =>
                setPostUpdateData({ ...postUpdateData, facilityName: text })
              }
            />
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleAddFacility}
              >
                <Text style={styles.buttonText}>Add</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setAddFacilityModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Facility Modal */}
      <Modal visible={deleteFacilityModal} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delete Facility</Text>
            {gymPosts.find(p => p._id === currentPostId)?.gymFasilities.length ? (
              <>
                <Text style={styles.modalDescription}>Select a facility to delete:</Text>
                <ScrollView style={styles.facilityList}>
                  {gymPosts
                    .find(p => p._id === currentPostId)
                    ?.gymFasilities.map((fac: any, idx: number) => (
                      <TouchableOpacity
                        key={idx}
                        style={[
                          styles.facilityOption,
                          postUpdateData.facilityId === fac._id && styles.selectedFacility,
                        ]}
                        onPress={() =>
                          setPostUpdateData({ ...postUpdateData, facilityId: fac._id })
                        }
                      >
                        <Text style={styles.facilityOptionText}>{fac.fasility}</Text>
                      </TouchableOpacity>
                    ))}
                </ScrollView>
              </>
            ) : (
              <Text style={styles.modalDescription}>No facilities available</Text>
            )}
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleDeleteFacility}
              >
                <Text style={styles.buttonText}>Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setDeleteFacilityModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Package Modal */}
      <Modal visible={addPackageModal} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Package</Text>
            <TextInput
              style={styles.input}
              placeholder="Package Name"
              value={postUpdateData.packageName}
              onChangeText={(text) =>
                setPostUpdateData({ ...postUpdateData, packageName: text })
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Price"
              value={postUpdateData.packagePrice}
              onChangeText={(text) =>
                setPostUpdateData({ ...postUpdateData, packagePrice: text })
              }
              keyboardType="decimal-pad"
            />
            <TextInput
              style={styles.input}
              placeholder="Duration e.g., 1 Month"
              value={postUpdateData.packageDuration}
              onChangeText={(text) =>
                setPostUpdateData({ ...postUpdateData, packageDuration: text })
              }
            />
            <Text style={styles.subLabel}>Features</Text>
            {postUpdateData.packageFeatures.map((feature, featureIndex) => (
              <View key={featureIndex} style={styles.itemRow}>
                <TextInput
                  style={[styles.input, styles.flexInput]}
                  placeholder="e.g., Gym Access"
                  value={feature}
                  onChangeText={(text) =>
                    handleUpdatePackageFeature(featureIndex, text)
                  }
                />
                {postUpdateData.packageFeatures.length > 1 && (
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() =>
                      handleRemovePackageFeature(featureIndex)
                    }
                  >
                    <Text style={styles.removeButtonText}>Remove</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
            <TouchableOpacity
              style={styles.addFeatureButton}
              onPress={handleAddPackageFeature}
            >
              <Text style={styles.addButtonText}>+ Add Feature</Text>
            </TouchableOpacity>
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleAddPackage}
              >
                <Text style={styles.buttonText}>Add</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setAddPackageModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Delete Package Modal */}
      <Modal visible={deletePackageModal} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delete Package</Text>
            {gymPosts.find(p => p._id === currentPostId)?.packages.length ? (
              <>
                <Text style={styles.modalDescription}>Select a package to delete:</Text>
                <ScrollView style={styles.facilityList}>
                  {gymPosts
                    .find(p => p._id === currentPostId)
                    ?.packages.map((pkg: any, idx: number) => (
                      <TouchableOpacity
                        key={idx}
                        style={[
                          styles.facilityOption,
                          postUpdateData.packageId === pkg._id && styles.selectedFacility,
                        ]}
                        onPress={() =>
                          setPostUpdateData({ ...postUpdateData, packageId: pkg._id })
                        }
                      >
                        <Text style={styles.facilityOptionText}>
                          {pkg.packageName} - Rs. {pkg.packagePrice}
                        </Text>
                      </TouchableOpacity>
                    ))}
                </ScrollView>
              </>
            ) : (
              <Text style={styles.modalDescription}>No packages available</Text>
            )}
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleDeletePackage}
              >
                <Text style={styles.buttonText}>Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setDeletePackageModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Post Modal */}
      <Modal visible={deletePostModal} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delete Post</Text>
            <Text style={styles.modalDescription}>
              Are you sure you want to delete this post? This action cannot be undone.
            </Text>
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleDeletePost}
              >
                <Text style={styles.buttonText}>Delete Post</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setDeletePostModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Change Image Modal */}
      <Modal visible={changeImageModal} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {currentPostId ? 'Change Gym Image' : 'Change Gym Logo'}
            </Text>
            
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
                onPress={handleUpdateImage}
                disabled={!selectedImageUri || imageLoading}
              >
                <Text style={styles.buttonText}>
                  {imageLoading ? 'Uploading...' : 'Update Image'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setChangeImageModal(false);
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
  logo: {
    fontSize: 60,
    marginBottom: 10,
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
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  value: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
  },
  statsSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 25,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  managementSection: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 15,
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
  actionIcon: {
    fontSize: 28,
    marginRight: 15,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 3,
  },
  actionDescription: {
    fontSize: 12,
    color: '#999',
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
  deleteButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    paddingVertical: 15,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  deleteButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  logoSection: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: 'white',
    marginBottom: 20,
  },
  gymLogo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f0f0',
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
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 15,
    marginBottom: 8,
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
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
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
  actionsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  primaryAction: {
    backgroundColor: '#007AFF',
    flex: 1,
    marginRight: 6,
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
    marginHorizontal: 20,
    marginBottom: 12,
  },
  gymPostSection: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  gymPostHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  gymPostButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    marginHorizontal: 20,
    marginBottom: 12,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'white',
  },
  gymPostButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  gymPostsListSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  postCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  postImage: {
    width: '100%',
    height: 200,
  },
  postContent: {
    padding: 20,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  postGymName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
    textAlign: 'center',
  },
  postCity: {
    fontSize: 16,
    fontWeight: '400',
    color: '#666',
    marginBottom: 10,
    textAlign: 'center',
  },
  postDescription: {
    fontSize: 15,
    color: '#666',
    marginBottom: 12,
    lineHeight: 22,
  },
  postInfoRow: {
    marginBottom: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  postInfo: {
    fontSize: 14,
    color: '#000000',
    marginBottom: 6,
    fontWeight: '500',
  },
  postInfoContact: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
  },
  facilitiesSection: {
    marginTop: 0,
    marginBottom: 0,
    paddingVertical: 0,
  },
  facilityItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  facilityCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  facilityCardItem: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  packagesSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  packageItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  packageName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 6,
  },
  packagePrice: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 8,
  },
  packageDuration: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  packageFeatures: {
    marginTop: 2,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  featureItem: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
  },
  postTime: {
    fontSize: 12,
    color: '#999',
  },
  secondaryActionText: {
    fontSize: 15,
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
  topLogo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
    marginBottom: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSpacer: {
    height: 20,
  },
  postActionsSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  postActionButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  postActionButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
  },
  dangerButtonText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '600',
  },
  fullWidth: {
    width: '100%',
  },
  doubleButtonRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  halfWidth: {
    flex: 1,
  },
  marginLeft: {
    marginLeft: 0,
  },
  dangerBg: {
    backgroundColor: 'white',
    borderColor: '#ddd',
  },
  facilityList: {
    maxHeight: 200,
    marginBottom: 15,
  },
  facilityOption: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#f9f9f9',
  },
  facilityOptionText: {
    fontSize: 14,
    color: '#333',
  },
  selectedFacility: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  imagePickerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f9f9f9',
    height: 225,
    width: 300,
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
  timeInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 10,
    marginTop: 10,
  },
  timeInputContainer: {
    flex: 1,
  },
  timeInputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  timeInput: {
    marginTop: 0,
    marginBottom: 0,
    textAlign: 'center',
    height: 45,
  },
  periodSelector: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fafafa',
    height: 45,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 0,
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  periodButtonActive: {
    backgroundColor: '#007AFF',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  periodButtonTextActive: {
    color: 'white',
  },
  subLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
    marginTop: 10,
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#fafafa',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  flexInput: {
    flex: 1,
    marginRight: 10,
    marginBottom: 0,
    marginTop: 0,
  },
  removeButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  removeButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  addFeatureButton: {
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 15,
  },
  addButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
