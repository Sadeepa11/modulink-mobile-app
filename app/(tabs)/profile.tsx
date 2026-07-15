// ============================================================
// Profile Screen — themed, custom alerts, dark/light toggle
// ============================================================

import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { FontSize, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useCustomAlert } from '@/context/AlertContext';
import { useAppColorScheme } from '@/context/ThemeContext';
import { useAppTheme } from '@/hooks/useAppTheme';
import api, { API_BASE_URL } from '@/services/api';
import Logger from '@/utils/logger';

const SCREEN_W = Dimensions.get('window').width;
const GRID_SIZE = SCREEN_W / 3;

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuth();
  const { colors, isDark } = useAppTheme();
  const { toggleTheme } = useAppColorScheme();
  const { showAlert } = useCustomAlert();

  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    try {
      const [profRes, postsRes] = await Promise.all([
        api.get('/auth/me'),
        api.get(`/posts/user/${user?.id}`),
      ]);
      setProfile(profRes.data);
      setPosts(postsRes.data);
    } catch (e) { Logger.error('Failed to load profile', e); }
    finally { setIsLoading(false); }
  }, [user?.id, user]);

  useEffect(() => { load(); }, [load]);

  const openEdit = () => {
    setEditName(profile?.name || '');
    setEditBio(profile?.bio || '');
    setShowEdit(true);
  };

  const saveProfile = async () => {
    setIsSaving(true);
    try {
      const res = await api.put('/users/profile', { name: editName, bio: editBio });
      updateUser(res.data);
      setProfile((p: any) => ({ ...p, ...res.data }));
      setShowEdit(false);
      showAlert({ type: 'success', title: 'Saved!', message: 'Your profile has been updated.' });
    } catch {
      showAlert({ type: 'error', title: 'Error', message: 'Failed to save profile.' });
    } finally { setIsSaving(false); }
  };

  const changeAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    try {
      const form = new FormData();
      form.append('avatar', { uri: result.assets[0].uri, type: 'image/jpeg', name: 'avatar.jpg' } as any);
      const res = await api.put('/users/profile', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      updateUser(res.data);
      setProfile((p: any) => ({ ...p, avatar: res.data.avatar }));
      showAlert({ type: 'success', title: 'Updated', message: 'Profile picture changed.' });
    } catch {
      showAlert({ type: 'error', title: 'Error', message: 'Avatar update failed.' });
    }
  };

  const confirmLogout = () => {
    showAlert({
      type: 'confirm',
      title: 'Log Out',
      message: 'You will need to sign in again to access your account.',
      confirmText: 'Log Out',
      cancelText: 'Stay',
      destructive: true,
      onConfirm: logout,
    });
  };

  const HDR_BG = isDark ? '#071a30' : '#083a7a';

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: HDR_BG }]}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  const Header = (
    <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      {/* Avatar + Stats */}
      <View style={styles.topRow}>
        <Pressable onPress={changeAvatar} style={styles.avatarWrap}>
          <Avatar uri={profile?.avatar} name={profile?.name} size={84} />
          <View style={[styles.cameraBadge, { borderColor: isDark ? '#071524' : colors.surface }]}>
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.primary }]} />
            <Ionicons name="camera" size={14} color={colors.textOnPrimary} style={{ zIndex: 1 }} />
          </View>
        </Pressable>
        <View style={styles.stats}>
          {[
            { label: 'Posts', value: profile?._count?.posts ?? 0 },
            { label: 'Followers', value: profile?._count?.followers ?? 0 },
            { label: 'Following', value: profile?._count?.following ?? 0 },
          ].map(({ label, value }) => (
            <View key={label} style={styles.stat}>
              <Text style={[styles.statNum, { color: colors.text }]}>{value}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Name / Bio */}
      <Text style={[styles.displayName, { color: colors.text }]}>{profile?.name || profile?.username}</Text>
      <Text style={[styles.handle, { color: colors.textSecondary }]}>@{profile?.username}</Text>
      {profile?.bio ? <Text style={[styles.bio, { color: colors.text }]}>{profile.bio}</Text> : null}

      {/* Edit + Logout */}
      <View style={styles.btnRow}>
        <Pressable style={[styles.editBtn, { borderColor: colors.border }]} onPress={openEdit}>
          <Text style={[styles.editBtnTxt, { color: colors.text }]}>Edit Profile</Text>
        </Pressable>
        <Pressable style={[styles.iconBtn, { borderColor: colors.border }]} onPress={confirmLogout}>
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
        </Pressable>
      </View>

      {/* ── Dark / Light Mode Toggle ─────────────────────── */}
      <View style={[styles.themeRow, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
        <Ionicons
          name={isDark ? 'moon' : 'sunny'}
          size={20}
          color={isDark ? colors.accentLight : colors.accent}
        />
        <Text style={[styles.themeLabel, { color: colors.text }]}>
          {isDark ? 'Dark Mode' : 'Light Mode'}
        </Text>
        <Switch
          value={isDark}
          onValueChange={toggleTheme}
          trackColor={{ false: colors.border, true: colors.secondary }}
          thumbColor={isDark ? colors.accentLight : colors.primary}
          ios_backgroundColor={colors.border}
        />
      </View>

      {/* Grid divider */}
      <View style={[styles.gridDiv, { borderTopColor: colors.border }]}>
        <Ionicons name="grid" size={20} color={colors.primary} />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#071524' : colors.surface }]} edges={['bottom']}>
      <FlatList
        data={posts}
        keyExtractor={(item) => String(item.id)}
        numColumns={3}
        renderItem={({ item }) => (
          <View style={styles.gridItem}>
            {item.mediaUrl
              ? <Image source={{ uri: (item.mediaUrl.startsWith('http') || item.mediaUrl.startsWith('data:') ? item.mediaUrl : `${API_BASE_URL}${item.mediaUrl}`) }}
                  style={[styles.gridImg, { backgroundColor: colors.surfaceAlt }]} />
              : <View style={[styles.gridImg, styles.txtPost, { backgroundColor: colors.surfaceAlt }]}>
                  <Text style={[styles.txtPreview, { color: colors.text }]} numberOfLines={4}>{item.caption}</Text>
                </View>}
          </View>
        )}
        ListHeaderComponent={Header}
        ListEmptyComponent={
          <View style={styles.emptyPosts}>
            <Text style={styles.emptyEmoji}>📷</Text>
            <Text style={[{ color: colors.textSecondary, fontSize: FontSize.md }]}>No posts yet</Text>
          </View>
        }
      />

      {/* Edit Profile Modal */}
      <Modal visible={showEdit} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowEdit(false)}>
        <SafeAreaView style={[styles.modalWrap, { backgroundColor: colors.surface }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Pressable onPress={() => setShowEdit(false)}>
              <Text style={{ color: colors.textSecondary, fontSize: FontSize.md }}>Cancel</Text>
            </Pressable>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Profile</Text>
            <Pressable onPress={saveProfile} disabled={isSaving}>
              <Text style={{ fontSize: FontSize.md, fontWeight: '700', color: colors.primary, opacity: isSaving ? 0.5 : 1 }}>Save</Text>
            </Pressable>
          </View>
          <View style={{ padding: Spacing.md }}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Name</Text>
            <TextInput
              style={[styles.inputField, { backgroundColor: colors.surfaceAlt, borderColor: colors.border, color: colors.text }]}
              value={editName} onChangeText={setEditName}
              placeholder="Your full name" placeholderTextColor={colors.textSecondary}
            />
            <Text style={[styles.inputLabel, { color: colors.text }]}>Bio</Text>
            <TextInput
              style={[styles.inputField, styles.bioInput, { backgroundColor: colors.surfaceAlt, borderColor: colors.border, color: colors.text }]}
              value={editBio} onChangeText={setEditBio}
              placeholder="Tell people about yourself" placeholderTextColor={colors.textSecondary}
              multiline maxLength={150}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: Spacing.md, borderBottomWidth: 1 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xl, marginBottom: Spacing.md },
  avatarWrap: { position: 'relative' },
  cameraBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 26, height: 26, borderRadius: 13,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, overflow: 'hidden',
  },
  stats: { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center' },
  statNum: { fontSize: FontSize.lg, fontWeight: '800' },
  statLabel: { fontSize: FontSize.xs, marginTop: 2 },
  displayName: { fontSize: FontSize.md, fontWeight: '700' },
  handle: { fontSize: FontSize.sm, marginBottom: 4 },
  bio: { fontSize: FontSize.sm, lineHeight: 20, marginBottom: Spacing.sm },
  btnRow: { flexDirection: 'row', gap: Spacing.sm, marginVertical: Spacing.sm },
  editBtn: { flex: 1, borderWidth: 1.5, borderRadius: 10, paddingVertical: 9, alignItems: 'center' },
  editBtnTxt: { fontSize: FontSize.sm, fontWeight: '700' },
  iconBtn: { width: 42, borderWidth: 1.5, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  themeRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: 12,
    borderRadius: 12, borderWidth: 1, marginVertical: Spacing.sm, gap: Spacing.sm,
  },
  themeLabel: { flex: 1, fontSize: FontSize.md, fontWeight: '600' },
  gridDiv: { alignItems: 'center', paddingTop: Spacing.sm, borderTopWidth: 1, marginTop: Spacing.sm },
  gridItem: { width: GRID_SIZE, height: GRID_SIZE, padding: 1 },
  gridImg: { width: '100%', height: '100%' },
  txtPost: { justifyContent: 'center', alignItems: 'center', padding: 6 },
  txtPreview: { fontSize: FontSize.xs, textAlign: 'center' },
  emptyPosts: { alignItems: 'center', paddingTop: 40 },
  emptyEmoji: { fontSize: 40, marginBottom: Spacing.sm },
  modalWrap: { flex: 1 },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, borderBottomWidth: 1,
  },
  modalTitle: { fontSize: FontSize.lg, fontWeight: '700' },
  inputLabel: { fontSize: FontSize.sm, fontWeight: '700', marginBottom: 6, marginTop: Spacing.sm },
  inputField: { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: Spacing.md, paddingVertical: 13, fontSize: FontSize.md },
  bioInput: { minHeight: 80, textAlignVertical: 'top' },
});
