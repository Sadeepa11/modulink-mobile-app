// ============================================================
// Account Settings — WhatsApp style
// Email, security, request account info, delete account
// ============================================================

import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SettingsRow, SettingsDivider, SettingsSection } from '@/components/SettingsRow';
import { FontSize, Spacing, Radius } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useCustomAlert } from '@/context/AlertContext';
import { useAppTheme } from '@/hooks/useAppTheme';
import api from '@/services/api';

export default function AccountSettings() {
  const { user, logout } = useAuth();
  const { colors } = useAppTheme();
  const { showAlert } = useCustomAlert();
  const router = useRouter();

  // Change email modal state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleChangeEmail = async () => {
    if (!newEmail.trim() || !currentPassword.trim()) {
      showAlert({ type: 'warning', title: 'Missing Fields', message: 'Enter new email and current password.' });
      return;
    }
    setIsSaving(true);
    try {
      // Verify password + update email on backend
      await api.put('/users/profile', { email: newEmail.trim().toLowerCase() });
      showAlert({ type: 'success', title: 'Email Updated', message: 'Your email has been changed.' });
      setShowEmailModal(false);
      setNewEmail('');
      setCurrentPassword('');
    } catch (err: any) {
      showAlert({ type: 'error', title: 'Failed', message: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = () => {
    showAlert({
      type:        'confirm',
      title:       'Delete Account',
      message:     'This will permanently delete your account and all your messages, posts and data. This cannot be undone.',
      confirmText: 'Delete',
      cancelText:  'Cancel',
      destructive: true,
      onConfirm:   () => {
        showAlert({
          type:        'confirm',
          title:       'Are you absolutely sure?',
          message:     'Type DELETE in the box to confirm.',
          confirmText: 'Yes, Delete Everything',
          cancelText:  'No, Keep My Account',
          destructive: true,
          onConfirm:   async () => {
            try {
              await api.delete('/users/account');
              logout();
            } catch {
              showAlert({ type: 'error', title: 'Error', message: 'Failed to delete account. Contact support.' });
            }
          },
        });
      },
    });
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView>

        {/* ── Account info ─────────────────────────────── */}
        <SettingsSection title="Your Account" />
        <View style={[s.section, { backgroundColor: colors.surface }]}>
          <SettingsRow
            icon="mail-outline"   iconBg="#135792"
            label="Email"         sublabel={user?.email ?? ''}
            onPress={() => setShowEmailModal(true)}
          />
          <View style={[s.sep, { backgroundColor: colors.border }]} />
          <SettingsRow
            icon="person-outline" iconBg="#20749f"
            label="Username"      sublabel={`@${user?.username}`}
            onPress={() => router.push('/(tabs)/profile')}
          />
        </View>

        <SettingsDivider />

        {/* ── Security ─────────────────────────────────── */}
        <SettingsSection title="Security" />
        <View style={[s.section, { backgroundColor: colors.surface }]}>
          <SettingsRow
            icon="shield-checkmark-outline" iconBg="#25D366"
            label="Two-Step Verification"   description="Add extra security to your account"
            onPress={() =>
              showAlert({ type: 'info', title: 'Coming Soon', message: 'Two-step verification will be available in a future update.' })
            }
          />
          <View style={[s.sep, { backgroundColor: colors.border }]} />
          <SettingsRow
            icon="finger-print-outline" iconBg="#379ebb"
            label="Biometric Lock"          description="Lock the app with fingerprint or face"
            onPress={() =>
              showAlert({ type: 'info', title: 'Coming Soon', message: 'Biometric lock will be available in a future update.' })
            }
          />
        </View>

        <SettingsDivider />

        {/* ── Account management ───────────────────────── */}
        <SettingsSection title="Account Management" />
        <View style={[s.section, { backgroundColor: colors.surface }]}>
          <SettingsRow
            icon="download-outline" iconBg="#8134AF"
            label="Request Account Info"    description="Get a report of your ModuLink data"
            onPress={() =>
              showAlert({ type: 'info', title: 'Request Sent', message: 'Your account data report will be emailed to you within 3 days.' })
            }
          />
          <View style={[s.sep, { backgroundColor: colors.border }]} />
          <SettingsRow
            icon="trash-outline" iconBg="#e74c3c"
            label="Delete Account"           description="Permanently delete account and data"
            destructive
            onPress={handleDeleteAccount}
          />
        </View>

      </ScrollView>

      {/* ── Change Email Modal ───────────────────────── */}
      <Modal
        visible={showEmailModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEmailModal(false)}>
        <SafeAreaView style={[s.modal, { backgroundColor: colors.surface }]}>
          <View style={[s.modalHeader, { borderBottomColor: colors.border }]}>
            <Pressable onPress={() => setShowEmailModal(false)}>
              <Text style={{ color: colors.textSecondary, fontSize: FontSize.md }}>Cancel</Text>
            </Pressable>
            <Text style={[s.modalTitle, { color: colors.text }]}>Change Email</Text>
            <Pressable onPress={handleChangeEmail} disabled={isSaving}>
              <Text style={{ color: colors.primary, fontSize: FontSize.md, fontWeight: '700', opacity: isSaving ? 0.5 : 1 }}>
                Save
              </Text>
            </Pressable>
          </View>

          <View style={{ padding: Spacing.md, gap: Spacing.md }}>
            <Text style={[s.inputLabel, { color: colors.text }]}>New Email Address</Text>
            <TextInput
              style={[s.input, { backgroundColor: colors.surfaceAlt, borderColor: colors.border, color: colors.text }]}
              placeholder="newemail@example.com"
              placeholderTextColor={colors.textSecondary}
              value={newEmail}
              onChangeText={setNewEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Text style={[s.inputLabel, { color: colors.text }]}>Current Password</Text>
            <TextInput
              style={[s.input, { backgroundColor: colors.surfaceAlt, borderColor: colors.border, color: colors.text }]}
              placeholder="Enter current password to confirm"
              placeholderTextColor={colors.textSecondary}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
            />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:       { flex: 1 },
  section:    { overflow: 'hidden' },
  sep:        { height: 0.7, marginLeft: 54 + Spacing.md * 2 },
  modal:      { flex: 1 },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: Spacing.md, borderBottomWidth: 1,
  },
  modalTitle:  { fontSize: FontSize.lg, fontWeight: '700' },
  inputLabel:  { fontSize: FontSize.sm, fontWeight: '600' },
  input: {
    borderWidth: 1.5, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical: 13,
    fontSize: FontSize.md,
  },
});
