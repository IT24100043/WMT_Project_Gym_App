import React, { useContext, useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AuthContext } from '@/context/AuthContext';
import { API_ENDPOINTS } from '@/constants/api';

export default function CoachPostScreen() {
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    fullName: '',
    description: '',
    experience: '',
    fee: '',
    duration: '',
    contactNumber: '',
  });

  const handleBack = () => {
    router.back();
  };

  const validateForm = () => {
    if (!form.fullName.trim()) {
      Alert.alert('Error', 'Full name is required');
      return false;
    }
    if (!form.description.trim()) {
      Alert.alert('Error', 'Description is required');
      return false;
    }
    if (!form.experience.trim()) {
      Alert.alert('Error', 'Experience is required');
      return false;
    }
    if (!form.fee.trim()) {
      Alert.alert('Error', 'Fee is required');
      return false;
    }
    if (isNaN(parseFloat(form.fee)) || parseFloat(form.fee) <= 0) {
      Alert.alert('Error', 'Fee must be a valid positive number');
      return false;
    }
    if (!form.duration.trim()) {
      Alert.alert('Error', 'Duration is required');
      return false;
    }
    if (!form.contactNumber.trim()) {
      Alert.alert('Error', 'Contact number is required');
      return false;
    }

    // Validate contact number - must be exactly 10 digits
    const cleanedNumber = form.contactNumber.replace(/\D/g, '');
    if (cleanedNumber.length !== 10) {
      Alert.alert('Error', 'Contact number must contain exactly 10 digits');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    try {
      if (!validateForm()) {
        return;
      }

      if (!user?.id) {
        Alert.alert('Error', 'Coach ID not found');
        return;
      }

      setLoading(true);

      const response = await fetch(API_ENDPOINTS.COACHPOST_CREATE(user.id), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullname: form.fullName,
          description: form.description,
          experience: form.experience,
          fee: parseFloat(form.fee),
          duration: form.duration,
          contactNumber: form.contactNumber,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', 'Coach post created successfully!', [
          {
            text: 'OK',
            onPress: () => {
              setForm({
                fullName: '',
                description: '',
                experience: '',
                fee: '',
                duration: '',
                contactNumber: '',
              });
              router.back();
            },
          },
        ]);
      } else {
        Alert.alert('Error', data.message || 'Failed to create coach post');
      }
    } catch (error) {
      console.error('Error creating coach post:', error);
      Alert.alert('Error', 'Failed to create coach post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.formContainer}>
          <Text style={styles.pageTitle}>Create Coach Post</Text>

          {/* Full Name Field */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              placeholderTextColor="#999"
              value={form.fullName}
              onChangeText={(text) => setForm({ ...form, fullName: text })}
              editable={!loading}
            />
          </View>

          {/* Description Field */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textAreaInput]}
              placeholder="Describe your coaching services"
              placeholderTextColor="#999"
              value={form.description}
              onChangeText={(text) => setForm({ ...form, description: text })}
              multiline={true}
              numberOfLines={4}
              editable={!loading}
            />
          </View>

          {/* Experience Field */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Experience</Text>
            <TextInput
              style={[styles.input, styles.textAreaInput]}
              placeholder="Describe your coaching experience"
              placeholderTextColor="#999"
              value={form.experience}
              onChangeText={(text) => setForm({ ...form, experience: text })}
              multiline={true}
              numberOfLines={4}
              editable={!loading}
            />
          </View>

          {/* Fee Field */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Fee</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter coaching fee"
              placeholderTextColor="#999"
              value={form.fee}
              onChangeText={(text) => setForm({ ...form, fee: text })}
              keyboardType="decimal-pad"
              editable={!loading}
            />
          </View>

          {/* Duration Field */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Duration</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 4 weeks, 1 month, 3 months"
              placeholderTextColor="#999"
              value={form.duration}
              onChangeText={(text) => setForm({ ...form, duration: text })}
              editable={!loading}
            />
          </View>

          {/* Contact Number Field */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Contact Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter 10-digit contact number"
              placeholderTextColor="#999"
              value={form.contactNumber}
              onChangeText={(text) => setForm({ ...form, contactNumber: text })}
              keyboardType="phone-pad"
              maxLength={10}
              editable={!loading}
            />
            <Text style={styles.helperText}>Must be exactly 10 digits</Text>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Create Coach Post</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  backButton: {
    paddingVertical: 10,
    maxWidth: 100,
    marginTop: 15,
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  formContainer: {
    flex: 1,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 25,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#000',
    backgroundColor: '#f9f9f9',
  },
  textAreaInput: {
    paddingTop: 10,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    marginTop: 6,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 100,
  },
});
