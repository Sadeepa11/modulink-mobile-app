// ============================================================
// Chats Screen — Telegram-style UI
//
// Layout:
//   ┌──────────────────────────────────────────────────────┐
//   │  ≡  ModuLink / [🔍 Search…]         [🔍]  [✏️]     │  ← Themed header
//   ├──────────────────────────────────────────────────────┤
//   │  Chat row (avatar, name, preview, badge, time)       │
//   │  Chat row ...                                        │
//   └──────────────────────────────────────────────────────┘  ← FAB ✏️
//
// Features:
//   • Inline search: tapping 🔍 slides search into the header
//   • Unread badge per conversation (from backend unreadCount)
//   • Real-time update via Socket.IO on new messages
//   • Pull-to-refresh
//   • FAB for new chat
// ============================================================

import { useFocusEffect } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
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

import { ChatActionMenu } from '@/components/ChatActionMenu';
import { DropdownMenu } from '@/components/DropdownMenu';
import { ChatListItem } from '@/components/ChatListItem';
import { FontSize, Spacing, Radius } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { useAppTheme } from '@/hooks/useAppTheme';
import api from '@/services/api';
import Logger from '@/utils/logger';
import {
  ChatMetaMap,
  ConvMeta,
  loadChatMeta,
  updateMeta,
  isMuted,
} from '@/utils/chatMeta';

