import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Redirect, Slot, Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/lib/auth-context';

export const unstable_settings = {
  anchor: '(tabs)',
};

function AuthGate() {
  const {user, loading } = useAuth();
  const segment = useSegments();

  if (loading) {
    return null;
  }
  const currentTab = segment[0] === '(tabs)';


  // guards 

  if (!user && currentTab) {
    return <Redirect href="/" 
    />;

  }
  if (user && !currentTab) {
    return <Redirect href="/(tabs)" />;


  }
  
  // router guard
  return <Slot />;
}

/// Changing the Redirect -> removes stack and adds the Gate for Auths

export default function RootLayout() {
  const colorScheme = useColorScheme();
  // Set the status bar style based on the color scheme
  
  
  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AuthGate />
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}
