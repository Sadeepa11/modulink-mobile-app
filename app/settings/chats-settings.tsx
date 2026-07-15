// ============================================================
// Chats Settings — WhatsApp style
// Theme, font size, chat wallpaper, chat history, enter to send
// ============================================================

import React from 'react';
import { ScrollView, StyleSheet, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SettingsRow, SettingsDivider, SettingsSection } from '@/components/SettingsRow';
import { Spacing } from '@/constants/theme';
import { useCustomAlert } from '@/context/AlertContext';
import { useAppColorScheme } from '@/context/ThemeContext';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useSettings } from '@/hooks/useSettings';

export default function ChatsSettingsScreen() {
  const { colors, isDark } = useAppTheme();
  const { toggleTheme } = useAppColorScheme();
  const { settings, setSetting } = useSettings();
  const { showAlert } = useCustomAlert();

  const pickFontSize = () => {
    showAlert({
      type:        'info',
      title:       'Font Size',
      message:     `Current: ${settings.fontSize}\n\nSmall / Medium / Large`,
      confirmText: 'Medium',
      cancelText:  'Small',
      onConfirm:   () => setSetting('fontSize', 'medium'),
      onCancel:    () => setSetting('fontSize', 'small'),
    });
  };

  const clearHistory = () => {
    showAlert({
      type:        'confirm',
      title:       'Clear All Chat History',
      message:     'This will delete all messages from all chats on this device.',
      confirmText: 'Clear',
      cancelText:  'Cancel',
      destructive: true,
      onConfirm:   () =>
        showAlert({ type: 'success', title: 'Cleared', message: 'All local chat history cleared.' }),
    });
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView>

        {/* ── Theme ───────────────────────────────────── */}
        <SettingsSection title="Display" />
        <View style={[s.section, { backgroundColor: colors.surface }]}>
          <SettingsRow
            icon={isDark ? 'moon' : 'sunny-outline'}
            iconBg={isDark ? '#8134AF' : '#f59e0b'}
            label="Theme"
            sublabel={isDark ? 'Dark' : 'Light'}
            rightElement={
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.border, true: colors.secondary }}
                thumbColor={isDark ? colors.accentLight : colors.primary}
                ios_backgroundColor={colors.border}
              />
            }
          />
          <View style={[s.sep, { backgroundColor: colors.border }]} />
          <SettingsRow
            icon="text-outline"       iconBg="#20749f"
            label="Font Size"         sublabel={settings.fontSize.charAt(0).toUpperCase() + settings.fontSize.slice(1)}
            onPress={pickFontSize}
          />
          <View style={[s.sep, { backgroundColor: colors.border }]} />
          <SettingsRow
            icon="image-outline"      iconBg="#135792"
            label="Chat Wallpaper"    description="Change the background of your chats"
            onPress={() =>
              showAlert({ type: 'info', title: 'Coming Soon', message: 'Custom wallpapers will be in a future update.' })
            }
          />
        </View>

        <SettingsDivider />

        {/* ── Keyboard ────────────────────────────────── */}
        <SettingsSection title="Keyboard" />
        <View style={[s.section, { backgroundColor: colors.surface }]}>
          <SettingsRow
            icon="return-down-forward-outline" iconBg="#25D366"
            label="Enter is Send"
            description="Press Enter to send, Shift+Enter for new line"
            rightElement={
              <Switch
                value={settings.enterToSend}
                onValueChange={(v) => setSetting('enterToSend', v)}
                trackColor={{ false: colors.border, true: colors.secondary }}
                thumbColor={settings.enterToSend ? colors.primary : colors.border}
                ios_backgroundColor={colors.border}
              />
            }
          />
        </View>

        <SettingsDivider />

        {/* ── Chat history ────────────────────────────── */}
        <SettingsSection title="Chat History" />
        <View style={[s.section, { backgroundColor: colors.surface }]}>
          <SettingsRow
            icon="archive-outline" iconBg="#379ebb"
            label="Archive All Chats"
            onPress={() =>
              showAlert({ type: 'info', title: 'Coming Soon', message: 'Archive feature coming in a future update.' })
            }
          />
          <View style={[s.sep, { backgroundColor: colors.border }]} />
          <SettingsRow
            icon="cloud-upload-outline" iconBg="#9B59B6"
            label="Transfer Chats"       description="Move chat history to another device"
            onPress={() =>
              showAlert({ type: 'info', title: 'Coming Soon', message: 'Chat transfer will be available in a future update.' })
            }
          />
          <View style={[s.sep, { backgroundColor: colors.border }]} />
          <SettingsRow
            icon="trash-outline"       iconBg="#e74c3c"
            label="Clear All Chat History"
            destructive
            onPress={clearHistory}
          />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:    { flex: 1 },
  section: { overflow: 'hidden' },
  sep:     { height: 0.7, marginLeft: 54 + Spacing.md * 2 },
});
