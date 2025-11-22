import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { SubjectsProvider } from '@/lib/subjects-context';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutNav() {
  const { user, loading, hasExplicitlyLoggedIn } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const redirectingRef = useRef(false);

  useEffect(() => {
    if (loading || redirectingRef.current) return;

    const inAuthGroup = segments[0] === '(tabs)';
    const isLoginScreen = segments.length === 1 && segments[0] === 'index';
    const isNavigatingWithinTabs = inAuthGroup && segments.length > 1;

    // Don't redirect when navigating between tabs
    if (isNavigatingWithinTabs) return;

    // Handle race condition: wait for session to update after login
    if (hasExplicitlyLoggedIn && !user && inAuthGroup && !isNavigatingWithinTabs) {
      const timeoutId = setTimeout(() => {
        if (!user) {
          redirectingRef.current = true;
          router.replace('/');
          setTimeout(() => {
            redirectingRef.current = false;
          }, 100);
        }
      }, 500);
      return () => clearTimeout(timeoutId);
    }

    // Redirect unauthenticated users away from protected routes
    if (!user && inAuthGroup && !isLoginScreen && !hasExplicitlyLoggedIn && !isNavigatingWithinTabs) {
      redirectingRef.current = true;
      router.replace('/');
      setTimeout(() => {
        redirectingRef.current = false;
      }, 100);
    }

    // Redirect authenticated users from login to main app
    if (user && hasExplicitlyLoggedIn && isLoginScreen) {
      redirectingRef.current = true;
      router.replace('/(tabs)');
      setTimeout(() => {
        redirectingRef.current = false;
      }, 100);
    }
  }, [user, loading, segments, router, hasExplicitlyLoggedIn]);

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
          title: 'Login',
        }}
      />
      <Stack.Screen
        name="(tabs)"
        options={{
          headerShown: false,
          title: 'Main App',
        }}
      />
      <Stack.Screen
        name="modal"
        options={{ presentation: 'modal', title: 'Modal' }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <SubjectsProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <RootLayoutNav />
          <StatusBar style="auto" />
        </ThemeProvider>
      </SubjectsProvider>
    </AuthProvider>
  );
}
