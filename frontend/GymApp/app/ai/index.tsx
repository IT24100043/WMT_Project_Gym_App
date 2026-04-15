import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { AuthContext } from '@/context/AuthContext';
import { API_ENDPOINTS } from '@/constants/api';

// NOTE: Update this if using different backend URL (e.g., 192.168.1.5:5000)
const API_URL = API_ENDPOINTS.AI_GENERATE_PLAN;

export default function AiFormScreen() {
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);

  // Form State
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('male');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [fitnessGoal, setFitnessGoal] = useState('muscle gain');
  const [experienceLevel, setExperienceLevel] = useState('beginner');
  const [workoutLocation, setWorkoutLocation] = useState('gym');
  const [availableDays, setAvailableDays] = useState('4');
  const [targetArea, setTargetArea] = useState('full body');

  // Image Picker Handler
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  // Take Photo Handler
  const takePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Camera access is required to take a photo');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  // Validation Handler
  const validateForm = (): boolean => {
    if (!imageUri) {
      Alert.alert('Error', 'Please upload a full-body image');
      return false;
    }
    if (!age || !height || !weight) {
      Alert.alert('Error', 'Please fill all required fields');
      return false;
    }
    if (isNaN(parseInt(age)) || isNaN(parseInt(height)) || isNaN(parseInt(weight))) {
      Alert.alert('Error', 'Age, height, and weight must be numbers');
      return false;
    }
    return true;
  };

  // Submit Handler
  const handleGeneratePlan = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      // DEBUG: Log user context
      console.log('🔍 DEBUG - User from AuthContext:', user);
      const userId = user?.id || user?._id || 'testUser123';
      console.log('🔍 DEBUG - userId being sent:', userId);
      console.log('🔍 DEBUG - Image URI:', imageUri);

      // Build FormData for multipart/form-data submission
      const formData = new FormData();
      
      // Add text fields
      formData.append('userId', userId);
      formData.append('age', age);
      formData.append('gender', gender);
      formData.append('height', height);
      formData.append('weight', weight);
      formData.append('fitnessGoal', fitnessGoal);
      formData.append('experienceLevel', experienceLevel);
      formData.append('workoutLocation', workoutLocation);
      formData.append('availableDays', availableDays);
      formData.append('targetArea', targetArea);

      // DEBUG: Log text fields
      console.log('🔍 DEBUG - Text fields added:', {
        userId,
        age,
        gender,
        height,
        weight,
        fitnessGoal,
        experienceLevel,
        workoutLocation,
        availableDays,
        targetArea,
      });

      // Add image file - fetch as Blob for better web compatibility
      try {
        console.log('🔍 DEBUG - Converting image URI to Blob...');
        const response = await fetch(imageUri);
        const blob = await response.blob();
        console.log('🔍 DEBUG - Blob created successfully, size:', blob.size, 'type:', blob.type);
        
        const fileName = imageUri.split('/').pop() || 'image.jpg';
        formData.append('image', blob, fileName);
        console.log('🔍 DEBUG - Image appended to FormData with field name "image", filename:', fileName);
      } catch (blobError: any) {
        console.error('❌ DEBUG - Failed to convert image to Blob:', blobError.message);
        // Fallback: try the original method
        const fileName = imageUri.split('/').pop();
        const fileType = `image/${fileName?.split('.').pop()}`;
        formData.append('image', {
          uri: imageUri,
          name: fileName || 'image.jpg',
          type: fileType,
        } as any);
        console.log('🔍 DEBUG - Fallback: appended image as URI object');
      }

      // Send request
      console.log('🔍 DEBUG - Sending POST request to:', API_URL);
      const res = await fetch(API_URL, {
        method: 'POST',
        body: formData,
        headers: {
          // Note: Do NOT set Content-Type header for FormData
          // React Native and fetch will set it automatically with boundary
        },
      });

      console.log('🔍 DEBUG - Response status:', res.status);
      const data = await res.json();
      console.log('🔍 DEBUG - Response data:', data);

      if (res.ok || res.status === 200 || res.status === 201) {
        // Navigate to result screen with the response data
        router.push({
          pathname: '/ai/result',
          params: {
            data: JSON.stringify(data),
          },
        });
      } else {
        // Show backend error message for debugging
        const errorMessage = data.message || data.error || 'Failed to generate plan';
        console.error('❌ Backend error:', errorMessage);
        Alert.alert('Error (Status ' + res.status + ')', errorMessage);
      }
    } catch (error: any) {
      console.error('❌ Fetch error:', error);
      Alert.alert('Network Error', error.message || 'Unable to connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>{'< Back'}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>AI Workout Plan</Text>
      </View>

      {/* Image Upload Section */}
      <View style={styles.card}>
        <Text style={styles.label}>📸 Full Body Image *</Text>
        <Text style={styles.sublabel}>Upload or take a photo for personalized recommendation</Text>

        {imageUri && (
          <Image source={{ uri: imageUri }} style={styles.imagePreview} />
        )}

        <View style={styles.imageButtonContainer}>
          <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
            <Text style={styles.imageButtonText}>📁 Upload Image</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.imageButton} onPress={takePhoto}>
            <Text style={styles.imageButtonText}>📷 Take Photo</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Personal Info Section */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Personal Information</Text>

        <Text style={styles.label}>Age (years) *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 25"
          keyboardType="numeric"
          value={age}
          onChangeText={setAge}
        />

        <Text style={styles.label}>Gender</Text>
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[styles.optionButton, gender === 'male' && styles.optionButtonActive]}
            onPress={() => setGender('male')}
          >
            <Text style={gender === 'male' ? styles.optionButtonTextActive : styles.optionButtonText}>
              Male
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.optionButton, gender === 'female' && styles.optionButtonActive]}
            onPress={() => setGender('female')}
          >
            <Text style={gender === 'female' ? styles.optionButtonTextActive : styles.optionButtonText}>
              Female
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.optionButton, gender === 'other' && styles.optionButtonActive]}
            onPress={() => setGender('other')}
          >
            <Text style={gender === 'other' ? styles.optionButtonTextActive : styles.optionButtonText}>
              Other
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Height (cm) *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 175"
          keyboardType="numeric"
          value={height}
          onChangeText={setHeight}
        />

        <Text style={styles.label}>Weight (kg) *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 75"
          keyboardType="numeric"
          value={weight}
          onChangeText={setWeight}
        />
      </View>

      {/* Fitness Goals Section */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Fitness Goals</Text>

        <Text style={styles.label}>Fitness Goal</Text>
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[styles.optionButton, fitnessGoal === 'muscle gain' && styles.optionButtonActive]}
            onPress={() => setFitnessGoal('muscle gain')}
          >
            <Text style={fitnessGoal === 'muscle gain' ? styles.optionButtonTextActive : styles.optionButtonText}>
              Muscle Gain
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.optionButton, fitnessGoal === 'weight loss' && styles.optionButtonActive]}
            onPress={() => setFitnessGoal('weight loss')}
          >
            <Text style={fitnessGoal === 'weight loss' ? styles.optionButtonTextActive : styles.optionButtonText}>
              Weight Loss
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.optionButton, fitnessGoal === 'general fitness' && styles.optionButtonActive]}
            onPress={() => setFitnessGoal('general fitness')}
          >
            <Text style={fitnessGoal === 'general fitness' ? styles.optionButtonTextActive : styles.optionButtonText}>
              General Fitness
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Experience Level</Text>
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[styles.optionButton, experienceLevel === 'beginner' && styles.optionButtonActive]}
            onPress={() => setExperienceLevel('beginner')}
          >
            <Text style={experienceLevel === 'beginner' ? styles.optionButtonTextActive : styles.optionButtonText}>
              Beginner
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.optionButton, experienceLevel === 'intermediate' && styles.optionButtonActive]}
            onPress={() => setExperienceLevel('intermediate')}
          >
            <Text style={experienceLevel === 'intermediate' ? styles.optionButtonTextActive : styles.optionButtonText}>
              Intermediate
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.optionButton, experienceLevel === 'advanced' && styles.optionButtonActive]}
            onPress={() => setExperienceLevel('advanced')}
          >
            <Text style={experienceLevel === 'advanced' ? styles.optionButtonTextActive : styles.optionButtonText}>
              Advanced
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Preferences Section */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Preferences</Text>

        <Text style={styles.label}>Workout Location</Text>
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[styles.optionButton, workoutLocation === 'gym' && styles.optionButtonActive]}
            onPress={() => setWorkoutLocation('gym')}
          >
            <Text style={workoutLocation === 'gym' ? styles.optionButtonTextActive : styles.optionButtonText}>
              Gym
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.optionButton, workoutLocation === 'home' && styles.optionButtonActive]}
            onPress={() => setWorkoutLocation('home')}
          >
            <Text style={workoutLocation === 'home' ? styles.optionButtonTextActive : styles.optionButtonText}>
              Home
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Available Days per Week</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 4"
          keyboardType="numeric"
          value={availableDays}
          onChangeText={setAvailableDays}
        />

        <Text style={styles.label}>Target Area</Text>
        <View style={styles.buttonGroupLarge}>
          {['full body', 'upper body', 'lower body', 'core'].map((area) => (
            <TouchableOpacity
              key={area}
              style={[styles.optionButton, targetArea === area && styles.optionButtonActive]}
              onPress={() => setTargetArea(area)}
            >
              <Text style={targetArea === area ? styles.optionButtonTextActive : styles.optionButtonText}>
                {area.charAt(0).toUpperCase() + area.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Submit Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleGeneratePlan}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>🚀 Generate My Plan</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  backBtn: {
    padding: 8,
    marginRight: 10,
  },
  backBtnText: {
    color: '#007BFF',
    fontSize: 14,
    fontWeight: '500',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginTop: 15,
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    marginTop: 5,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 10,
  },
  sublabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#fafafa',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
    resizeMode: 'cover',
  },
  imageButtonContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  imageButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    backgroundColor: '#e8f4f8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007BFF',
    alignItems: 'center',
  },
  imageButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#007BFF',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 5,
  },
  buttonGroupLarge: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 5,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
  },
  optionButtonActive: {
    backgroundColor: '#007BFF',
    borderColor: '#007BFF',
  },
  optionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  optionButtonTextActive: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  buttonContainer: {
    paddingHorizontal: 15,
    marginTop: 10,
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#999',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
