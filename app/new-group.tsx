// ============================================================
// New Group — 2-step creation flow
//
// Step 1 — Add Participants
//   Search contacts → tap to select (checkbox) → Next
//   Requires at least 2 participants selected.
//
// Step 2 — Group Info
//   Enter group name (required) + optional group photo
//   → Create Group → navigates to the group chat screen
// ============================================================

import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { DeviceEventEmitter } from 'react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { FontSize, Spacing, Radius } from '@/constants/theme';
import { useCustomAlert } from '@/context/AlertContext';
import { useAppTheme } from '@/hooks/useAppTheme';
import api from '@/services/api';
import Logger from '@/utils/logger';

const { width: SCREEN_W } = Dimensions.get('window');

export default function NewGroupScreen() {
  const router          = useRouter();
  const { colors, isDark } = useAppTheme();
  const { showAlert }   = useCustomAlert();
  const HDR_BG = isDark ? '#071a30' : '#083a7a';

  // ── Step state ───────────────────────────────────────────
  const [step, setStep]       = useState<1 | 2>(1);
  const slideAnim             = useRef(new Animated.Value(0)).current;

  // ── Step 1: participant search & selection ───────────────
  const [searchQuery, setSearchQuery]   = useState('');
  const [users, setUsers]               = useState<any[]>([]);
  const [selected, setSelected]         = useState<Map<number, any>>(new Map());
  const [isSearching, setIsSearching]   = useState(false);

  // ── Step 2: group details ────────────────────────────────
  const [groupName, setGroupName]       = useState('');
  const [groupPhoto, setGroupPhoto]     = useState<string | null>(null);
  const [isCreating, setIsCreating]     = useState(false);

  const nameRef = useRef<TextInput>(null);

  // ── Search users ─────────────────────────────────────────
  const searchUsers = useCallback(async (q: string) => {
    if (q.length < 1) { setUsers([]); return; }
    setIsSearching(true);
    try {
      const { data } = await api.get(`/users/search?q=${encodeURIComponent(q)}`);
      setUsers(data);
    } catch (e) {
      Logger.error('Group member search error', e);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => { searchUsers(searchQuery); }, [searchQuery]);

  // Toggle a user in/out of the selection
  const toggleUser = (user: any) => {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(user.id)) next.delete(user.id);
      else next.set(user.id, user);
      return next;
    });
  };

  // ── Slide animation ──────────────────────────────────────
  const slideToStep = (target: 1 | 2) => {
    setStep(target);
    Animated.spring(slideAnim, {
      toValue:      target === 2 ? 1 : 0,
      useNativeDriver: true,
      tension:      160,
      friction:     20,
    }).start(() => {
      if (target === 2) setTimeout(() => nameRef.current?.focus(), 100);
    });
  };

  const goNext = () => {
    if (selected.size < 1) {
      showAlert({ type: 'warning', title: 'Select Members', message: 'Please select at least 1 person to add to the group.' });
      return;
    }
    slideToStep(2);
  };

  // ── Pick group photo ──────────────────────────────────────
  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) setGroupPhoto(result.assets[0].uri);
  };

  // ── Create the group ──────────────────────────────────────
  const handleCreate = async () => {
    if (!groupName.trim()) {
      showAlert({ type: 'warning', title: 'Group Name Required', message: 'Please enter a name for the group.' });
      return;
    }

    setIsCreating(true);
    try {
      // 1. Create the group conversation
      const { data: conv } = await api.post('/conversations', {
        isGroup:        true,
        name:           groupName.trim(),
        participantIds: Array.from(selected.keys()),
      });

      // 2. Upload group photo if one was selected
      if (groupPhoto && conv.id) {
        try {
          const form = new FormData();
          form.append('avatar', { uri: groupPhoto, type: 'image/jpeg', name: 'group.jpg' } as any);
          await api.put(`/conversations/${conv.id}/avatar`, form, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        } catch {
          // Photo upload failing shouldn't block navigation
          Logger.error('Group photo upload failed (non-critical)');
        }
      }

      // 3. Notify both tabs to refresh, then navigate
      DeviceEventEmitter.emit('REFRESH_CHATS');
      DeviceEventEmitter.emit('REFRESH_GROUPS');
      router.replace(`/chat/${conv.id}`);
    } catch (e: any) {
      showAlert({ type: 'error', title: 'Failed to Create Group', message: e.message });
    } finally {
      setIsCreating(false);
    }
  };

  // ── Panel transform ──────────────────────────────────────
  const step1X = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -SCREEN_W] });
  const step2X = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [SCREEN_W, 0] });

  const selectedArr = Array.from(selected.values());

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: HDR_BG }]} edges={['top', 'bottom']}>

      {/* ── Header ────────────────────────────────────── */}
      <View style={[s.header, { backgroundColor: HDR_BG }]}>
        <Pressable
          hitSlop={16}
          onPress={() => step === 2 ? slideToStep(1) : router.back()}
          style={s.headerBack}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </Pressable>

        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>
            {step === 1 ? 'Add Participants' : 'New Group'}
          </Text>
          <Text style={s.headerSub}>
            {step === 1
              ? selected.size > 0 ? `${selected.size} selected` : 'Select people'
              : `${selected.size + 1} member${selected.size + 1 !== 1 ? 's' : ''}`}
          </Text>
        </View>

        {/* Step indicator */}
        <View style={s.stepPills}>
          {([1, 2] as const).map((n) => (
            <View
              key={n}
              style={[
                s.pill,
                {
                  backgroundColor: step >= n ? '#fff' : 'rgba(255,255,255,0.3)',
                  width: step === n ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>
      </View>

      {/* ── Slide panels ──────────────────────────────── */}
      <View style={s.slideWrap}>

        {/* ════════════════════════════════════════════
            STEP 1 — Select participants
            ════════════════════════════════════════════ */}
        <Animated.View style={[s.panel, { transform: [{ translateX: step1X }] }]}>

          {/* Selected chips row */}
          {selectedArr.length > 0 && (
            <View style={[s.chipsRow, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
              <FlatList
                horizontal
                data={selectedArr}
                keyExtractor={(u) => String(u.id)}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, paddingHorizontal: Spacing.md, paddingVertical: 8 }}
                renderItem={({ item }) => (
                  <Pressable onPress={() => toggleUser(item)} style={s.chip}>
                    <View style={[s.chipAvatar, { backgroundColor: colors.primary }]}>
                      <Text style={s.chipInitial}>
                        {(item.name || item.username)?.[0]?.toUpperCase() ?? '?'}
                      </Text>
                    </View>
                    <Text style={[s.chipName, { color: colors.text }]} numberOfLines={1}>
                      {item.name || item.username}
                    </Text>
                    <View style={[s.chipX, { backgroundColor: colors.textSecondary }]}>
                      <Ionicons name="close" size={10} color="#fff" />
                    </View>
                  </Pressable>
                )}
              />
            </View>
          )}

          {/* Search bar */}
          <View style={[s.searchBar, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
            <Ionicons name="search" size={18} color={colors.textSecondary} />
            <TextInput
              style={[s.searchInput, { color: colors.text }]}
              placeholder="Search name or username…"
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
              autoCapitalize="none"
              autoFocus
            />
            {isSearching && <ActivityIndicator size="small" color={colors.primary} />}
            {searchQuery.length > 0 && !isSearching && (
              <Pressable onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
              </Pressable>
            )}
          </View>

          {/* Results list */}
          <FlatList
            data={users}
            keyExtractor={(u) => String(u.id)}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const isSelected = selected.has(item.id);
              return (
                <Pressable
                  style={({ pressed }) => [
                    s.userRow,
                    { backgroundColor: pressed ? colors.surfaceAlt : colors.surface },
                  ]}
                  onPress={() => toggleUser(item)}>
                  <Avatar uri={item.avatar} name={item.name} size={46}
                    showOnline isOnline={item.isOnline} />
                  <View style={s.userInfo}>
                    <Text style={[s.userName, { color: colors.text }]}>
                      {item.name || item.username}
                    </Text>
                    <Text style={[s.userHandle, { color: colors.textSecondary }]}>
                      @{item.username}
                    </Text>
                  </View>
                  {/* Checkbox */}
                  <View style={[
                    s.checkbox,
                    {
                      backgroundColor: isSelected ? colors.primary : 'transparent',
                      borderColor:     isSelected ? colors.primary : colors.border,
                    },
                  ]}>
                    {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
                  </View>
                </Pressable>
              );
            }}
            ItemSeparatorComponent={() => (
              <View style={[s.sep, { backgroundColor: colors.border }]} />
            )}
            ListEmptyComponent={
              searchQuery.length > 0 && !isSearching ? (
                <View style={s.empty}>
                  <Text style={[s.emptyText, { color: colors.textSecondary }]}>
                    No contacts found for "{searchQuery}"
                  </Text>
                </View>
              ) : searchQuery.length === 0 ? (
                <View style={s.empty}>
                  <Text style={[s.emptyText, { color: colors.textSecondary }]}>
                    Type a name or username to search
                  </Text>
                </View>
              ) : null
            }
          />

          {/* Next button — fixed at bottom */}
          <Pressable
            style={[
              s.nextBtn,
              { backgroundColor: selected.size >= 1 ? colors.primary : colors.border },
            ]}
            onPress={goNext}
            disabled={selected.size < 1}>
            <Text style={[s.nextBtnText, { color: selected.size >= 1 ? '#fff' : colors.textSecondary }]}>
              Next
            </Text>
            <Ionicons name="arrow-forward" size={20}
              color={selected.size >= 1 ? '#fff' : colors.textSecondary} />
          </Pressable>
        </Animated.View>

        {/* ════════════════════════════════════════════
            STEP 2 — Group name + photo
            ════════════════════════════════════════════ */}
        <Animated.View style={[s.panel, { transform: [{ translateX: step2X }] }]}>
          <View style={s.step2Content}>

            {/* Group photo picker */}
            <Pressable onPress={pickPhoto} style={s.photoPicker}>
              {groupPhoto ? (
                <Image source={{ uri: groupPhoto }} style={s.groupPhoto} />
              ) : (
                <View style={[s.groupPhotoPlaceholder, { backgroundColor: colors.primary }]}>
                  <Ionicons name="people" size={44} color="#fff" />
                </View>
              )}
              <View style={[s.cameraOverlay, { backgroundColor: colors.primaryDark }]}>
                <Ionicons name="camera" size={18} color="#fff" />
              </View>
            </Pressable>
            <Text style={[s.photoHint, { color: colors.textSecondary }]}>
              Tap to add group icon
            </Text>

            {/* Group name input */}
            <View style={[s.nameRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="people-outline" size={20} color={colors.textSecondary} />
              <TextInput
                ref={nameRef}
                style={[s.nameInput, { color: colors.text }]}
                placeholder="Group name (required)"
                placeholderTextColor={colors.border}
                value={groupName}
                onChangeText={setGroupName}
                maxLength={60}
                returnKeyType="done"
                onSubmitEditing={handleCreate}
              />
              {groupName.length > 0 && (
                <Text style={[s.charCount, { color: colors.textSecondary }]}>
                  {60 - groupName.length}
                </Text>
              )}
            </View>

            {/* Selected members preview */}
            <View style={[s.membersPreview, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[s.membersTitle, { color: colors.textSecondary }]}>
                MEMBERS — {selectedArr.length + 1}
              </Text>
              {selectedArr.slice(0, 5).map((u) => (
                <View key={u.id} style={s.memberRow}>
                  <Avatar uri={u.avatar} name={u.name} size={32} />
                  <Text style={[s.memberName, { color: colors.text }]}>
                    {u.name || u.username}
                  </Text>
                </View>
              ))}
              {selectedArr.length > 5 && (
                <Text style={[s.moreMembers, { color: colors.textSecondary }]}>
                  +{selectedArr.length - 5} more
                </Text>
              )}
            </View>

            {/* Create button */}
            <Pressable
              style={({ pressed }) => [
                s.createBtn,
                {
                  backgroundColor: pressed ? colors.primaryDark : colors.primary,
                  opacity: isCreating ? 0.75 : 1,
                },
              ]}
              onPress={handleCreate}
              disabled={isCreating}>
              {isCreating ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={22} color="#fff" />
                  <Text style={s.createBtnText}>Create Group</Text>
                </>
              )}
            </Pressable>

          </View>
        </Animated.View>

      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:  { flex: 1 },

  // ── Header ───────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems:    'center',
    paddingHorizontal: Spacing.md,
    paddingVertical:   10,
    minHeight:     56,
    gap:           Spacing.sm,
  },
  headerBack:   { width: 36 },
  headerCenter: { flex: 1 },
  headerTitle:  { color: '#fff', fontSize: 18, fontWeight: '700' },
  headerSub:    { color: 'rgba(255,255,255,0.65)', fontSize: FontSize.xs, marginTop: 1 },
  stepPills:    { flexDirection: 'row', gap: 5, alignItems: 'center' },
  pill: {
    height: 6, borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },

  // ── Slide ────────────────────────────────────────────────
  slideWrap: { flex: 1, overflow: 'hidden' },
  panel: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
  },

  // ── Step 1 ───────────────────────────────────────────────
  chipsRow: { borderBottomWidth: 1 },
  chip: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: Radius.full, paddingRight: 8,
    overflow: 'hidden', gap: 6,
  },
  chipAvatar: {
    width: 32, height: 32, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
  },
  chipInitial: { color: '#fff', fontSize: 14, fontWeight: '700' },
  chipName:    { fontSize: FontSize.sm, maxWidth: 80 },
  chipX: {
    width: 16, height: 16, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center',
  },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    margin: Spacing.md, borderRadius: 12,
    paddingHorizontal: Spacing.md, paddingVertical: 11,
    gap: Spacing.sm, borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: FontSize.md },
  userRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: 11,
    gap: Spacing.md,
  },
  userInfo:   { flex: 1 },
  userName:   { fontSize: FontSize.md, fontWeight: '600' },
  userHandle: { fontSize: FontSize.sm },
  checkbox: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 2, justifyContent: 'center', alignItems: 'center',
  },
  sep: { height: 0.7, marginLeft: 46 + Spacing.md * 2 },
  empty: { padding: Spacing.xl, alignItems: 'center' },
  emptyText: { fontSize: FontSize.sm },
  nextBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, margin: Spacing.md,
    borderRadius: Radius.md, paddingVertical: 15,
  },
  nextBtnText: { fontSize: FontSize.md, fontWeight: '800' },

  // ── Step 2 ───────────────────────────────────────────────
  step2Content: {
    flex: 1, alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl, gap: Spacing.md,
  },
  photoPicker: { position: 'relative' },
  groupPhoto: { width: 100, height: 100, borderRadius: 50 },
  groupPhotoPlaceholder: {
    width: 100, height: 100, borderRadius: 50,
    justifyContent: 'center', alignItems: 'center',
  },
  cameraOverlay: {
    position: 'absolute', bottom: 2, right: 2,
    width: 32, height: 32, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  photoHint: { fontSize: FontSize.sm },
  nameRow: {
    width: '100%', flexDirection: 'row', alignItems: 'center',
    borderRadius: Radius.lg, paddingHorizontal: Spacing.md, paddingVertical: 14,
    gap: Spacing.sm, borderWidth: 1.5,
  },
  nameInput: { flex: 1, fontSize: FontSize.lg, fontWeight: '500' },
  charCount: { fontSize: FontSize.xs, fontWeight: '700' },
  membersPreview: {
    width: '100%', borderRadius: Radius.lg, padding: Spacing.md,
    borderWidth: 1, gap: 8,
  },
  membersTitle: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  memberRow:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  memberName:  { fontSize: FontSize.sm, fontWeight: '500' },
  moreMembers: { fontSize: FontSize.xs },
  createBtn: {
    width: '100%', flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: Spacing.sm,
    borderRadius: Radius.md, paddingVertical: 16, marginTop: Spacing.sm,
  },
  createBtnText: { color: '#fff', fontSize: FontSize.md, fontWeight: '800' },
});
