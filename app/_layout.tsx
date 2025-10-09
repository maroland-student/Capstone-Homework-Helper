import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useColorScheme } from '../hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [bootstrapped, setBootstrapped] = useState(false);
  // Set the status bar style based on the color scheme

  useEffect(() => {
    const checkSession = async () => {
      try {
        const userType = await AsyncStorage.getItem('userType');

        // Optional: expire guest session after 24h
        if (userType === 'guest') {
          const created = await AsyncStorage.getItem('guestSessionCreated');
          if (created) {
            const age = Date.now() - Number(created);
            if (age > ONE_DAY_MS) {
              await AsyncStorage.multiRemove(['userType', 'guestSessionId', 'guestSessionCreated']);
            }
          }
        }

        const finalUserType = await AsyncStorage.getItem('userType');
        if (finalUserType) {
          // Replace so user can’t “back” to login
          router.replace('/(tabs)/explore');
        }
      } catch (err) {
        console.warn('Session check failed:', err);
      } finally {
        setBootstrapped(true);
      }
    };

    checkSession();
  }, []);

  // Avoid flicker while checking session
  if (!bootstrapped) {
    return null; // or a tiny splash/loading component
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen 
          name="index" 
          options={{ 
            headerShown: false,
            title: 'Login'
          }} 
        />
        <Stack.Screen 
          name="(tabs)" 
          options={{ 
            headerShown: false,
            title: 'Main App'
          }} 
        />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
