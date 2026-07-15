// ============================================================
// useAppTheme — single import for theme colours
//
// Every screen calls this ONE hook instead of juggling
// useColorScheme() + Colors[scheme] separately.
//
// Usage:
//   const { colors, isDark } = useAppTheme();
//   <View style={{ backgroundColor: colors.background }}>
// ============================================================

import { Colors } from '@/constants/theme';
import { useAppColorScheme } from '@/context/ThemeContext';

export function useAppTheme() {
  const { colorScheme, isDark, toggleTheme } = useAppColorScheme();
  const colors = Colors[colorScheme]; // Pick 'light' or 'dark' palette
  return { colors, isDark, colorScheme, toggleTheme };
}
