import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, usePathname, useRouter, useSegments } from 'expo-router';
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
  const pathname = usePathname();
  const router = useRouter();
  const redirectingRef = useRef(false);

  useEffect(() => {
    if (loading || redirectingRef.current) return;

    const inAuthGroup = segments[0] === '(tabs)';
    const isLoginScreen = pathname === '/' || pathname === '/index';
    const isNavigatingWithinTabs = inAuthGroup && segments.length > 1;

    if (isNavigatingWithinTabs) return;

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

    if (!user && inAuthGroup && !isLoginScreen && !hasExplicitlyLoggedIn && !isNavigatingWithinTabs) {
      redirectingRef.current = true;
      router.replace('/');
      setTimeout(() => {
        redirectingRef.current = false;
      }, 100);
    }

    if (user && isLoginScreen) {
      redirectingRef.current = true;
      router.replace('/(tabs)/welcome-dashboard');
      setTimeout(() => {
        redirectingRef.current = false;
      }, 100);
    }
  }, [user, loading, segments, pathname, router, hasExplicitlyLoggedIn]);

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
