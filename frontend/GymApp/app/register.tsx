import React, { useState } from 'react';
import { StyleSheet, TextInput, ScrollView, View, Text, TouchableOpacity, Alert, Image, KeyboardAvoidingView, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { API_ENDPOINTS } from '@/constants/api';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

export default function RegisterScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [uploading, setUploading] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [registrationType, setRegistrationType] = useState<'gym' | 'user' | 'coach' | 'admin' | null>(
    (params.type as 'gym' | 'user' | 'coach' | 'admin') || null
  );
  const source = params.from as string || 'registration-type';
  const [showGymPassword, setShowGymPassword] = useState(false);
  const [showGymConfirmPassword, setShowGymConfirmPassword] = useState(false);
  const [showUserPassword, setShowUserPassword] = useState(false);
  const [showUserConfirmPassword, setShowUserConfirmPassword] = useState(false);
  const [showCoachPassword, setShowCoachPassword] = useState(false);
  const [showCoachConfirmPassword, setShowCoachConfirmPassword] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [showAdminConfirmPassword, setShowAdminConfirmPassword] = useState(false);

  // Gym Registration Form Data
  const [gymFormData, setGymFormData] = useState({
    GymName: '',
    registrationNumber: '',
    OwnerName: '',
    OwnerNIC: '',
    Address: '',
    ownerContactNumber: '',
    gymType: '',
    email: '',
    password: '',
    confirmPassword: '',
    logoUrl: '',
    role: 'gym'
  });

  // User Registration Form Data
  const [userFormData, setUserFormData] = useState({
    name: '',
    age: '',
    userNICcardNumber: '',
    userContactNumber: '',
    userEmail: '',
    password: '',
    confirmPassword: '',
    dpUrl: '',
    role: 'user'
  });

  // Coach Registration Form Data
  const [coachFormData, setCoachFormData] = useState({
    coachName: '',
    coachAge: '',
    coachNICcardNumber: '',
    coachId: '',
    coachContactNumber: '',
    coachEmail: '',
    password: '',
    confirmPassword: '',
    dpUrl: '',
    role: 'coach'
  });

  // Admin Registration Form Data
  const [adminFormData, setAdminFormData] = useState({
    adminName: '',
    adminAge: '',
    adminNICcardNumber: '',
    adminContactNumber: '',
    adminEmail: '',
    password: '',
    confirmPassword: '',
    dpUrl: '',
    role: 'admin'
  });

  // Function to pick an image from gallery
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      uploadToCloudinary(result.assets[0].uri);
    }
  };

  // Function to upload image to Cloudinary and get the URL
  const uploadToCloudinary = async (uri: string) => {
    setUploading(true);
    const data = new FormData();

    const fileName = registrationType === 'gym' ? 'logo.jpg' : 'profile.jpg';
    const preset = registrationType === 'gym' ? 'gym_logo' : 'gym_logo'; // Use same preset for both

    // @ts-ignore
    data.append('file', { uri, type: 'image/jpeg', name: fileName });
    data.append('upload_preset', preset);
    data.append('cloud_name', 'dcahmv4lj');

    try {
      const res = await fetch('https://api.cloudinary.com/v1_1/dcahmv4lj/image/upload', {
        method: 'POST',
        body: data,
      });
      const file = await res.json();

      if (!file.secure_url) {
        Alert.alert("Error", "Image upload failed: No URL returned");
        setUploading(false);
        return;
      }

      if (registrationType === 'gym') {
        setGymFormData((prev) => ({ ...prev, logoUrl: file.secure_url }));
      } else if (registrationType === 'user') {
        setUserFormData((prev) => ({ ...prev, dpUrl: file.secure_url }));
      } else if (registrationType === 'coach') {
        setCoachFormData((prev) => ({ ...prev, dpUrl: file.secure_url }));
      } else if (registrationType === 'admin') {
        setAdminFormData((prev) => ({ ...prev, dpUrl: file.secure_url }));
      }
    } catch (err) {
      Alert.alert("Error", "Image upload failed: " + (err as any).message);
    } finally {
      setUploading(false);
    }
  };

  const resetFormData = () => {
    setGymFormData({
      GymName: '',
      registrationNumber: '',
      OwnerName: '',
      OwnerNIC: '',
      Address: '',
      ownerContactNumber: '',
      gymType: '',
      email: '',
      password: '',
      confirmPassword: '',
      logoUrl: '',
      role: 'gym'
    });
    setUserFormData({
      name: '',
      age: '',
      userNICcardNumber: '',
      userContactNumber: '',
      userEmail: '',
      password: '',
      confirmPassword: '',
      dpUrl: '',
      role: 'user'
    });
    setCoachFormData({
      coachName: '',
      coachAge: '',
      coachNICcardNumber: '',
      coachId: '',
      coachContactNumber: '',
      coachEmail: '',
      password: '',
      confirmPassword: '',
      dpUrl: '',
      role: 'coach'
    });
    setAdminFormData({
      adminName: '',
      adminAge: '',
      adminNICcardNumber: '',
      adminContactNumber: '',
      adminEmail: '',
      password: '',
      confirmPassword: '',
      dpUrl: '',
      role: 'admin'
    });
    setImageUri(null);
  };

  // Validation function for contact number
  const validateContactNumber = (contactNumber: string): boolean => {
    const cleanedNumber = contactNumber.replace(/\D/g, '');
    return cleanedNumber.length === 10;
  };

  const handleRegister = async () => {
    if (registrationType === 'gym') {
      await handleGymRegister();
    } else if (registrationType === 'coach') {
      await handleCoachRegister();
    } else if (registrationType === 'admin') {
      await handleAdminRegister();
    } else {
      await handleUserRegister();
    }
  };

  const handleGymRegister = async () => {
    // Validation
    if (!gymFormData.GymName || !gymFormData.registrationNumber || !gymFormData.OwnerName ||
      !gymFormData.OwnerNIC || !gymFormData.Address || !gymFormData.ownerContactNumber ||
      !gymFormData.gymType || !gymFormData.email || !gymFormData.password) {
      return Alert.alert("Error", "Please fill all fields");
    }

    // Contact number validation
    if (!validateContactNumber(gymFormData.ownerContactNumber)) {
      return Alert.alert("Error", "Contact number must contain exactly 10 digits");
    }

    // Password validation
    if (gymFormData.password !== gymFormData.confirmPassword) {
      return Alert.alert("Error", "Passwords do not match");
    }

    if (gymFormData.password.length < 6) {
      return Alert.alert("Error", "Password must be at least 6 characters");
    }

    // Remove confirmPassword before sending to backend
    const { confirmPassword, ...dataToSend } = gymFormData;

    try {
      console.log("Sending gym registration data:", dataToSend);
      const response = await axios.post(API_ENDPOINTS.GYM_REGISTER, dataToSend);
      if (response.status === 201) {
        Alert.alert("Success", "Gym Registered Successfully!");
        router.replace('/login');
      }
    } catch (error: any) {
      console.log("Gym registration full error:", error.response?.data || error.message);
      const errorMsg = error.response?.data?.message || error.message || "Registration Failed";
      Alert.alert("❌ Registration Failed", errorMsg, [
        { text: "OK", onPress: () => { } }
      ]);
    }
  };

  const handleUserRegister = async () => {
    // Validation
    if (!userFormData.name || !userFormData.age || !userFormData.userNICcardNumber ||
      !userFormData.userContactNumber || !userFormData.userEmail || !userFormData.password) {
      return Alert.alert("Error", "Please fill all fields");
    }

    // Contact number validation
    if (!validateContactNumber(userFormData.userContactNumber)) {
      return Alert.alert("Error", "Contact number must contain exactly 10 digits");
    }

    // Password validation
    if (userFormData.password !== userFormData.confirmPassword) {
      return Alert.alert("Error", "Passwords do not match");
    }

    if (userFormData.password.length < 6) {
      return Alert.alert("Error", "Password must be at least 6 characters");
    }

    // Remove confirmPassword before sending to backend
    const { confirmPassword, ...dataToSend } = userFormData;

    try {
      console.log("Sending user registration data:", dataToSend);
      const response = await axios.post(API_ENDPOINTS.USER_REGISTER, dataToSend);
      if (response.status === 201) {
        Alert.alert("Success", "User Registered Successfully!");
        router.replace('/login');
      }
    } catch (error: any) {
      console.log("User registration error:", error);
      const errorMsg = error.response?.data?.message || error.message || "Registration Failed";
      Alert.alert("Error", errorMsg);
    }
  };

  const handleCoachRegister = async () => {
    // Validation
    if (!coachFormData.coachName || !coachFormData.coachAge || !coachFormData.coachNICcardNumber ||
      !coachFormData.coachId || !coachFormData.coachContactNumber || !coachFormData.coachEmail || !coachFormData.password) {
      return Alert.alert("Error", "Please fill all fields");
    }

    // Contact number validation
    if (!validateContactNumber(coachFormData.coachContactNumber)) {
      return Alert.alert("Error", "Contact number must contain exactly 10 digits");
    }

    // Password validation
    if (coachFormData.password !== coachFormData.confirmPassword) {
      return Alert.alert("Error", "Passwords do not match");
    }

    if (coachFormData.password.length < 6) {
      return Alert.alert("Error", "Password must be at least 6 characters");
    }

    // Remove confirmPassword before sending to backend
    const { confirmPassword, ...dataToSend } = coachFormData;

    try {
      console.log("Sending coach registration data:", dataToSend);
      const response = await axios.post(API_ENDPOINTS.COACH_REGISTER, dataToSend);
      if (response.status === 201) {
        Alert.alert("Success", "Coach Registered Successfully!");
        router.replace('/login');
      }
    } catch (error: any) {
      console.log("Coach registration error:", error);
      const errorMsg = error.response?.data?.message || error.message || "Registration Failed";
      Alert.alert("Error", errorMsg);
    }
  };

  const handleAdminRegister = async () => {
    // Validation
    if (!adminFormData.adminName || !adminFormData.adminAge || !adminFormData.adminNICcardNumber ||
      !adminFormData.adminContactNumber || !adminFormData.adminEmail || !adminFormData.password) {
      return Alert.alert("Error", "Please fill all fields");
    }

    // Contact number validation
    if (!validateContactNumber(adminFormData.adminContactNumber)) {
      return Alert.alert("Error", "Contact number must contain exactly 10 digits");
    }

    // Password validation
    if (adminFormData.password !== adminFormData.confirmPassword) {
      return Alert.alert("Error", "Passwords do not match");
    }

    if (adminFormData.password.length < 6) {
      return Alert.alert("Error", "Password must be at least 6 characters");
    }

    // Remove confirmPassword before sending to backend
    const { confirmPassword, ...dataToSend } = adminFormData;

    try {
      console.log("Sending admin registration data:", dataToSend);
      const response = await axios.post(API_ENDPOINTS.ADMIN_REGISTER, dataToSend);
      if (response.status === 201) {
        Alert.alert("Success", "Admin Registered Successfully!");
        router.replace('/login');
      }
    } catch (error: any) {
      console.log("Admin registration error:", error);
      const errorMsg = error.response?.data?.message || error.message || "Registration Failed";
      Alert.alert("Error", errorMsg);
    }
  };

  return (
    registrationType === null ? (
      // Selection Screen
      <View style={styles.selectionContainer}>
        <Text style={styles.selectionHeader}>Welcome to Gym Fitness</Text>
        <Text style={styles.selectionSubtitle}>Choose Registration Type</Text>

        <TouchableOpacity
          style={styles.selectionButton}
          onPress={() => {
            resetFormData();
            setRegistrationType('user');
          }}
        >
          <Text style={styles.selectionButtonTitle}>🏃 Register as User</Text>
          <Text style={styles.selectionButtonDescription}>Join as a member to access gym facilities</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.selectionButton}
          onPress={() => {
            resetFormData();
            setRegistrationType('gym');
          }}
        >
          <Text style={styles.selectionButtonTitle}>🏋️ Register as Gym</Text>
          <Text style={styles.selectionButtonDescription}>Register your gym to manage members</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.selectionButton}
          onPress={() => {
            resetFormData();
            setRegistrationType('coach');
          }}
        >
          <Text style={styles.selectionButtonTitle}>👨‍🏫 Register as Coach</Text>
          <Text style={styles.selectionButtonDescription}>Join as a coach to guide and train members</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.selectionButton}
          onPress={() => {
            resetFormData();
            setRegistrationType('admin');
          }}
        >
          <Text style={styles.selectionButtonTitle}>👨‍💼 Register as Admin</Text>
          <Text style={styles.selectionButtonDescription}>Join as an admin to manage the platform</Text>
        </TouchableOpacity>
      </View>
    ) : (
      // Registration Form Screen
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoidingContainer}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (source === 'admin-home') {
                router.back();
              } else {
                router.replace('/registration-type');
              }
            }}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>

          <Text style={styles.header}>
            {registrationType === 'gym' ? 'Gym Registration' : registrationType === 'coach' ? 'Coach Registration' : registrationType === 'admin' ? 'Admin Registration' : 'User Registration'}
          </Text>

          {/* GYM REGISTRATION FORM */}
          {registrationType === 'gym' && (
            <>
              {/* Logo Upload Section */}
              <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                {imageUri ? (
                  <Image source={{ uri: imageUri }} style={styles.logoPreview} />
                ) : (
                  <Text style={styles.imagePickerText}>{uploading ? "Uploading..." : "Click to Upload Logo"}</Text>
                )}
              </TouchableOpacity>

              {/* Gym Input Fields */}
              <TextInput
                style={styles.input}
                placeholder="Gym Name"
                onChangeText={(val) => setGymFormData({ ...gymFormData, GymName: val })}
                value={gymFormData.GymName}
                placeholderTextColor="#999"
              />
              <TextInput
                style={styles.input}
                placeholder="Gym Registration Number"
                onChangeText={(val) => setGymFormData({ ...gymFormData, registrationNumber: val })}
                value={gymFormData.registrationNumber}
                placeholderTextColor="#999"
              />
              <TextInput
                style={styles.input}
                placeholder="Owner Name"
                onChangeText={(val) => setGymFormData({ ...gymFormData, OwnerName: val })}
                value={gymFormData.OwnerName}
                placeholderTextColor="#999"
              />
              <TextInput
                style={styles.input}
                placeholder="Owner NIC"
                onChangeText={(val) => setGymFormData({ ...gymFormData, OwnerNIC: val })}
                value={gymFormData.OwnerNIC}
                placeholderTextColor="#999"
              />
              <TextInput
                style={styles.input}
                placeholder="Address"
                multiline
                numberOfLines={3}
                onChangeText={(val) => setGymFormData({ ...gymFormData, Address: val })}
                value={gymFormData.Address}
                placeholderTextColor="#999"
              />
              <TextInput
                style={styles.input}
                placeholder="Contact Number"
                keyboardType="phone-pad"
                onChangeText={(val) => setGymFormData({ ...gymFormData, ownerContactNumber: val })}
                value={gymFormData.ownerContactNumber}
                placeholderTextColor="#999"
              />
              <TextInput
                style={styles.input}
                placeholder="Gym Type"
                onChangeText={(val) => setGymFormData({ ...gymFormData, gymType: val })}
                value={gymFormData.gymType}
                placeholderTextColor="#999"
              />
              <TextInput
                style={styles.input}
                placeholder="Email"
                keyboardType="email-address"
                autoCapitalize="none"
                onChangeText={(val) => setGymFormData({ ...gymFormData, email: val })}
                value={gymFormData.email}
                placeholderTextColor="#999"
              />
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Password"
                  secureTextEntry={!showGymPassword}
                  onChangeText={(val) => setGymFormData({ ...gymFormData, password: val })}
                  value={gymFormData.password}
                  placeholderTextColor="#999"
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowGymPassword(!showGymPassword)}
                >
                  <MaterialCommunityIcons
                    name={showGymPassword ? 'eye' : 'eye-off'}
                    size={24}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Confirm Password"
                  secureTextEntry={!showGymConfirmPassword}
                  onChangeText={(val) => setGymFormData({ ...gymFormData, confirmPassword: val })}
                  value={gymFormData.confirmPassword}
                  placeholderTextColor="#999"
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowGymConfirmPassword(!showGymConfirmPassword)}
                >
                  <MaterialCommunityIcons
                    name={showGymConfirmPassword ? 'eye' : 'eye-off'}
                    size={24}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* USER REGISTRATION FORM */}
          {registrationType === 'user' && (
            <>
              {/* Profile Picture Upload Section */}
              <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                {imageUri ? (
                  <Image source={{ uri: imageUri }} style={styles.logoPreview} />
                ) : (
                  <Text style={styles.imagePickerText}>{uploading ? "Uploading..." : "Click to Upload Photo"}</Text>
                )}
              </TouchableOpacity>

              {/* User Input Fields */}
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                onChangeText={(val) => setUserFormData({ ...userFormData, name: val })}
                value={userFormData.name}
                placeholderTextColor="#999"
              />
              <TextInput
                style={styles.input}
                placeholder="Age"
                keyboardType="numeric"
                onChangeText={(val) => setUserFormData({ ...userFormData, age: val })}
                value={userFormData.age}
                placeholderTextColor="#999"
              />
              <TextInput
                style={styles.input}
                placeholder="NIC Card Number"
                onChangeText={(val) => setUserFormData({ ...userFormData, userNICcardNumber: val })}
                value={userFormData.userNICcardNumber}
                placeholderTextColor="#999"
              />
              <TextInput
                style={styles.input}
                placeholder="Contact Number"
                keyboardType="phone-pad"
                onChangeText={(val) => setUserFormData({ ...userFormData, userContactNumber: val })}
                value={userFormData.userContactNumber}
                placeholderTextColor="#999"
              />
              <TextInput
                style={styles.input}
                placeholder="Email"
                keyboardType="email-address"
                autoCapitalize="none"
                onChangeText={(val) => setUserFormData({ ...userFormData, userEmail: val })}
                value={userFormData.userEmail}
                placeholderTextColor="#999"
              />
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Password"
                  secureTextEntry={!showUserPassword}
                  onChangeText={(val) => setUserFormData({ ...userFormData, password: val })}
                  value={userFormData.password}
                  placeholderTextColor="#999"
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowUserPassword(!showUserPassword)}
                >
                  <MaterialCommunityIcons
                    name={showUserPassword ? 'eye' : 'eye-off'}
                    size={24}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Confirm Password"
                  secureTextEntry={!showUserConfirmPassword}
                  onChangeText={(val) => setUserFormData({ ...userFormData, confirmPassword: val })}
                  value={userFormData.confirmPassword}
                  placeholderTextColor="#999"
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowUserConfirmPassword(!showUserConfirmPassword)}
                >
                  <MaterialCommunityIcons
                    name={showUserConfirmPassword ? 'eye' : 'eye-off'}
                    size={24}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* COACH REGISTRATION FORM */}
          {registrationType === 'coach' && (
            <>
              {/* Profile Picture Upload Section */}
              <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                {imageUri ? (
                  <Image source={{ uri: imageUri }} style={styles.logoPreview} />
                ) : (
                  <Text style={styles.imagePickerText}>{uploading ? "Uploading..." : "Click to Upload Photo"}</Text>
                )}
              </TouchableOpacity>

              {/* Coach Input Fields */}
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                onChangeText={(val) => setCoachFormData({ ...coachFormData, coachName: val })}
                value={coachFormData.coachName}
                placeholderTextColor="#999"
              />
              <TextInput
                style={styles.input}
                placeholder="Age"
                keyboardType="numeric"
                onChangeText={(val) => setCoachFormData({ ...coachFormData, coachAge: val })}
                value={coachFormData.coachAge}
                placeholderTextColor="#999"
              />
              <TextInput
                style={styles.input}
                placeholder="NIC Card Number"
                onChangeText={(val) => setCoachFormData({ ...coachFormData, coachNICcardNumber: val })}
                value={coachFormData.coachNICcardNumber}
                placeholderTextColor="#999"
              />
              <TextInput
                style={styles.input}
                placeholder="Coach ID"
                onChangeText={(val) => setCoachFormData({ ...coachFormData, coachId: val })}
                value={coachFormData.coachId}
                placeholderTextColor="#999"
              />
              <TextInput
                style={styles.input}
                placeholder="Contact Number"
                keyboardType="phone-pad"
                onChangeText={(val) => setCoachFormData({ ...coachFormData, coachContactNumber: val })}
                value={coachFormData.coachContactNumber}
                placeholderTextColor="#999"
              />
              <TextInput
                style={styles.input}
                placeholder="Email"
                keyboardType="email-address"
                autoCapitalize="none"
                onChangeText={(val) => setCoachFormData({ ...coachFormData, coachEmail: val })}
                value={coachFormData.coachEmail}
                placeholderTextColor="#999"
              />
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Password"
                  secureTextEntry={!showCoachPassword}
                  onChangeText={(val) => setCoachFormData({ ...coachFormData, password: val })}
                  value={coachFormData.password}
                  placeholderTextColor="#999"
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowCoachPassword(!showCoachPassword)}
                >
                  <MaterialCommunityIcons
                    name={showCoachPassword ? 'eye' : 'eye-off'}
                    size={24}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Confirm Password"
                  secureTextEntry={!showCoachConfirmPassword}
                  onChangeText={(val) => setCoachFormData({ ...coachFormData, confirmPassword: val })}
                  value={coachFormData.confirmPassword}
                  placeholderTextColor="#999"
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowCoachConfirmPassword(!showCoachConfirmPassword)}
                >
                  <MaterialCommunityIcons
                    name={showCoachConfirmPassword ? 'eye' : 'eye-off'}
                    size={24}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* ADMIN REGISTRATION FORM */}
          {registrationType === 'admin' && (
            <>
              {/* Profile Picture Upload Section */}
              <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                {imageUri ? (
                  <Image source={{ uri: imageUri }} style={styles.logoPreview} />
                ) : (
                  <Text style={styles.imagePickerText}>{uploading ? "Uploading..." : "Click to Upload Photo"}</Text>
                )}
              </TouchableOpacity>

              {/* Admin Input Fields */}
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                onChangeText={(val) => setAdminFormData({ ...adminFormData, adminName: val })}
                value={adminFormData.adminName}
                placeholderTextColor="#999"
              />
              <TextInput
                style={styles.input}
                placeholder="Age"
                keyboardType="numeric"
                onChangeText={(val) => setAdminFormData({ ...adminFormData, adminAge: val })}
                value={adminFormData.adminAge}
                placeholderTextColor="#999"
              />
              <TextInput
                style={styles.input}
                placeholder="NIC Card Number"
                onChangeText={(val) => setAdminFormData({ ...adminFormData, adminNICcardNumber: val })}
                value={adminFormData.adminNICcardNumber}
                placeholderTextColor="#999"
              />
              <TextInput
                style={styles.input}
                placeholder="Contact Number"
                keyboardType="phone-pad"
                onChangeText={(val) => setAdminFormData({ ...adminFormData, adminContactNumber: val })}
                value={adminFormData.adminContactNumber}
                placeholderTextColor="#999"
              />
              <TextInput
                style={styles.input}
                placeholder="Email"
                keyboardType="email-address"
                autoCapitalize="none"
                onChangeText={(val) => setAdminFormData({ ...adminFormData, adminEmail: val })}
                value={adminFormData.adminEmail}
                placeholderTextColor="#999"
              />
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Password"
                  secureTextEntry={!showAdminPassword}
                  onChangeText={(val) => setAdminFormData({ ...adminFormData, password: val })}
                  value={adminFormData.password}
                  placeholderTextColor="#999"
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowAdminPassword(!showAdminPassword)}
                >
                  <MaterialCommunityIcons
                    name={showAdminPassword ? 'eye' : 'eye-off'}
                    size={24}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Confirm Password"
                  secureTextEntry={!showAdminConfirmPassword}
                  onChangeText={(val) => setAdminFormData({ ...adminFormData, confirmPassword: val })}
                  value={adminFormData.confirmPassword}
                  placeholderTextColor="#999"
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowAdminConfirmPassword(!showAdminConfirmPassword)}
                >
                  <MaterialCommunityIcons
                    name={showAdminConfirmPassword ? 'eye' : 'eye-off'}
                    size={24}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>
            </>
          )}

          <TouchableOpacity
            style={styles.button}
            onPress={handleRegister}
          >
            <Text style={styles.buttonText}>Register Now</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    )
  );
}

