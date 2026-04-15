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

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isCheckingRole, setIsCheckingRole] = useState(false);

  const detectUserRole = async (userEmail: string): Promise<'user' | 'gym' | null> => {
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

      // If gym not found, try user role
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
      // Error handled silently
    }
  };

  // Demo Login - For Testing Only
  const handleDemoLogin = async () => {
    try {
      await login('testuser@gym.com', 'test123', 'user');
    } catch (error: any) {
      Alert.alert('Demo Login Failed', 'Please make sure backend is running');
    }
  };

  // Show loading screen when logging in
  if (isLoading) {
    return <LoadingScreen message="Logging in..." />;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.headerSection}>
          <Text style={styles.logo}>💪</Text>
          <Text style={styles.title}>Gym Fitness</Text>
          <Text style={styles.subtitle}>Login to Your Account</Text>
        </View>

        {/* Email Input */}
        <TextInput
          testID="login-email-input"
          style={styles.input}
          placeholder="Email (User or Gym)"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!isLoading && !isCheckingRole}
        />

        {/* Password Input */}
        <TextInput
          testID="login-password-input"
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!isLoading && !isCheckingRole}
        />

        {/* Login Button */}
        <TouchableOpacity
          testID="login-button"
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

        {/* Demo Login Button */}
        <TouchableOpacity
          testID="login-demo-button"
          style={styles.demoButton}
          onPress={handleDemoLogin}
        >
          <Text style={styles.demoButtonText}>🧪 Demo Login (For Testing)</Text>
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
  demoButton: {
    backgroundColor: '#28a745',
    borderRadius: 8,
    paddingVertical: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#20c997',
  },
  demoButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
  },
});
