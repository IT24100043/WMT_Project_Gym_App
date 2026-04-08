import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';

export default function RegistrationTypeScreen() {
  const router = useRouter();

  const handleUserRegistration = () => {
    router.push({ pathname: '/register', params: { type: 'user' } });
  };

  const handleGymRegistration = () => {
    router.push({ pathname: '/register', params: { type: 'gym' } });
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.headerSection}>
        <Text style={styles.logo}>💪</Text>
        <Text style={styles.title}>Gym Fitness</Text>
        <Text style={styles.subtitle}>Choose Registration Type</Text>
      </View>

      {/* Selection Buttons */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={styles.optionButton}
          onPress={handleUserRegistration}
        >
          <Text style={styles.optionIcon}>🏃</Text>
          <Text style={styles.optionTitle}>Register as User</Text>
          <Text style={styles.optionDescription}>
            Join as a member to access gym facilities
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.optionButton}
          onPress={handleGymRegistration}
        >
          <Text style={styles.optionIcon}>🏋️</Text>
          <Text style={styles.optionTitle}>Register as Gym</Text>
          <Text style={styles.optionDescription}>
            Register your gym to manage members
          </Text>
        </TouchableOpacity>
      </View>

      {/* Already have account link */}
      <View style={styles.footerSection}>
        <Text style={styles.footerText}>Already have an account? </Text>
        <TouchableOpacity onPress={handleBack}>
          <Text style={styles.footerLink}>Login here</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  backButton: {
    paddingVertical: 10,
    maxWidth: 100,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  logo: {
    fontSize: 60,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  buttonsContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 20,
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
  footerSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingBottom: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
  },
  footerLink: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
});
