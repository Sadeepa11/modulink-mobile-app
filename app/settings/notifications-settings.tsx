// ============================================================
// Notifications Settings — WhatsApp style
// Message / Group / Call tone and vibration controls
// ============================================================

import React from 'react';
import { ScrollView, StyleSheet, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SettingsRow, SettingsDivider, SettingsSection } from '@/components/SettingsRow';
import { Spacing } from '@/constants/theme';
import { useCustomAlert } from '@/context/AlertContext';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useSettings } from '@/hooks/useSettings';

export default function NotificationsSettingsScreen() {
  const { colors } = useAppTheme();
  const { settings, setSetting } = useSettings();
  const { showAlert } = useCustomAlert();

  const toggle = (key: 'notificationsEnabled' | 'notificationSound' | 'notificationVibrate' | 'groupNotifications' | 'inAppSounds') =>
    setSetting(key, !settings[key]);

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView>

        {/* ── Master switch ───────────────────────────── */}
        <SettingsSection title="Push Notifications" />
        <View style={[s.section, { backgroundColor: colors.surface }]}>
          <SettingsRow
            icon="notifications-outline" iconBg="#FF6B35"
            label="Notifications"
            description="Enable or disable all notifications"
            rightElement={
              <Switch
                value={settings.notificationsEnabled}
                onValueChange={() => toggle('notificationsEnabled')}
                trackColor={{ false: colors.border, true: colors.secondary }}
                thumbColor={settings.notificationsEnabled ? colors.primary : colors.border}
                ios_backgroundColor={colors.border}
              />
            }
          />
        </View>

        <SettingsDivider />

        {/* ── Message notifications ────────────────────── */}
        <SettingsSection title="Message Notifications" />
        <View style={[s.section, { backgroundColor: colors.surface }]}>
          <SettingsRow
            icon="volume-high-outline" iconBg="#25D366"
            label="Notification Sound"
            sublabel={settings.notificationSound ? 'On' : 'Off'}
            rightElement={
              <Switch
                value={settings.notificationSound}
                onValueChange={() => toggle('notificationSound')}
                trackColor={{ false: colors.border, true: colors.secondary }}
                thumbColor={settings.notificationSound ? colors.primary : colors.border}
                ios_backgroundColor={colors.border}
                disabled={!settings.notificationsEnabled}
              />
            }
          />
          <View style={[s.sep, { backgroundColor: colors.border }]} />
          <SettingsRow
            icon="musical-notes-outline" iconBg="#135792"
            label="Ringtone"
            sublabel="Default"
            onPress={() =>
              showAlert({ type: 'info', title: 'Ringtone', message: 'Custom ringtones coming in a future update.' })
            }
            disabled={!settings.notificationsEnabled}
          />
          <View style={[s.sep, { backgroundColor: colors.border }]} />
          <SettingsRow
            icon="phone-portrait-outline" iconBg="#20749f"
            label="Vibrate"
            sublabel={settings.notificationVibrate ? 'On' : 'Off'}
            rightElement={
              <Switch
                value={settings.notificationVibrate}
                onValueChange={() => toggle('notificationVibrate')}
                trackColor={{ false: colors.border, true: colors.secondary }}
                thumbColor={settings.notificationVibrate ? colors.primary : colors.border}
                ios_backgroundColor={colors.border}
                disabled={!settings.notificationsEnabled}
              />
            }
          />
          <View style={[s.sep, { backgroundColor: colors.border }]} />
          <SettingsRow
            icon="chatbubble-outline" iconBg="#379ebb"
            label="Popup Notification"
            sublabel="No popup"
            onPress={() =>
              showAlert({ type: 'info', title: 'Coming Soon', message: 'Popup notification options coming soon.' })
            }
            disabled={!settings.notificationsEnabled}
          />
        </View>

        <SettingsDivider />

        {/* ── Group notifications ──────────────────────── */}
        <SettingsSection title="Group Notifications" />
        <View style={[s.section, { backgroundColor: colors.surface }]}>
          <SettingsRow
            icon="people-outline" iconBg="#9B59B6"
            label="Group Notifications"
            rightElement={
              <Switch
                value={settings.groupNotifications}
                onValueChange={() => toggle('groupNotifications')}
                trackColor={{ false: colors.border, true: colors.secondary }}
                thumbColor={settings.groupNotifications ? colors.primary : colors.border}
                ios_backgroundColor={colors.border}
                disabled={!settings.notificationsEnabled}
              />
            }
          />
        </View>

        <SettingsDivider />

        {/* ── In-app sounds ───────────────────────────── */}
        <SettingsSection title="In-App Sounds" />
        <View style={[s.section, { backgroundColor: colors.surface }]}>
          <SettingsRow
            icon="musical-note-outline" iconBg="#1ABC9C"
            label="In-App Sounds"
            description="Play sounds when the app is open"
            rightElement={
              <Switch
                value={settings.inAppSounds}
                onValueChange={() => toggle('inAppSounds')}
                trackColor={{ false: colors.border, true: colors.secondary }}
                thumbColor={settings.inAppSounds ? colors.primary : colors.border}
                ios_backgroundColor={colors.border}
              />
            }
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