const styles = StyleSheet.create({
  selectionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  selectionHeader: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a73e8',
    marginBottom: 10,
    textAlign: 'center',
  },
  selectionSubtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 40,
    textAlign: 'center',
  },
  selectionButton: {
    width: '100%',
    backgroundColor: '#f8f9fa',
    borderRadius: 15,
    padding: 25,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  selectionButtonTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a73e8',
    marginBottom: 8,
  },
  selectionButtonDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },
  container: {
    padding: 20,
    paddingTop: 15,
    paddingBottom: 40,
    backgroundColor: '#fff'
  },
  backButton: {
    paddingVertical: 10,
    marginBottom: 20,
    marginTop: 15,
  },
  backButtonText: {
    fontSize: 16,
    color: '#1a73e8',
    fontWeight: '600',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 25,
    color: '#333',
    textAlign: 'center'
  },
  imagePicker: {
    height: 120,
    width: 120,
    backgroundColor: '#f0f2f5',
    borderRadius: 60,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
    borderWidth: 2,
    borderColor: '#ddd',
    overflow: 'hidden'
  },
  imagePickerText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  logoPreview: {
    width: '100%',
    height: '100%'
  },
  input: {
    backgroundColor: '#f0f2f5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  passwordInput: {
    flex: 1,
    padding: 15,
    fontSize: 16,
    color: '#333',
  },
  passwordToggle: {
    paddingHorizontal: 15,
    paddingVertical: 15,
  },
  button: {
    backgroundColor: '#1a73e8',
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold'
  }
});