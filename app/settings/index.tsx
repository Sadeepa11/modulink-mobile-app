// ============================================================
// Settings — Main screen (WhatsApp layout 1:1)
//
// Sections:
//  • Profile card  — tap to edit profile
//  • Account       — email, security, delete account
//  • Privacy       — last seen, profile photo visibility
//  • Chats         — theme, font size, wallpaper
//  • Notifications — sounds, vibration, badges
//  • Storage       — manage storage, auto-download
//  • Help          — FAQ, contact, about
//  • Log out
// ============================================================

import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SettingsRow, SettingsDivider } from '@/components/SettingsRow';
import { FontSize, Spacing, Radius } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useCustomAlert } from '@/context/AlertContext';
import { useAppColorScheme } from '@/context/ThemeContext';
import { useAppTheme } from '@/hooks/useAppTheme';
import { API_BASE_URL } from '@/services/api';

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const { colors, isDark } = useAppTheme();
  const { toggleTheme } = useAppColorScheme();
  const { showAlert } = useCustomAlert();
  const router = useRouter();

  const avatarUri = user?.avatar
    ? user.avatar.startsWith('http') ? user.avatar : `${API_BASE_URL}${user.avatar}`
    : null;

  const initials = (user?.name || user?.username || '?')
    .split(' ').slice(0, 2).map((w: string) => w[0]?.toUpperCase() ?? '').join('');

  const handleLogout = () => {
    showAlert({
      type:         'confirm',
      title:        'Log Out',
      message:      'You will be signed out of your account.',
      confirmText:  'Log Out',
      cancelText:   'Cancel',
      destructive:  true,
      onConfirm:    logout,
    });
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Profile card ─────────────────────────────── */}
        <Pressable
          onPress={() => router.push('/(tabs)/profile')}
          style={({ pressed }) => [s.profileCard, {
            backgroundColor: colors.surface,
            borderColor:     colors.border,
            opacity:         pressed ? 0.85 : 1,
          }]}>
          {/* Avatar */}
          <View style={[s.avatarWrap, { backgroundColor: colors.primary }]}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={s.avatarImg} />
            ) : (
              <Text style={s.avatarInitials}>{initials}</Text>
            )}
          </View>

          {/* Name / username / about */}
          <View style={s.profileText}>
            <Text style={[s.profileName, { color: colors.text }]} numberOfLines={1}>
              {user?.name || user?.username}
            </Text>
            <Text style={[s.profileHandle, { color: colors.textSecondary }]}>
              @{user?.username}
            </Text>
            {user?.bio ? (
              <Text style={[s.profileBio, { color: colors.textSecondary }]} numberOfLines={1}>
                {user.bio}
              </Text>
            ) : (
              <Text style={[s.profileBio, { color: colors.border }]}>Tap to add a bio</Text>
            )}
          </View>

          <Ionicons name="chevron-forward" size={20} color={colors.border} />
        </Pressable>

        <SettingsDivider />

        {/* ── Core settings ───────────────────────────── */}
        <View style={[s.section, { backgroundColor: colors.surface }]}>
          <SettingsRow
            icon="key-outline"       iconBg="#25D366"
            label="Account"          description="Email, security, change number"
            onPress={() => router.push('/settings/account')}
          />
          <View style={[s.sep, { backgroundColor: colors.border }]} />
          <SettingsRow
            icon="lock-closed-outline" iconBg="#135792"
            label="Privacy"            description="Last seen, profile photo, about"
            onPress={() => router.push('/settings/privacy')}
          />
          <View style={[s.sep, { backgroundColor: colors.border }]} />
          <SettingsRow
            icon="chatbubble-ellipses-outline" iconBg="#20749f"
            label="Chats"              description="Theme, wallpaper, chat history"
            onPress={() => router.push('/settings/chats-settings')}
          />
          <View style={[s.sep, { backgroundColor: colors.border }]} />
          <SettingsRow
            icon="notifications-outline" iconBg="#FF6B35"
            label="Notifications"        description="Message, group and call tones"
            onPress={() => router.push('/settings/notifications-settings')}
          />
          <View style={[s.sep, { backgroundColor: colors.border }]} />
          <SettingsRow
            icon="server-outline"  iconBg="#379ebb"
            label="Storage and Data"  description="Network usage, auto-download"
            onPress={() => router.push('/settings/storage')}
          />
        </View>

        <SettingsDivider />

        {/* ── Dark Mode quick toggle ───────────────────── */}
        <View style={[s.section, { backgroundColor: colors.surface }]}>
          <SettingsRow
            icon={isDark ? 'moon' : 'sunny-outline'}
            iconBg={isDark ? '#8134AF' : '#f59e0b'}
            label={isDark ? 'Dark Mode' : 'Light Mode'}
            description="Tap to switch app theme"
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
        </View>

        <SettingsDivider />

        {/* ── Help & Support ──────────────────────────── */}
        <View style={[s.section, { backgroundColor: colors.surface }]}>
          <SettingsRow
            icon="help-circle-outline" iconBg="#9B59B6"
            label="Help"               description="Help centre, contact us, privacy policy"
            onPress={() => router.push('/settings/help')}
          />
          <View style={[s.sep, { backgroundColor: colors.border }]} />
          <SettingsRow
            icon="share-social-outline" iconBg="#1ABC9C"
            label="Invite a Friend"
            onPress={() =>
              showAlert({ type: 'info', title: 'Invite', message: 'Share ModuLink with friends!' })
            }
          />
        </View>

        <SettingsDivider />

        {/* ── Log out ─────────────────────────────────── */}
        <View style={[s.section, { backgroundColor: colors.surface }]}>
          <SettingsRow
            icon="log-out-outline"
            iconBg={colors.error}
            label="Log Out"
            destructive
            onPress={handleLogout}
          />
        </View>

        {/* ── App version footer ──────────────────────── */}
        <View style={s.footer}>
          <Image source={require('@/assets/images/icon.png')} style={s.footerIcon} resizeMode="contain" />
          <Text style={[s.footerApp, { color: colors.textSecondary }]}>ModuLink</Text>
          <Text style={[s.footerVersion, { color: colors.border }]}>Version 1.0.0</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  profileCard: {
    flexDirection:    'row',
    alignItems:       'center',
    padding:          Spacing.md,
    gap:              Spacing.md,
    borderBottomWidth: 1,
  },
  avatarWrap: {
    width: 64, height: 64, borderRadius: 32,
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
  },
  avatarImg: { width: 64, height: 64, borderRadius: 32 },
  avatarInitials: { color: '#fff', fontSize: 24, fontWeight: '700' },
  profileText: { flex: 1, gap: 2 },
  profileName:   { fontSize: FontSize.lg, fontWeight: '700' },
  profileHandle: { fontSize: FontSize.sm },
  profileBio:    { fontSize: FontSize.sm },
  section: {
    borderRadius: 0,
    overflow:     'hidden',
  },
  sep: {
    height:           0.7,
    marginLeft:       54 + Spacing.md * 2,
  },
  footer: {
    alignItems:   'center',
    paddingVertical: Spacing.xl,
    gap:          4,
  },
  footerIcon:    { width: 48, height: 48, opacity: 0.5 },
  footerApp:     { fontSize: FontSize.sm, fontWeight: '700' },
  footerVersion: { fontSize: FontSize.xs },
});
