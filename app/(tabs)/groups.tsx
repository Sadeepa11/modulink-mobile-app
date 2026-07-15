// ============================================================
// Groups Tab Screen
//
// Shows all group conversations the user belongs to.
// Layout mirrors the Chats screen but filters isGroup === true.
//
// Features:
//   • Dark header with inline search (same as Chats tab)
//   • ⋮ three-dots menu → New Group, Group settings
//   • Pull-to-refresh
//   • Real-time unread badge updates via Socket.IO
//   • FAB to create a new group
//   • Empty state with CTA
// ============================================================

import { useFocusEffect } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  DeviceEventEmitter,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DropdownMenu } from '@/components/DropdownMenu';
import { GroupListItem } from '@/components/GroupListItem';
import { FontSize, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { useCustomAlert } from '@/context/AlertContext';
import { useAppTheme } from '@/hooks/useAppTheme';
import api from '@/services/api';
import Logger from '@/utils/logger';

export default function GroupsScreen() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { showAlert } = useCustomAlert();

  const HDR_BG = isDark ? '#071a30' : '#083a7a';

  const [allGroups, setAllGroups]     = useState<any[]>([]);
  const [filtered, setFiltered]       = useState<any[]>([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen, setMenuOpen]       = useState(false);

  const searchRef = useRef<TextInput>(null);

  // ── Fetch only group conversations ───────────────────────
  // silent=true → no spinner, background refresh
  const fetchGroups = useCallback(async (silent = false) => {
    if (!user) {
      if (!silent) setIsLoading(false);
      setIsRefreshing(false);
      return;
    }
    try {
      const { data } = await api.get('/conversations');
      const groups = (data as any[]).filter((c) => c.isGroup === true);
      setAllGroups(groups);
      setFiltered(groups);
    } catch (e) {
      Logger.error('Failed to fetch groups', e);
    } finally {
      if (!silent) setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user]);

  // Initial load
  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  // Refresh when tab comes back into focus
  useFocusEffect(
    useCallback(() => {
      fetchGroups(true);
    }, [fetchGroups])
  );

  // Refresh when another screen emits REFRESH_GROUPS (new group created)
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('REFRESH_GROUPS', () => {
      fetchGroups(true);
    });
    return () => sub.remove();
  }, [fetchGroups]);

  // ── Real-time: update last message + unread count ─────────
  useEffect(() => {
    if (!socket) return;
    const handler = (message: any) => {
      setAllGroups((prev) => {
        const updated = prev.map((g) => {
          if (g.id !== message.conversationId) return g;
          return {
            ...g,
            messages:    [message],
            updatedAt:   message.createdAt,
            unreadCount: message.senderId !== user?.id
              ? (g.unreadCount ?? 0) + 1
              : g.unreadCount,
          };
        });
        return [...updated].sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      });
    };
    socket.on('new_message', handler);
    return () => { socket.off('new_message', handler); };
  }, [socket, user?.id]);

  // ── Client-side search ────────────────────────────────────
  useEffect(() => {
    if (!searchQuery.trim()) { setFiltered(allGroups); return; }
    const q = searchQuery.toLowerCase();
    setFiltered(allGroups.filter((g) => (g.name || '').toLowerCase().includes(q)));
  }, [searchQuery, allGroups]);

  const openSearch = () => {
    setIsSearching(true);
    setTimeout(() => searchRef.current?.focus(), 50);
  };

  const closeSearch = () => {
    setSearchQuery('');
    setIsSearching(false);
  };

  const handleOpenGroup = (group: any) => {
    // Clear local unread count immediately
    setAllGroups((prev) =>
      prev.map((g) => g.id === group.id ? { ...g, unreadCount: 0 } : g)
    );
    router.push(`/chat/${group.id}`);
  };

  const totalUnread = allGroups.reduce((s, g) => s + (g.unreadCount ?? 0), 0);

  if (isLoading) {
    return (
      <View style={[s.center, { backgroundColor: HDR_BG }]}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: HDR_BG }]} edges={['top']}>

      {/* ── Header ──────────────────────────────────────── */}
      <View style={[s.header, { backgroundColor: HDR_BG }]}>

        {/* Left: close search or placeholder */}
        <Pressable
          hitSlop={12}
          onPress={isSearching ? closeSearch : undefined}
          style={s.headerLeft}>
          <Ionicons name={isSearching ? 'close' : 'people'} size={24} color="#fff" />
        </Pressable>

        {/* Center: title or search input */}
        <View style={s.headerCenter}>
          {isSearching ? (
            <TextInput
              ref={searchRef}
              style={[s.searchInput, { color: '#fff' }]}
              placeholder="Search groups…"
              placeholderTextColor="rgba(255,255,255,0.55)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
            />
          ) : (
            <View>
              <Text style={s.headerTitle}>Groups</Text>
              {totalUnread > 0 && (
                <Text style={s.headerSub}>{totalUnread} unread</Text>
              )}
            </View>
          )}
        </View>

        {/* Right: search + create + menu */}
        <View style={s.headerRight}>
          <Pressable hitSlop={12} onPress={isSearching ? closeSearch : openSearch} style={s.iconBtn}>
            <Ionicons name={isSearching ? 'close-circle' : 'search'} size={22} color="#fff" />
          </Pressable>
          {!isSearching && (
            <>
              {/* New Group shortcut */}
              <Pressable hitSlop={12} onPress={() => router.push('/new-group')} style={s.iconBtn}>
                <Ionicons name="add-circle-outline" size={24} color="#fff" />
              </Pressable>
              <Pressable hitSlop={12} onPress={() => setMenuOpen(true)} style={s.iconBtn}>
                <Ionicons name="ellipsis-vertical" size={22} color="#fff" />
              </Pressable>
            </>
          )}
        </View>
      </View>

      {/* Dropdown menu */}
      <DropdownMenu
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        anchorTop={56}
        anchorRight={4}
        items={[
          {
            label:   'New Group',
            icon:    'people-outline',
            onPress: () => router.push('/new-group'),
          },
          {
            label:   'Group Invite Link',
            icon:    'link-outline',
            onPress: () =>
              showAlert({ type: 'info', title: 'Coming Soon', message: 'Group invite links are coming in a future update.' }),
          },
          {
            label:   'Settings',
            icon:    'settings-outline',
            onPress: () => router.push('/settings'),
          },
        ]}
      />

      {/* ── Group List ──────────────────────────────────── */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        style={{ backgroundColor: colors.surface }}
        renderItem={({ item }) => (
          <GroupListItem
            conversation={item}
            currentUserId={user?.id || 0}
            onPress={() => handleOpenGroup(item)}
            onLongPress={() =>
              showAlert({
                type:        'confirm',
                title:       item.name || 'Group Chat',
                message:     `${item.participants?.length ?? 0} members`,
                confirmText: 'Open',
                cancelText:  'Cancel',
                onConfirm:   () => handleOpenGroup(item),
              })
            }
          />
        )}
        ItemSeparatorComponent={() => (
          <View style={[s.sep, { backgroundColor: colors.border }]} />
        )}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => { setIsRefreshing(true); fetchGroups(); }}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListHeaderComponent={
          allGroups.length > 0 ? (
            <View style={[s.statsBar, { backgroundColor: colors.surfaceAlt, borderBottomColor: colors.border }]}>
              <Ionicons name="people-circle-outline" size={16} color={colors.textSecondary} />
              <Text style={[s.statsText, { color: colors.textSecondary }]}>
                {allGroups.length} group{allGroups.length !== 1 ? 's' : ''}
              </Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={s.empty}>
            <View style={[s.emptyIconWrap, { backgroundColor: colors.surfaceAlt }]}>
              <Ionicons name="people" size={52} color={colors.border} />
            </View>
            <Text style={[s.emptyTitle, { color: colors.text }]}>No Groups Yet</Text>
            <Text style={[s.emptySub, { color: colors.textSecondary }]}>
              Create a group to chat with multiple people at once
            </Text>
            <Pressable
              style={({ pressed }) => [
                s.emptyBtn,
                { backgroundColor: pressed ? colors.primaryDark : colors.primary },
              ]}
              onPress={() => router.push('/new-group')}>
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={s.emptyBtnText}>Create a Group</Text>
            </Pressable>
          </View>
        }
        contentContainerStyle={filtered.length === 0 ? { flex: 1 } : undefined}
        keyboardShouldPersistTaps="handled"
      />

      {/* ── FAB ─────────────────────────────────────────── */}
      {!isSearching && filtered.length > 0 && (
        <Pressable
          style={({ pressed }) => [s.fab, { transform: [{ scale: pressed ? 0.93 : 1 }] }]}
          onPress={() => router.push('/new-group')}>
          <View style={[StyleSheet.absoluteFill, { borderRadius: 29, backgroundColor: colors.primary }]} />
          <Ionicons name="people" size={24} color={colors.textOnPrimary} style={{ zIndex: 1 }} />
        </Pressable>
      )}

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // ── Header ───────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems:    'center',
    paddingHorizontal: Spacing.md,
    paddingVertical:   10,
    minHeight:     56,
    gap:           Spacing.sm,
  },
  headerLeft:   { width: 36, alignItems: 'flex-start' },
  headerCenter: { flex: 1, justifyContent: 'center' },
  headerTitle:  { color: '#fff', fontSize: 19, fontWeight: '700', letterSpacing: 0.2 },
  headerSub:    { color: 'rgba(255,255,255,0.65)', fontSize: FontSize.xs, marginTop: 1 },
  searchInput:  { fontSize: FontSize.md, paddingVertical: 2 },
  headerRight:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconBtn:      { padding: 6 },

  // ── Stats bar ────────────────────────────────────────────
  statsBar: {
    flexDirection:  'row',
    alignItems:     'center',
    paddingHorizontal: Spacing.md,
    paddingVertical:   8,
    gap:            6,
    borderBottomWidth: 1,
  },
  statsText: { fontSize: FontSize.sm, fontWeight: '600' },

  // ── Separator ────────────────────────────────────────────
  sep: { height: 0.7, marginLeft: 54 + Spacing.md + 12 },

  // ── Empty state ──────────────────────────────────────────
  empty: {
    flex:       1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: 80,
    gap:        Spacing.md,
  },
  emptyIconWrap: {
    width: 100, height: 100, borderRadius: 50,
    justifyContent: 'center', alignItems: 'center',
  },
  emptyTitle:   { fontSize: FontSize.xl, fontWeight: '700', textAlign: 'center' },
  emptySub:     { fontSize: FontSize.sm, textAlign: 'center', lineHeight: 20 },
  emptyBtn: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical:   12,
    borderRadius:  50,
    marginTop:     Spacing.sm,
  },
  emptyBtnText: { color: '#fff', fontSize: FontSize.md, fontWeight: '700' },

  // ── FAB ──────────────────────────────────────────────────
  fab: {
    position:  'absolute',
    bottom:    Spacing.xl,
    right:     Spacing.lg,
    width:     58,
    height:    58,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems:    'center',
    elevation:     8,
    shadowColor:   '#083a7a',
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius:  8,
  },
});
