// ============================================================
// Privacy Settings — WhatsApp style
// Controls who can see last seen, profile photo, about, groups
// ============================================================

import React from 'react';
import { ScrollView, StyleSheet, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SettingsRow, SettingsDivider, SettingsSection } from '@/components/SettingsRow';
import { Spacing } from '@/constants/theme';
import { useCustomAlert } from '@/context/AlertContext';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useSettings } from '@/hooks/useSettings';

type Visibility = 'everyone' | 'contacts' | 'nobody';

const VISIBILITY_LABELS: Record<Visibility, string> = {
  everyone: 'Everyone',
  contacts: 'My Contacts',
  nobody:   'Nobody',
};

export default function PrivacySettings() {
  const { colors } = useAppTheme();
  const { settings, setSetting } = useSettings();
  const { showAlert } = useCustomAlert();

  // Show a picker sheet for visibility options
  const pickVisibility = (
    title: string,
    current: Visibility,
    key: 'lastSeenVisibility' | 'profilePhotoVisibility' | 'aboutVisibility' | 'groupsVisibility'
  ) => {
    showAlert({
      type:        'info',
      title,
      message:     `Current: ${VISIBILITY_LABELS[current]}\n\nChoose who can see this:`,
      confirmText: 'Everyone',
      cancelText:  'My Contacts',
      onConfirm:   () => setSetting(key, 'everyone'),
      onCancel:    () => setSetting(key, 'contacts'),
    });
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView>

        {/* ── Visibility ──────────────────────────────── */}
        <SettingsSection title="Who Can See My Personal Info" />
        <View style={[s.section, { backgroundColor: colors.surface }]}>
          <SettingsRow
            icon="time-outline"      iconBg="#25D366"
            label="Last Seen & Online"
            sublabel={VISIBILITY_LABELS[settings.lastSeenVisibility]}
            onPress={() => pickVisibility('Last Seen & Online', settings.lastSeenVisibility, 'lastSeenVisibility')}
          />
          <View style={[s.sep, { backgroundColor: colors.border }]} />
          <SettingsRow
            icon="person-circle-outline" iconBg="#135792"
            label="Profile Photo"
            sublabel={VISIBILITY_LABELS[settings.profilePhotoVisibility]}
            onPress={() => pickVisibility('Profile Photo', settings.profilePhotoVisibility, 'profilePhotoVisibility')}
          />
          <View style={[s.sep, { backgroundColor: colors.border }]} />
          <SettingsRow
            icon="information-circle-outline" iconBg="#20749f"
            label="About"
            sublabel={VISIBILITY_LABELS[settings.aboutVisibility]}
            onPress={() => pickVisibility('About', settings.aboutVisibility, 'aboutVisibility')}
          />
          <View style={[s.sep, { backgroundColor: colors.border }]} />
          <SettingsRow
            icon="people-outline" iconBg="#379ebb"
            label="Groups"
            description="Who can add me to groups"
            sublabel={VISIBILITY_LABELS[settings.groupsVisibility]}
            onPress={() => pickVisibility('Groups', settings.groupsVisibility, 'groupsVisibility')}
          />
        </View>

        <SettingsDivider />

        {/* ── Messages ────────────────────────────────── */}
        <SettingsSection title="Messages" />
        <View style={[s.section, { backgroundColor: colors.surface }]}>
          <SettingsRow
            icon="timer-outline" iconBg="#8134AF"
            label="Default Message Timer"  description="Disappearing messages (coming soon)"
            onPress={() =>
              showAlert({ type: 'info', title: 'Coming Soon', message: 'Disappearing messages will be in a future update.' })
            }
          />
          <View style={[s.sep, { backgroundColor: colors.border }]} />
          <SettingsRow
            icon="ban-outline" iconBg="#e74c3c"
            label="Blocked Contacts"       description="0 blocked"
            onPress={() =>
              showAlert({ type: 'info', title: 'No Blocked Contacts', message: 'You have not blocked anyone.' })
            }
          />
        </View>

        <SettingsDivider />

        {/* ── Advanced ────────────────────────────────── */}
        <SettingsSection title="Advanced" />
        <View style={[s.section, { backgroundColor: colors.surface }]}>
          <SettingsRow
            icon="eye-off-outline" iconBg="#FF6B35"
            label="Read Receipts"
            description="If turned off, you won't send or receive read receipts"
            rightElement={
              <Switch
                value
                onValueChange={() =>
                  showAlert({ type: 'info', title: 'Read Receipts', message: 'Read receipts settings coming soon.' })
                }
                trackColor={{ false: colors.border, true: colors.secondary }}
                thumbColor={colors.primary}
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
