// ============================================================
// Theme Context — System-aware with manual override
//
// Behaviour:
//   • By default the app FOLLOWS the phone's system theme (light/dark).
//     When the user flips their phone to dark mode the app changes too.
//   • If the user manually toggles the switch in Profile, that choice
//     is saved to AsyncStorage and overrides the system theme.
//   • Clearing the override (e.g. long-press reset) returns to system.
//
// Usage:
//   const { colorScheme, isDark, toggleTheme } = useAppColorScheme();
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';

type Scheme = 'light' | 'dark';

interface ThemeContextType {
  colorScheme: Scheme;
  isDark: boolean;
  toggleTheme: () => void;
  setScheme: (s: Scheme) => void;
  clearOverride: () => void;   // Reset to system theme
  hasManualOverride: boolean;  // True when user has manually chosen a theme
}

const STORAGE_KEY = 'app_color_scheme';

const ThemeContext = createContext<ThemeContextType>({
  colorScheme: 'light',
  isDark: false,
  toggleTheme: () => {},
  setScheme: () => {},
  clearOverride: () => {},
  hasManualOverride: false,
});

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  // systemScheme updates in real-time when the user changes phone settings
  const systemScheme = useSystemColorScheme();

  const [colorScheme, setColorScheme] = useState<Scheme>(systemScheme ?? 'light');
  const [hasManualOverride, setHasManualOverride] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // ---------------------------------------------------------
  // On first mount: check if user previously saved a preference
  // ---------------------------------------------------------
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved === 'light' || saved === 'dark') {
        // User has a saved override — use it
        setColorScheme(saved);
        setHasManualOverride(true);
      } else {
        // No saved override — follow system
        setColorScheme(systemScheme ?? 'light');
        setHasManualOverride(false);
      }
      setLoaded(true);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount only

  // ---------------------------------------------------------
  // React to LIVE system theme changes when there is no override.
  // e.g. user pulls down notification shade and toggles dark mode
  // ---------------------------------------------------------
  useEffect(() => {
    if (!loaded) return;            // Don't run before initial load completes
    if (hasManualOverride) return;  // User has chosen manually — don't overwrite
    if (systemScheme) {
      setColorScheme(systemScheme);
    }
  }, [systemScheme, hasManualOverride, loaded]);

  // ---------------------------------------------------------
  // setScheme — manual override (saves to AsyncStorage)
  // ---------------------------------------------------------
  const setScheme = useCallback((scheme: Scheme) => {
    setColorScheme(scheme);
    setHasManualOverride(true);
    AsyncStorage.setItem(STORAGE_KEY, scheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setScheme(colorScheme === 'light' ? 'dark' : 'light');
  }, [colorScheme, setScheme]);

  // ---------------------------------------------------------
  // clearOverride — remove saved preference, go back to system
  // ---------------------------------------------------------
  const clearOverride = useCallback(() => {
    AsyncStorage.removeItem(STORAGE_KEY);
    setHasManualOverride(false);
    setColorScheme(systemScheme ?? 'light');
  }, [systemScheme]);

  // Avoid flash of wrong theme while loading from storage
  if (!loaded) return null;

  return (
    <ThemeContext.Provider value={{
      colorScheme,
      isDark: colorScheme === 'dark',
      toggleTheme,
      setScheme,
      clearOverride,
      hasManualOverride,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppColorScheme() {
  return useContext(ThemeContext);
}
