// ============================================================
// useSettings — persisted app preferences
//
// Stores user preferences in AsyncStorage so they survive
// app restarts. Each preference has a sensible default.
//
// Usage:
//   const { settings, setSetting } = useSettings();
//   setSetting('notificationsEnabled', false);
//   console.log(settings.fontSize); // 'medium'
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

export interface AppSettings {
  notificationsEnabled:  boolean;
  notificationSound:     boolean;
  notificationVibrate:   boolean;
  groupNotifications:    boolean;
  inAppSounds:           boolean;
  enterToSend:           boolean;       // Send on Enter key
  mediaAutoDownloadWifi: boolean;
  mediaAutoDownloadData: boolean;
  fontSize:              'small' | 'medium' | 'large';
  lastSeenVisibility:    'everyone' | 'contacts' | 'nobody';
  profilePhotoVisibility:'everyone' | 'contacts' | 'nobody';
  aboutVisibility:       'everyone' | 'contacts' | 'nobody';
  groupsVisibility:      'everyone' | 'contacts' | 'nobody';
}

const DEFAULTS: AppSettings = {
  notificationsEnabled:   true,
  notificationSound:      true,
  notificationVibrate:    true,
  groupNotifications:     true,
  inAppSounds:            true,
  enterToSend:            false,
  mediaAutoDownloadWifi:  true,
  mediaAutoDownloadData:  false,
  fontSize:               'medium',
  lastSeenVisibility:     'everyone',
  profilePhotoVisibility: 'everyone',
  aboutVisibility:        'everyone',
  groupsVisibility:       'everyone',
};

const STORAGE_KEY = 'app_settings';

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULTS);
  const [loaded, setLoaded]     = useState(false);

  // Load from AsyncStorage on first render
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          const saved = JSON.parse(raw) as Partial<AppSettings>;
          // Merge saved values with defaults so new keys always have a value
          setSettings({ ...DEFAULTS, ...saved });
        } catch { /* corrupt storage — use defaults */ }
      }
      setLoaded(true);
    });
  }, []);

  const setSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const resetSettings = () => {
    setSettings(DEFAULTS);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULTS));
  };

  return { settings, setSetting, resetSettings, loaded };
}
