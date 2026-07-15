// ============================================================
// Root Layout
// Wraps the entire app with all required providers:
//   1. AppThemeProvider  — manual light/dark toggle
//   2. AuthProvider      — global authentication state
//   3. SocketProvider    — real-time WebSocket connection
//
// AuthGate reads auth state and redirects to the correct screen.
// The React Navigation ThemeProvider reacts to our custom theme.
// ============================================================

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '@/context/AuthContext';
import { AlertProvider } from '@/context/AlertContext';
import { SocketProvider } from '@/context/SocketContext';
import { AppThemeProvider, useAppColorScheme } from '@/context/ThemeContext';
import { requestAllPermissions, getExpoPushToken } from '@/utils/permissions';
import api from '@/services/api';

// -------------------------------------------------------
// AuthGate — redirects based on login state
// -------------------------------------------------------
function AuthGate() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!user && !inAuthGroup) router.replace('/(auth)/login');
    else if (user && inAuthGroup) router.replace('/(tabs)');
  }, [user, isLoading, segments]);

  // Request all permissions + register push token once when the user logs in
  useEffect(() => {
    if (!user) return;
    requestAllPermissions();
    (async () => {
      const token = await getExpoPushToken();
      if (token) {
        try {
          await api.put('/users/push-token', { pushToken: token });
        } catch {
          // non-fatal — token will be re-registered on next login
        }
      }
    })();
  }, [user?.id]);

  return null;
}

// -------------------------------------------------------
// Inner — needs to be inside AppThemeProvider to read scheme
// -------------------------------------------------------
function Inner() {
  const { colorScheme } = useAppColorScheme();
  const router = useRouter();

  // Navigate to the correct chat when the user taps a push notification
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data as any;
      if (data?.conversationId) {
        router.push(`/chat/${data.conversationId}`);
      }
    });
    return () => sub.remove();
  }, []);

  // Build React Navigation theme colours using our brand palette
  const navTheme = colorScheme === 'dark'
    ? {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          primary: '#79dadf',
          background: '#071a30',
          card: '#0c243e',
          text: '#e1ebf1',
          border: '#1a3a5c',
          notification: '#379ebb',
        },
      }
    : {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          primary: '#79dadf',
          background: '#083a7a',
          card: '#0d478a',
          text: '#ffffff',
          border: '#1a3a5c',
          notification: '#379ebb',
        },
      };

  return (
    <ThemeProvider value={navTheme}>
      <AuthGate />
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="chat/[id]"
          options={{
            headerShown: true,
            headerBackTitle: 'Back',
            headerStyle: { backgroundColor: colorScheme === 'dark' ? '#071a30' : '#083a7a' },
            headerTintColor: '#ffffff',
            headerTitleStyle: { fontWeight: '800', color: '#ffffff', fontSize: 18 },
          }}
        />
        <Stack.Screen
          name="new-chat"
          options={{
            title: 'New Chat',
            headerShown: true,
            presentation: 'modal',
            headerStyle: { backgroundColor: colorScheme === 'dark' ? '#071a30' : '#083a7a' },
            headerTintColor: '#ffffff',
            headerTitleStyle: { fontWeight: '800', color: '#ffffff', fontSize: 18 },
          }}
        />
        <Stack.Screen
          name="post/[id]"
          options={{
            title: 'Comments',
            headerShown: true,
            headerStyle: { backgroundColor: colorScheme === 'dark' ? '#071a30' : '#083a7a' },
            headerTintColor: '#ffffff',
            headerTitleStyle: { fontWeight: '800', color: '#ffffff', fontSize: 18 },
          }}
        />
        {/* New Group creation — 2-step modal */}
        <Stack.Screen
          name="new-group"
          options={{
            headerShown:     false, // Custom header rendered inside new-group.tsx
            presentation:    'modal',
            gestureEnabled:  true,
          }}
        />
        <Stack.Screen
          name="saved-messages"
          options={{
            title: 'Saved Messages',
            headerShown: true,
            headerStyle: { backgroundColor: colorScheme === 'dark' ? '#071a30' : '#083a7a' },
            headerTintColor: '#ffffff',
            headerTitleStyle: { fontWeight: '800', color: '#ffffff', fontSize: 18 },
          }}
        />
        <Stack.Screen
          name="starred-messages"
          options={{
            title: 'Starred Messages',
            headerShown: true,
            headerStyle: { backgroundColor: colorScheme === 'dark' ? '#071a30' : '#083a7a' },
            headerTintColor: '#ffffff',
            headerTitleStyle: { fontWeight: '800', color: '#ffffff', fontSize: 18 },
          }}
        />
        {/* Settings section — has its own nested Stack (_layout.tsx inside settings/) */}
        <Stack.Screen
          name="settings"
          options={{ headerShown: false }}
        />
      </Stack>

      {/* StatusBar colour adapts automatically with the theme */}
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

// -------------------------------------------------------
// All providers stacked outermost → innermost
// -------------------------------------------------------
export default function RootLayout() {
  return (
    <AppThemeProvider>
      <AuthProvider>
        <SocketProvider>
          {/* AlertProvider must be inside AppThemeProvider so it can read theme colours */}
          <AlertProvider>
            <Inner />
          </AlertProvider>
        </SocketProvider>
      </AuthProvider>
    </AppThemeProvider>
  );
}
