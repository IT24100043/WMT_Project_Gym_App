import React, { useState, useContext } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Image, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { AuthContext } from '@/context/AuthContext';

const API_URL = 'http://localhost:5000/api/ai/generate-plan';

export default function AIFormScreen() {
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

  // Form State
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [fitnessGoal, setFitnessGoal] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [workoutLocation, setWorkoutLocation] = useState('');
  const [availableDays, setAvailableDays] = useState('');
  const [targetArea, setTargetArea] = useState('');
  
  // Image State
  const [image, setImage] = useState(null);

  const pickImage = async () => {
    // No permissions request is necessary for launching the image library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImage(result.assets[0]);
    }
  };

  const handleGenerate = async () => {
    // Validation
    if (!age || !gender || !height || !weight || !fitnessGoal || !experienceLevel || !workoutLocation || !availableDays || !targetArea) {
      Alert.alert('Error', 'Please fill all required profile fields.');
      return;
    }

    if (!image) {
      Alert.alert('Error', 'A full-body image is required for this feature.');
      return;
    }

    try {
      setLoading(true);
      
      const formData = new FormData();
      
      // Append standard fields
      formData.append('userId', user?.id || user?._id || 'testUser123');
      formData.append('age', age);
      formData.append('gender', gender);
      formData.append('height', height);
      formData.append('weight', weight);
      formData.append('fitnessGoal', fitnessGoal);
      formData.append('experienceLevel', experienceLevel);
      formData.append('workoutLocation', workoutLocation);
      formData.append('availableDays', availableDays);
      formData.append('targetArea', targetArea);

      // Handle Image safely for both Web Emulator and Physical Mobile Device
      if (Platform.OS === 'web') {
        const res = await fetch(image.uri);
        const blob = await res.blob();
        formData.append('image', blob, 'upload.jpg');
      } else {
        // Native React Native behavior
        formData.append('image', { 
            uri: image.uri, 
            name: 'upload.jpg', 
            type: 'image/jpeg' 
        } as any);
      }

      const res = await fetch(API_URL, {
        method: 'POST',
        // IMPORTANT: Let fetch handle the Content-Type automatically for multipart boundary injection
        body: formData,
      });

      const data = await res.json();
      
      if (res.ok) {
        // SUCCESS: Safely pass the JSON specifically encoded string 
        // to avoid Expo Router param mess!
        router.push({
          pathname: '/ai/result',
          params: { planData: JSON.stringify(data) }
        });
      } else {
        Alert.alert('Analysis Failed', data.message || 'The server rejected this request.');
      }
    } catch (error) {
      Alert.alert('Network Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>{"< Back"}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>AI Generation</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionHeader}>Upload Physique</Text>
        <TouchableOpacity style={styles.imagePickerBtn} onPress={pickImage}>
          {image ? (
             <Image source={{ uri: image.uri }} style={styles.previewImage} />
          ) : (
             <View style={styles.placeholderBox}>
               <Text style={styles.placeholderText}>+ Tap to Select Full Body Image</Text>
             </View>
          )}
        </TouchableOpacity>

        <Text style={styles.sectionHeader}>Profile Metrics</Text>
        
        <View style={styles.row}>
          <View style={[styles.inputGroup, { marginRight: 10 }]}>
            <Text style={styles.label}>Age *</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={age} onChangeText={setAge} />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Gender *</Text>
            <TextInput style={styles.input} placeholder="M/F/O" value={gender} onChangeText={setGender} />
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { marginRight: 10 }]}>
            <Text style={styles.label}>Height (cm) *</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={height} onChangeText={setHeight} />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Weight (kg) *</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={weight} onChangeText={setWeight} />
          </View>
        </View>

        <Text style={styles.label}>Fitness Goal *</Text>
        <TextInput style={styles.input} placeholder="e.g. Weight Loss, Muscle Gain" value={fitnessGoal} onChangeText={setFitnessGoal} />

        <Text style={styles.label}>Experience Level *</Text>
        <TextInput style={styles.input} placeholder="Beginner, Intermediate, Pro" value={experienceLevel} onChangeText={setExperienceLevel} />

        <Text style={styles.label}>Workout Location *</Text>
        <TextInput style={styles.input} placeholder="Gym or Home" value={workoutLocation} onChangeText={setWorkoutLocation} />

        <View style={styles.row}>
          <View style={[styles.inputGroup, { marginRight: 10 }]}>
            <Text style={styles.label}>Available Days *</Text>
            <TextInput style={styles.input} placeholder="1-7" keyboardType="numeric" value={availableDays} onChangeText={setAvailableDays} />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Target Area *</Text>
            <TextInput style={styles.input} placeholder="e.g. Full Body" value={targetArea} onChangeText={setTargetArea} />
          </View>
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleGenerate} disabled={loading}>
          {loading ? <ActivityIndicator color="white" /> : <Text style={styles.submitBtnText}>Generate Plan</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20, paddingTop: 40 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backBtn: { paddingRight: 15 },
  backBtnText: { fontSize: 16, color: '#007BFF', fontWeight: 'bold' },
  title: { fontSize: 26, fontWeight: 'bold', color: '#333' },
  card: { backgroundColor: 'white', padding: 20, borderRadius: 12, marginBottom: 50, shadowColor: '#000', shadowOffset: { width:0, height:2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  sectionHeader: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15, marginTop: 10 },
  label: { fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 5 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 15, backgroundColor: '#fafafa' },
  row: { flexDirection: 'row' },
  inputGroup: { flex: 1 },
  
  // Image Picker specific styling
  imagePickerBtn: { marginBottom: 20, alignItems: 'center' },
  placeholderBox: { width: 200, height: 266, borderWidth: 2, borderStyle: 'dashed', borderColor: '#ccc', borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fafafa' },
  placeholderText: { color: '#888', fontWeight: '600' },
  previewImage: { width: 200, height: 266, borderRadius: 12 },

  submitButton: { backgroundColor: '#6200EE', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  submitBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});
