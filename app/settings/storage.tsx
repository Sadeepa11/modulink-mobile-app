// ============================================================
// Storage and Data Settings — WhatsApp style
// ============================================================

import React from 'react';
import { ScrollView, StyleSheet, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SettingsRow, SettingsDivider, SettingsSection } from '@/components/SettingsRow';
import { Spacing } from '@/constants/theme';
import { useCustomAlert } from '@/context/AlertContext';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useSettings } from '@/hooks/useSettings';

export default function StorageSettingsScreen() {
  const { colors } = useAppTheme();
  const { settings, setSetting } = useSettings();
  const { showAlert } = useCustomAlert();

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView>

        {/* ── Storage ─────────────────────────────────── */}
        <SettingsSection title="Storage" />
        <View style={[s.section, { backgroundColor: colors.surface }]}>
          <SettingsRow
            icon="phone-portrait-outline" iconBg="#135792"
            label="Manage Storage"         description="Free up space on your device"
            onPress={() =>
              showAlert({ type: 'info', title: 'Storage', message: 'Storage manager coming in a future update.' })
            }
          />
          <View style={[s.sep, { backgroundColor: colors.border }]} />
          <SettingsRow
            icon="stats-chart-outline" iconBg="#379ebb"
            label="Network Usage"         description="View your data usage"
            onPress={() =>
              showAlert({ type: 'info', title: 'Network Usage', message: 'Network usage tracker coming soon.' })
            }
          />
        </View>

        <SettingsDivider />

        {/* ── Auto-download ───────────────────────────── */}
        <SettingsSection title="Media Auto-Download" />
        <View style={[s.section, { backgroundColor: colors.surface }]}>
          <SettingsRow
            icon="wifi-outline" iconBg="#25D366"
            label="When Using Wi-Fi"
            description="Auto-download photos and videos on Wi-Fi"
            rightElement={
              <Switch
                value={settings.mediaAutoDownloadWifi}
                onValueChange={(v) => setSetting('mediaAutoDownloadWifi', v)}
                trackColor={{ false: colors.border, true: colors.secondary }}
                thumbColor={settings.mediaAutoDownloadWifi ? colors.primary : colors.border}
                ios_backgroundColor={colors.border}
              />
            }
          />
          <View style={[s.sep, { backgroundColor: colors.border }]} />
          <SettingsRow
            icon="cellular-outline" iconBg="#20749f"
            label="When Using Mobile Data"
            description="Auto-download may use your data plan"
            rightElement={
              <Switch
                value={settings.mediaAutoDownloadData}
                onValueChange={(v) => setSetting('mediaAutoDownloadData', v)}
                trackColor={{ false: colors.border, true: colors.secondary }}
                thumbColor={settings.mediaAutoDownloadData ? colors.primary : colors.border}
                ios_backgroundColor={colors.border}
              />
            }
          />
        </View>

        <SettingsDivider />

        {/* ── Proxy ───────────────────────────────────── */}
        <SettingsSection title="Network" />
        <View style={[s.section, { backgroundColor: colors.surface }]}>
          <SettingsRow
            icon="globe-outline" iconBg="#8134AF"
            label="Proxy"              description="Configure a proxy to use ModuLink"
            onPress={() =>
              showAlert({ type: 'info', title: 'Proxy', message: 'Proxy configuration coming soon.' })
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
