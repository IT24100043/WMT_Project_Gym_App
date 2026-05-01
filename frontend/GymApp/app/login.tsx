import React, { useState, useContext } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  Text,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AuthContext } from '@/context/AuthContext';
import LoadingScreen from '@/components/LoadingScreen';
import { API_ENDPOINTS } from '@/constants/api';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isCheckingRole, setIsCheckingRole] = useState(false);

  const detectUserRole = async (userEmail: string): Promise<'user' | 'gym' | 'coach' | 'admin' | null> => {
    try {
      // Try to get gym role first
      const gymRoleResponse = await fetch(API_ENDPOINTS.GYM_ROLE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: userEmail }),
      });

      if (gymRoleResponse.ok) {
        const gymData = await gymRoleResponse.json();
        return gymData.role as 'gym';
      }

      // If gym not found, try admin role
      const adminRoleResponse = await fetch(API_ENDPOINTS.ADMIN_ROLE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ adminEmail: userEmail }),
      });

      if (adminRoleResponse.ok) {
        const adminData = await adminRoleResponse.json();
        return adminData.role as 'admin';
      }

      // If gym and admin not found, try coach role
      const coachRoleResponse = await fetch(API_ENDPOINTS.COACH_ROLE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ coachEmail: userEmail }),
      });

      if (coachRoleResponse.ok) {
        const coachData = await coachRoleResponse.json();
        return coachData.role as 'coach';
      }

      // If gym, admin and coach not found, try user role
      const userRoleResponse = await fetch(API_ENDPOINTS.USER_ROLE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userEmail: userEmail }),
      });

      if (userRoleResponse.ok) {
        const userData = await userRoleResponse.json();
        return userData.role as 'user';
      }

      return null;
    } catch (error) {
      console.error('Error detecting role:', error);
      return null;
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setIsCheckingRole(true);

      // Detect user role
      const detectedRole = await detectUserRole(email);

      if (!detectedRole) {
        Alert.alert('Error', 'Email not found in the system');
        setIsCheckingRole(false);
        return;
      }

      setIsCheckingRole(false);

      // Login with detected role
      await login(email, password, detectedRole);
      // Navigation handled by _layout based on auth state
    } catch (error: any) {
      setIsCheckingRole(false);
      // Show error alert and stay on login page
      Alert.alert('Login Failed', 'Invalid credentials');
    }
  };

  // Show loading screen when logging in
  if (isLoading) {
    return <LoadingScreen message="Logging in..." />;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      style={styles.container}
      enabled
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.headerSection}>
          <Text style={styles.logo}>💪</Text>
          <Text style={styles.title}>Gym Fitness</Text>
          <Text style={styles.subtitle}>Login to Your Account</Text>
        </View>

        {/* Email Input */}
        <TextInput
          style={styles.input}
          placeholder="Email "
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!isLoading && !isCheckingRole}
        />

        {/* Password Input */}
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Password"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            editable={!isLoading && !isCheckingRole}
          />
          <TouchableOpacity
            style={styles.passwordToggle}
            onPress={() => setShowPassword(!showPassword)}
            disabled={!isLoading && isCheckingRole}
          >
            <MaterialCommunityIcons
              name={showPassword ? 'eye' : 'eye-off'}
              size={24}
              color="#666"
            />
          </TouchableOpacity>
        </View>

        {/* Login Button */}
        <TouchableOpacity
          style={[styles.loginButton, (isLoading || isCheckingRole) && styles.loginButtonDisabled]}
          onPress={handleLogin}
          disabled={isLoading || isCheckingRole}
        >
          {isLoading || isCheckingRole ? (
            <View style={styles.buttonContent}>
              <ActivityIndicator color="white" size="small" style={styles.spinner} />
              <Text style={styles.loginButtonText}>
                {isCheckingRole ? 'Verifying...' : 'Logging in...'}
              </Text>
            </View>
          ) : (
            <Text style={styles.loginButtonText}>Login</Text>
          )}
        </TouchableOpacity>

        {/* Register Link */}
        <View style={styles.registerSection}>
          <Text style={styles.registerText}>Don&apos;t have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/registration-type')}>
            <Text style={styles.registerLink}>Register Now</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 40,
    justifyContent: 'center',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 40,
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
    fontSize: 14,
    color: '#666',
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 15,
    marginBottom: 15,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#ddd',
    color: '#333',
  },
  passwordContainer: {
    position: 'relative',
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 15,
    fontSize: 14,
    color: '#333',
  },
  passwordToggle: {
    paddingHorizontal: 15,
    paddingVertical: 15,
  },
  loginButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 15,
    marginBottom: 20,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    marginRight: 10,
  },
  loginButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  registerSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  registerText: {
    fontSize: 14,
    color: '#666',
  },
  registerLink: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
});
