// ============================================================
// Custom Alert System
//
// Replaces React Native's default Alert.alert() with a
// fully themed modal that matches the app's colour palette.
//
// Alert types and their accent colours:
//   info     → brand blue  (#135792 / #79dadf)
//   success  → green       (#1a9e5f)
//   warning  → amber       (#d97706)
//   error    → red         (#dc2626)
//   confirm  → brand blue  with a destructive "confirm" button
//
// Usage in any component:
//   const { showAlert } = useCustomAlert();
//
//   // Simple message
//   showAlert({ type: 'success', title: 'Done!', message: 'Post created.' });
//
//   // Confirmation dialog
//   showAlert({
//     type: 'confirm',
//     title: 'Delete Post',
//     message: 'Are you sure you want to delete this?',
//     confirmText: 'Delete',
//     cancelText: 'Cancel',
//     destructive: true,
//     onConfirm: () => deletePost(id),
//   });
// ============================================================

import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { FontSize, Radius, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';

// -------------------------------------------------------
// Types
// -------------------------------------------------------
export type AlertType = 'info' | 'success' | 'warning' | 'error' | 'confirm';

export interface AlertOptions {
  type?: AlertType;
  title: string;
  message?: string;
  confirmText?: string;   // Label for the primary button (default: "OK")
  cancelText?: string;    // Label for the cancel button (only shown for 'confirm' type)
  destructive?: boolean;  // Makes the confirm button red (for delete/logout)
  onConfirm?: () => void; // Called when the confirm button is tapped
  onCancel?: () => void;  // Called when the cancel button is tapped
}

interface AlertContextType {
  showAlert: (opts: AlertOptions) => void;
}

const AlertContext = createContext<AlertContextType>({ showAlert: () => {} });

// -------------------------------------------------------
// Accent colours per alert type
// Returns { icon, lightColor, darkColor }
// -------------------------------------------------------
const TYPE_CONFIG: Record<AlertType, { icon: string; light: string; dark: string }> = {
  info:    { icon: 'ℹ️',  light: '#135792', dark: '#79dadf' },
  success: { icon: '✅',  light: '#1a9e5f', dark: '#34d399' },
  warning: { icon: '⚠️',  light: '#d97706', dark: '#fbbf24' },
  error:   { icon: '❌',  light: '#dc2626', dark: '#f87171' },
  confirm: { icon: '❓',  light: '#135792', dark: '#79dadf' },
};

// -------------------------------------------------------
// AlertProvider — wraps the entire app, renders the modal
// -------------------------------------------------------
export function AlertProvider({ children }: { children: React.ReactNode }) {
  const { colors, isDark } = useAppTheme();

  // Alert state — null when hidden
  const [opts, setOpts] = useState<AlertOptions | null>(null);

  // Animated scale for a subtle "pop in" effect
  const scaleAnim = useRef(new Animated.Value(0.85)).current;

  const showAlert = useCallback((options: AlertOptions) => {
    setOpts(options);
    // Reset scale and animate in
    scaleAnim.setValue(0.85);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 180,
      friction: 12,
    }).start();
  }, [scaleAnim]);

  const dismiss = (callback?: () => void) => {
    setOpts(null);
    callback?.();
  };

  const type: AlertType = opts?.type ?? 'info';
  const config = TYPE_CONFIG[type];
  const accentColor = isDark ? config.dark : config.light;

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}

      {/* The modal is always in the tree but only visible when opts !== null */}
      <Modal
        visible={opts !== null}
        transparent
        animationType="fade"        // Backdrop fades in/out
        statusBarTranslucent        // Covers the status bar on Android
        onRequestClose={() => dismiss(opts?.onCancel)}>

        {/* Semi-transparent backdrop */}
        <View style={styles.backdrop}>

          {/* Alert card — scales in via spring animation */}
          <Animated.View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: accentColor,
                transform: [{ scale: scaleAnim }],
              },
            ]}>

            {/* Coloured top accent bar */}
            <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

            {/* Icon + Title */}
            <View style={styles.titleRow}>
              <Text style={styles.icon}>{config.icon}</Text>
              <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
                {opts?.title}
              </Text>
            </View>

            {/* Message body */}
            {opts?.message ? (
              <Text style={[styles.message, { color: colors.textSecondary }]}>
                {opts.message}
              </Text>
            ) : null}

            {/* ---- Buttons ---- */}
            <View style={[
              styles.btnRow,
              { borderTopColor: colors.border },
              // Stack buttons vertically when both are present and labels are long
            ]}>
              {/* Cancel button — only shown for 'confirm' type */}
              {type === 'confirm' && (
                <Pressable
                  style={({ pressed }) => [
                    styles.btn,
                    styles.btnCancel,
                    { borderColor: colors.border, backgroundColor: pressed ? colors.surfaceAlt : 'transparent' },
                  ]}
                  onPress={() => dismiss(opts?.onCancel)}>
                  <Text style={[styles.btnText, { color: colors.textSecondary }]}>
                    {opts?.cancelText ?? 'Cancel'}
                  </Text>
                </Pressable>
              )}

              {/* Confirm / OK button */}
              <Pressable
                style={({ pressed }) => [
                  styles.btn,
                  styles.btnConfirm,
                  {
                    // Destructive actions use red; otherwise use the type accent colour
                    backgroundColor: opts?.destructive
                      ? (pressed ? '#b91c1c' : '#dc2626')
                      : (pressed ? colors.primaryDark : accentColor),
                    flex: type === 'confirm' ? 1 : undefined,
                    width: type !== 'confirm' ? '100%' : undefined,
                  },
                ]}
                onPress={() => dismiss(opts?.onConfirm)}>
                <Text style={[styles.btnText, styles.btnConfirmText]}>
                  {opts?.confirmText ?? 'OK'}
                </Text>
              </Pressable>
            </View>

          </Animated.View>
        </View>
      </Modal>
    </AlertContext.Provider>
  );
}

// -------------------------------------------------------
// useCustomAlert — the hook every screen imports
// -------------------------------------------------------
export function useCustomAlert() {
  return useContext(AlertContext);
}

// -------------------------------------------------------
// Styles
// -------------------------------------------------------
const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(7, 21, 36, 0.65)', // Dark navy overlay for all themes
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    overflow: 'hidden',
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 16,
  },
  // Thin coloured stripe at the very top of the card
  accentBar: {
    height: 4,
    width: '100%',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  icon: {
    fontSize: 22,
  },
  title: {
    flex: 1,
    fontSize: FontSize.lg,
    fontWeight: '800',
    lineHeight: 24,
  },
  message: {
    fontSize: FontSize.sm,
    lineHeight: 21,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  btnRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    gap: Spacing.sm,
    padding: Spacing.md,
  },
  btn: {
    borderRadius: Radius.md,
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
  },
  btnCancel: {
    flex: 1,
    borderWidth: 1.5,
  },
  btnConfirm: {
    borderRadius: Radius.md,
  },
  btnText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  btnConfirmText: {
    color: '#ffffff',
  },
});
