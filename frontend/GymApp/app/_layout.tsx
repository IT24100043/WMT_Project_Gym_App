import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useContext, useEffect } from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, AuthContext } from '@/context/AuthContext';
import LoadingScreen from '@/components/LoadingScreen';

export const unstable_settings = {
  anchor: 'login',
};

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { user, isLoading } = useContext(AuthContext);
  const router = useRouter();

  console.log('RootLayoutNav render - isLoading:', isLoading, 'user role:', user?.role);

  useEffect(() => {
    console.log('Navigation effect triggered - isLoading:', isLoading, 'user:', user?.role);
    
    if (!isLoading) {
      if (!user) {
        console.log('→ Navigating to /login');
        router.replace('/login');
      } else if (user.role === 'user') {
        console.log('→ Navigating to /user-home');
        router.replace('/user-home');
      } else if (user.role === 'gym') {
        console.log('→ Navigating to /gym-home');
        router.replace('/gym-home');
      } else {
        console.log('→ Unknown role, navigating to /login');
        router.replace('/login');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isLoading]);

  if (isLoading) {
    console.log('Rendering loading screen');
    return <LoadingScreen message="Loading..." />;
  }

  console.log('Rendering navigation stack');
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen 
          name="login" 
          options={{ 
            headerShown: false,
          }} 
        />
        <Stack.Screen 
          name="registration-type" 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="register" 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="user-home" 
          options={{ 
            headerShown: false,
          }} 
        />
        <Stack.Screen 
          name="gym-home" 
          options={{ 
            headerShown: false,
          }} 
        />
        <Stack.Screen 
          name="all-gyms" 
          options={{ 
            headerShown: false,
          }} 
        />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
