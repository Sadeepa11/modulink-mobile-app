// ============================================================
// Help Settings — WhatsApp style
// Help centre, contact us, privacy policy, app info
// ============================================================

import React from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SettingsRow, SettingsDivider, SettingsSection } from '@/components/SettingsRow';
import { Spacing } from '@/constants/theme';
import { useCustomAlert } from '@/context/AlertContext';
import { useAppTheme } from '@/hooks/useAppTheme';

const APP_VERSION    = '1.0.0';
const SUPPORT_EMAIL  = 'support@modulink.app';
const PRIVACY_URL    = 'https://modulink.app/privacy';
const TERMS_URL      = 'https://modulink.app/terms';

export default function HelpScreen() {
  const { colors } = useAppTheme();
  const { showAlert } = useCustomAlert();

  const contactSupport = () => {
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=ModuLink Support`).catch(() =>
      showAlert({ type: 'info', title: 'Contact Support', message: `Email us at:\n${SUPPORT_EMAIL}` })
    );
  };

  const openUrl = (url: string) => {
    Linking.openURL(url).catch(() =>
      showAlert({ type: 'error', title: 'Error', message: 'Could not open link.' })
    );
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView>

        {/* ── Support ─────────────────────────────────── */}
        <SettingsSection title="Support" />
        <View style={[s.section, { backgroundColor: colors.surface }]}>
          <SettingsRow
            icon="help-circle-outline" iconBg="#9B59B6"
            label="Help Centre"         description="Browse help articles"
            onPress={() =>
              showAlert({ type: 'info', title: 'Help Centre', message: 'Online help centre coming soon. For now, email us at support@modulink.app' })
            }
          />
          <View style={[s.sep, { backgroundColor: colors.border }]} />
          <SettingsRow
            icon="mail-outline" iconBg="#1ABC9C"
            label="Contact Us"
            onPress={contactSupport}
          />
          <View style={[s.sep, { backgroundColor: colors.border }]} />
          <SettingsRow
            icon="bug-outline" iconBg="#FF6B35"
            label="Report a Problem"
            onPress={() =>
              showAlert({
                type:        'confirm',
                title:       'Report a Problem',
                message:     'This will open an email to our support team. Please describe the issue.',
                confirmText: 'Open Email',
                cancelText:  'Cancel',
                onConfirm:   contactSupport,
              })
            }
          />
        </View>

        <SettingsDivider />

        {/* ── Legal ───────────────────────────────────── */}
        <SettingsSection title="Legal" />
        <View style={[s.section, { backgroundColor: colors.surface }]}>
          <SettingsRow
            icon="shield-outline" iconBg="#135792"
            label="Privacy Policy"
            onPress={() => openUrl(PRIVACY_URL)}
          />
          <View style={[s.sep, { backgroundColor: colors.border }]} />
          <SettingsRow
            icon="document-text-outline" iconBg="#20749f"
            label="Terms of Service"
            onPress={() => openUrl(TERMS_URL)}
          />
          <View style={[s.sep, { backgroundColor: colors.border }]} />
          <SettingsRow
            icon="code-slash-outline" iconBg="#379ebb"
            label="Third Party Licences"
            onPress={() =>
              showAlert({ type: 'info', title: 'Licences', message: 'Built with Expo, React Native, Express.js, Prisma, Socket.IO and many open-source libraries.' })
            }
          />
        </View>

        <SettingsDivider />

        {/* ── App info ────────────────────────────────── */}
        <SettingsSection title="App Info" />
        <View style={[s.section, { backgroundColor: colors.surface }]}>
          <SettingsRow
            icon="information-circle-outline" iconBg="#8134AF"
            label="Version"
            sublabel={APP_VERSION}
            showChevron={false}
          />
          <View style={[s.sep, { backgroundColor: colors.border }]} />
          <SettingsRow
            icon="star-outline" iconBg="#f59e0b"
            label="Rate ModuLink"
            onPress={() =>
              showAlert({ type: 'info', title: 'Rate Us', message: 'Thank you! App store listing coming soon.' })
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
