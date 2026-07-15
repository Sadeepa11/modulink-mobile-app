// ============================================================
// Permissions Utility
// Centralises all runtime permission requests for the app.
//
// Android and iOS have different permission systems:
//   Android < 13 : READ_EXTERNAL_STORAGE covers all media
//   Android >= 13: READ_MEDIA_IMAGES and READ_MEDIA_VIDEO
//   iOS          : NSPhotoLibraryUsageDescription covers the gallery
//
// We request permissions ONCE on login (from _layout.tsx) so the
// user sees the prompts early rather than mid-task.
// ============================================================

import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';
import { Alert, Linking, Platform } from 'react-native';

import Logger from './logger';

// ── Notification configuration ────────────────────────────────
// This tells the OS how to display notifications while the app
// is in the foreground (banner + sound + badge).
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,   // Show banner even while app is open
    shouldPlaySound: true,
    shouldSetBadge:  true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ── Individual permission requests ───────────────────────────

/** Request access to the device camera */
export async function requestCameraPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    Logger.info('Camera permission denied');
    return false;
  }
  Logger.info('Camera permission granted');
  return true;
}

/** Request access to the photo / media library */
export async function requestMediaLibraryPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Logger.info('Media library permission denied');
    return false;
  }
  Logger.info('Media library permission granted');
  return true;
}

/** Request permission to send push notifications */
export async function requestNotificationPermission(): Promise<boolean> {
  // On Android 12 and below, notifications are allowed by default
  if (Platform.OS === 'android' && Platform.Version < 33) {
    return true;
  }

  const { status: existing } = await Notifications.getPermissionsAsync();

  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert:  true,
      allowBadge:  true,
      allowSound:  true,
      allowProvisional: false,
    },
  });

  if (status !== 'granted') {
    Logger.info('Notification permission denied');
    return false;
  }

  Logger.info('Notification permission granted');
  return true;
}

// ── Request all permissions at once ──────────────────────────
/**
 * requestAllPermissions
 * Call this once when the user logs in.
 * Requests camera, media library, and notifications.
 */
export async function requestAllPermissions(): Promise<void> {
  Logger.info('Requesting all app permissions');

  const [camera, media, notif] = await Promise.all([
    requestCameraPermission(),
    requestMediaLibraryPermission(),
    requestNotificationPermission(),
  ]);

  Logger.info('Permission results', { camera, media, notifications: notif });

  // On iOS, if a critical permission was denied, guide the user to Settings
  if (Platform.OS === 'ios' && (!camera || !media)) {
    Alert.alert(
      'Permissions Required',
      'ModuLink needs camera and photo access to share images. '
      + 'Please enable them in Settings → ModuLink.',
      [
        { text: 'Not Now', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ]
    );
  }
}

// ── Register device for push notifications ────────────────────
/**
 * getExpoPushToken
 * Returns the device's Expo push token for server-side notifications.
 * Store this token on your backend to send targeted pushes.
 */
export async function getExpoPushToken(): Promise<string | null> {
  const granted = await requestNotificationPermission();
  if (!granted) return null;

  try {
    // Android requires a notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'ModuLink Messages',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor:       '#135792',
        sound:            'default',
        enableLights:     true,
        showBadge:        true,
      });
    }

    const tokenData = await Notifications.getExpoPushTokenAsync();
    Logger.info('Push token obtained', { token: tokenData.data.slice(0, 20) + '…' });
    return tokenData.data;
  } catch (error) {
    Logger.error('Failed to get push token', error);
    return null;
  }
}