export default function ChatsScreen() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const router = useRouter();
  const { colors, isDark } = useAppTheme();

  const [conversations, setConversations] = useState<any[]>([]);
  const [filtered,      setFiltered]      = useState<any[]>([]);
  const [isLoading,     setIsLoading]     = useState(true);
  const [isRefreshing,  setIsRefreshing]  = useState(false);
  const [chatMeta,      setChatMeta]      = useState<ChatMetaMap>({});
  const [actionTarget,  setActionTarget]  = useState<any | null>(null);

  // ── Inline search state ───────────────────────────────────
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen,    setMenuOpen]    = useState(false);
  const searchRef = useRef<TextInput>(null);
  const searchAnim = useRef(new Animated.Value(0)).current; // 0 = title, 1 = search

  const openSearch = () => {
    setIsSearching(true);
    Animated.spring(searchAnim, { toValue: 1, useNativeDriver: true, tension: 200, friction: 18 }).start();
    setTimeout(() => searchRef.current?.focus(), 50);
  };

  const closeSearch = () => {
    setSearchQuery('');
    setIsSearching(false);
    Animated.spring(searchAnim, { toValue: 0, useNativeDriver: true, tension: 200, friction: 18 }).start();
  };

  // ── Data fetching ─────────────────────────────────────────
  // silent=true → no spinner, background refresh (focus / events)
  const fetchConversations = useCallback(async (silent = false) => {
    if (!user) {
      if (!silent) setIsLoading(false);
      setIsRefreshing(false);
      return;
    }
    try {
      const { data } = await api.get('/conversations');
      const dms = (data as any[]).filter(c => !c.isGroup && c.messages?.length > 0);
      setConversations(dms);
      setFiltered(dms);
    } catch (e) {
      Logger.error('Failed to fetch conversations', e);
    } finally {
      if (!silent) setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user]);

  // Initial load — also load chat meta
  useEffect(() => {
    fetchConversations();
    loadChatMeta().then(setChatMeta);
  }, [fetchConversations]);

  // Refresh when tab comes back into focus (navigation returns from new-chat / chat / etc.)
  useFocusEffect(
    useCallback(() => {
      fetchConversations(true);
    }, [fetchConversations])
  );

  // Refresh when another screen emits REFRESH_CHATS (group created, new DM, etc.)
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('REFRESH_CHATS', () => {
      fetchConversations(true);
    });
    return () => sub.remove();
  }, [fetchConversations]);

  // ── Real-time: update preview + unread count ─────────────
  useEffect(() => {
    if (!socket) return;

    const handler = (message: any) => {
      setConversations((prev) => {
        const updated = prev.map((c) => {
          if (c.id !== message.conversationId) return c;
          const isFromOther = message.senderId !== user?.id;
          return {
            ...c,
            messages:    [message],
            updatedAt:   message.createdAt,
            // Increment unread count only for messages from others
            unreadCount: isFromOther ? (c.unreadCount ?? 0) + 1 : c.unreadCount,
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

  // ── Client-side search filter ─────────────────────────────
  useEffect(() => {
    if (!searchQuery.trim()) { setFiltered(conversations); return; }
    const q = searchQuery.toLowerCase();
    setFiltered(conversations.filter((c) => {
      const other = c.participants?.find((p: any) => p.user.id !== user?.id);
      const name  = c.isGroup
        ? (c.name || '').toLowerCase()
        : (other?.user?.name || other?.user?.username || '').toLowerCase();
      return name.includes(q);
    }));
  }, [searchQuery, conversations, user?.id]);

  // Clear unread count when user opens a chat
  const handleOpenChat = (conv: any) => {
    setConversations((prev) =>
      prev.map((c) => c.id === conv.id ? { ...c, unreadCount: 0 } : c)
    );
    router.push(`/chat/${conv.id}`);
  };

  // ── Chat meta helpers ─────────────────────────────────────
  const getMeta = (id: any): ConvMeta =>
    chatMeta[String(id)] ?? { pinned: false, muteUntil: null, archived: false, locked: false };

  const applyMeta = async (id: any, patch: Partial<ConvMeta>) => {
    const updated = await updateMeta(id, patch);
    setChatMeta(updated);
  };

  // ── Sorted + filtered list: pinned first, archived excluded
  const displayList = useMemo(() => {
    const visible = filtered.filter(c => !getMeta(c.id).archived);
    const pinned   = visible.filter(c =>  getMeta(c.id).pinned);
    const unpinned = visible.filter(c => !getMeta(c.id).pinned);
    return [...pinned, ...unpinned];
  }, [filtered, chatMeta]);

  const archivedCount = useMemo(
    () => conversations.filter(c => getMeta(c.id).archived).length,
    [conversations, chatMeta],
  );

  // ── Total unread for the tab badge ────────────────────────
  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0);

  const HDR_BG = isDark ? '#071a30' : '#083a7a';

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

        {/* LEFT: hamburger (normal) or X (search) */}
        <Pressable
          hitSlop={12}
          onPress={isSearching ? closeSearch : undefined}
          style={s.headerLeft}>
          <Ionicons
            name={isSearching ? 'close' : 'menu'}
            size={26}
            color="#fff"
          />
        </Pressable>

        {/* CENTER: title OR search input */}
        <View style={s.headerCenter}>
          {isSearching ? (
            // Search input replaces the title
            <TextInput
              ref={searchRef}
              style={[s.searchInput, { color: '#fff' }]}
              placeholder="Search conversations…"
              placeholderTextColor="rgba(255,255,255,0.55)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
            />
          ) : (
            <View>
              <Text style={s.headerTitle}>ModuLink</Text>
              {totalUnread > 0 && (
                <Text style={s.headerSubtitle}>{totalUnread} unread</Text>
              )}
            </View>
          )}
        </View>

        {/* RIGHT: search + compose + three-dots menu */}
        <View style={s.headerRight}>
          <Pressable hitSlop={12} onPress={isSearching ? closeSearch : openSearch} style={s.iconBtn}>
            <Ionicons name={isSearching ? 'close-circle' : 'search'} size={22} color="#fff" />
          </Pressable>
          {!isSearching && (
            <>
              <Pressable hitSlop={12} onPress={() => router.push('/new-chat')} style={s.iconBtn}>
                <Ionicons name="create-outline" size={24} color="#fff" />
              </Pressable>
              {/* Three-dots ⋮ button — opens WhatsApp-style dropdown */}
              <Pressable hitSlop={12} onPress={() => setMenuOpen(true)} style={s.iconBtn}>
                <Ionicons name="ellipsis-vertical" size={22} color="#fff" />
              </Pressable>
            </>
          )}
        </View>
      </View>

      {/* ── Dropdown menu ───────────────────────────────── */}
      <DropdownMenu
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        anchorTop={56}
        anchorRight={4}
        items={[
          { label: 'New Group',        icon: 'people-outline',         onPress: () => router.push('/new-group') },
          { label: 'Starred Messages', icon: 'star-outline',           onPress: () => router.push('/starred-messages') },
          { label: 'Settings',         icon: 'settings-outline',       onPress: () => router.push('/settings') },
        ]}
      />

      {/* ── Chat List ────────────────────────────────────── */}
      <FlatList
        data={displayList}
        keyExtractor={(item) => String(item.id)}
        style={{ backgroundColor: colors.surface }}
        ListHeaderComponent={
          /* ── "Me" / Saved Messages tile — always pinned at top ── */
          <Pressable
            onPress={() => router.push('/saved-messages')}
            style={({ pressed }) => [s.meTile, { backgroundColor: pressed ? colors.surfaceAlt : colors.surface }]}>
            <View style={[s.meAvatar, { backgroundColor: colors.primary }]}>
              <Ionicons name="bookmark" size={24} color="#fff" />
            </View>
            <View style={s.meInfo}>
              <Text style={[s.meName, { color: colors.text }]}>Saved Messages</Text>
              <Text style={[s.meSub,  { color: colors.textSecondary }]}>Your personal notes</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.border} />
          </Pressable>
        }
        renderItem={({ item }) => {
          const meta = getMeta(item.id);
          return (
            <ChatListItem
              conversation={item}
              currentUserId={user?.id || 0}
              meta={meta}
              onPress={() => {
                if (meta.locked) {
                  Alert.alert('🔒 Locked Chat', 'This chat is locked.', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Unlock', onPress: () => handleOpenChat(item) },
                  ]);
                  return;
                }
                handleOpenChat(item);
              }}
              onLongPress={() => setActionTarget(item)}
            />
          );
        }}
        ItemSeparatorComponent={() => (
          <View style={[s.sep, { backgroundColor: colors.border, marginLeft: 54 + Spacing.md + 12 }]} />
        )}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => { setIsRefreshing(true); fetchConversations(); }}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyEmoji}>{isSearching ? '🔍' : '💬'}</Text>
            <Text style={[s.emptyTitle, { color: colors.text }]}>
              {isSearching ? `No results for "${searchQuery}"` : 'No chats yet'}
            </Text>
            {!isSearching && (
              <Text style={[s.emptySub, { color: colors.textSecondary }]}>
                Tap the pencil icon or the button below to start chatting
              </Text>
            )}
          </View>
        }
        ListFooterComponent={
          archivedCount > 0 ? (
            <Pressable
              onPress={() => router.push('/archived-chats' as any)}
              style={[s.archiveRow, { borderTopColor: colors.border }]}>
              <Ionicons name="archive-outline" size={20} color={colors.textSecondary} />
              <Text style={[s.archiveTxt, { color: colors.textSecondary }]}>
                {archivedCount} Archived chat{archivedCount !== 1 ? 's' : ''}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.border} />
            </Pressable>
          ) : null
        }
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={displayList.length === 0 ? { flex: 1 } : undefined}
      />

      {/* ── Chat action bottom sheet ─────────────────────── */}
      {actionTarget && (
        <ChatActionMenu
          visible={!!actionTarget}
          onClose={() => setActionTarget(null)}
          conversation={actionTarget}
          meta={getMeta(actionTarget.id)}
          currentUserId={user?.id || 0}
          onPin={()     => applyMeta(actionTarget.id, { pinned:   !getMeta(actionTarget.id).pinned })}
          onMute={(until) => applyMeta(actionTarget.id, { muteUntil: until })}
          onArchive={()  => applyMeta(actionTarget.id, { archived: !getMeta(actionTarget.id).archived })}
          onLock={()     => applyMeta(actionTarget.id, { locked:   !getMeta(actionTarget.id).locked })}
          onStarred={()  => router.push('/starred-messages')}
        />
      )}

      {/* ── FAB ─────────────────────────────────────────── */}
      {!isSearching && (
        <Pressable
          style={({ pressed }) => [s.fab, { transform: [{ scale: pressed ? 0.93 : 1 }] }]}
          onPress={() => router.push('/new-chat')}>
          <View style={[StyleSheet.absoluteFill, { borderRadius: 29, backgroundColor: colors.primary }]} />
          <Ionicons name="create" size={26} color={colors.textOnPrimary} style={{ zIndex: 1 }} />
        </Pressable>
      )}

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // ── Header ────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    minHeight: 56,
    gap: Spacing.sm,
  },
  headerLeft: {
    width: 36,
    alignItems: 'flex-start',
  },
  headerCenter: {
    flex: 1,
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: FontSize.xs,
    marginTop: 1,
  },
  searchInput: {
    fontSize: FontSize.md,
    paddingVertical: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconBtn: {
    padding: 6,
  },

  // ── List ──────────────────────────────────────────────────
  sep: { height: 0.7 },

  // ── Empty state ───────────────────────────────────────────
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: 80,
  },
  emptyEmoji: { fontSize: 56, marginBottom: Spacing.md },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', marginBottom: Spacing.sm, textAlign: 'center' },
  emptySub: { fontSize: FontSize.sm, textAlign: 'center', lineHeight: 20 },

  // ── Me / Saved Messages tile ─────────────────────────────
  meTile: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: 12, gap: 12, minHeight: 72,
  },
  meAvatar: { width: 54, height: 54, borderRadius: 27, justifyContent: 'center', alignItems: 'center' },
  meInfo:   { flex: 1 },
  meName:   { fontSize: FontSize.md, fontWeight: '700' },
  meSub:    { fontSize: FontSize.sm, marginTop: 2 },

  // ── Archived footer ───────────────────────────────────────
  archiveRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: 14,
    gap: 12, borderTopWidth: StyleSheet.hairlineWidth,
  },
  archiveTxt: { flex: 1, fontSize: FontSize.sm, fontWeight: '600' },

  // ── FAB ───────────────────────────────────────────────────
  fab: {
    position: 'absolute',
    bottom: Spacing.xl,
    right: Spacing.lg,
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#083a7a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
});
