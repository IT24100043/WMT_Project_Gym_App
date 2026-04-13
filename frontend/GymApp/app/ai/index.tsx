import React, { useState, useContext } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Image, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { AuthContext } from '@/context/AuthContext';

const API_URL = 'http://192.168.1.25:5000/api/ai/generate-plan';

const PillSelector = ({ options, selected, onSelect }) => (
  <View style={styles.pillContainer}>
    {options.map(opt => (
      <TouchableOpacity 
        key={opt}
        style={[styles.pillBtn, selected === opt && styles.pillBtnActive]}
        onPress={() => onSelect(opt)}
      >
        <Text style={[styles.pillText, selected === opt && styles.pillTextActive]}>{opt}</Text>
      </TouchableOpacity>
    ))}
  </View>
);

export default function AIFormScreen() {
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

  // Group 1: Basic Info
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');

  // Group 2: Fitness Profile
  const [fitnessGoal, setFitnessGoal] = useState('Muscle Gain');
  const [experienceLevel, setExperienceLevel] = useState('Beginner');
  const [workoutLocation, setWorkoutLocation] = useState('Gym');
  const [availableDays, setAvailableDays] = useState('');
  const [targetArea, setTargetArea] = useState('Full Body');
  
  // Image State
  const [image, setImage] = useState(null);

  const pickImage = async () => {
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

      if (Platform.OS === 'web') {
        const res = await fetch(image.uri);
        const blob = await res.blob();
        formData.append('image', blob, 'upload.jpg');
      } else {
        formData.append('image', { 
            uri: image.uri, 
            name: 'upload.jpg', 
            type: 'image/jpeg' 
        } as any);
      }

      const res = await fetch(API_URL, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      
      if (res.ok) {
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
            <Text style={styles.backBtnText}>{"← Back"}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>AI Planner</Text>
      </View>

      {/* 📸 Upload Physique Section */}
      <View style={styles.card}>
        <Text style={styles.cardHeader}>📸 Upload Full Body Photo</Text>
        <Text style={styles.description}>Please upload a clear full-body image for better recommendation.</Text>
        
        <TouchableOpacity style={styles.imagePickerBtn} onPress={pickImage}>
          {image ? (
             <Image source={{ uri: image.uri }} style={styles.previewImage} />
          ) : (
             <View style={styles.placeholderBox}>
               <Text style={styles.placeholderIcon}>📷</Text>
               <Text style={styles.placeholderText}>Tap to Browse Gallery</Text>
             </View>
          )}
        </TouchableOpacity>
      </View>

      {/* 👤 Basic Info Section */}
      <View style={styles.card}>
        <Text style={styles.cardHeader}>👤 Base Biometrics</Text>
        
        <Text style={styles.label}>Biological Gender</Text>
        <PillSelector options={['Male', 'Female', 'Other']} selected={gender} onSelect={setGender} />

        <View style={styles.row}>
          <View style={[styles.inputGroup, { marginRight: 10 }]}>
            <Text style={styles.label}>Age *</Text>
            <TextInput style={styles.input} keyboardType="numeric" placeholder="e.g. 25" value={age} onChangeText={setAge} />
          </View>
          <View style={[styles.inputGroup, { marginRight: 10 }]}>
            <Text style={styles.label}>Height (cm) *</Text>
            <TextInput style={styles.input} keyboardType="numeric" placeholder="175" value={height} onChangeText={setHeight} />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Weight (kg) *</Text>
            <TextInput style={styles.input} keyboardType="numeric" placeholder="70" value={weight} onChangeText={setWeight} />
          </View>
        </View>
      </View>

      {/* 🎯 Fitness Profile Section */}
      <View style={styles.card}>
        <Text style={styles.cardHeader}>🎯 Target Configuration</Text>

        <Text style={styles.label}>Primary Ambition</Text>
        <PillSelector options={['Muscle Gain', 'Weight Loss', 'Maintenance']} selected={fitnessGoal} onSelect={setFitnessGoal} />

        <Text style={styles.label}>Starting Experience</Text>
        <PillSelector options={['Beginner', 'Intermediate', 'Pro']} selected={experienceLevel} onSelect={setExperienceLevel} />

        <Text style={styles.label}>Where are you training?</Text>
        <PillSelector options={['Gym', 'Home']} selected={workoutLocation} onSelect={setWorkoutLocation} />

        <Text style={styles.label}>What should we target primarily?</Text>
        <PillSelector options={['Full Body', 'Upper Body', 'Lower Body', 'Core']} selected={targetArea} onSelect={setTargetArea} />

        <Text style={styles.label}>Availability (Days Per Week) *</Text>
        <TextInput style={styles.input} placeholder="e.g. 4" keyboardType="numeric" value={availableDays} onChangeText={setAvailableDays} />
      </View>

      <TouchableOpacity style={styles.submitButton} onPress={handleGenerate} disabled={loading}>
          {loading ? <ActivityIndicator color="white" /> : <Text style={styles.submitBtnText}>Initialize Neural Link</Text>}
      </TouchableOpacity>

      <View style={{height: 60}}/>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f3f5', padding: 18, paddingTop: 40 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  backBtn: { paddingRight: 15 },
  backBtnText: { fontSize: 16, color: '#6200EE', fontWeight: 'bold' },
  title: { fontSize: 28, fontWeight: '800', color: '#1f2937' },
  
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 16, marginBottom: 20, shadowColor: '#000', shadowOffset: { width:0, height:3 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  cardHeader: { fontSize: 18, fontWeight: '800', color: '#1f2937', marginBottom: 6 },
  description: { fontSize: 14, color: '#6b7280', marginBottom: 20 },
  
  label: { fontSize: 14, fontWeight: '600', color: '#4b5563', marginBottom: 8, marginTop: 5 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 14, fontSize: 16, backgroundColor: '#f9fafb', color: '#1f2937', marginBottom: 15 },
  
  row: { flexDirection: 'row', marginTop: 5 },
  inputGroup: { flex: 1 },

  pillContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 15 },
  pillBtn: { paddingVertical: 10, paddingHorizontal: 15, borderRadius: 20, backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e7eb' },
  pillBtnActive: { backgroundColor: '#6200EE', borderColor: '#6200EE' },
  pillText: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  pillTextActive: { color: '#ffffff' },

  imagePickerBtn: { alignItems: 'center' },
  placeholderBox: { width: '100%', height: 260, borderWidth: 2, borderStyle: 'dashed', borderColor: '#d1d5db', borderRadius: 16, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' },
  placeholderIcon: { fontSize: 40, marginBottom: 10 },
  placeholderText: { color: '#6b7280', fontWeight: '600', fontSize: 15 },
  previewImage: { width: '100%', height: 350, borderRadius: 16 },

  submitButton: { backgroundColor: '#6200EE', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10, marginBottom: 30, shadowColor: '#6200EE', shadowOffset: { width:0, height:4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 5 },
  submitBtnText: { color: 'white', fontWeight: '800', fontSize: 16, textTransform: 'uppercase', letterSpacing: 1 }
});
