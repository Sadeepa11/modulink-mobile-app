// ============================================================
// New Chat — phonebook-style contact picker
//
// • Loads ALL users on mount (GET /api/users, sorted A-Z)
// • Grouped into letter sections (SectionList)
// • Alphabet sidebar on the right — tap OR slide to jump
// • Floating letter bubble while dragging the sidebar
// • Client-side search that filters sections in real time
// ============================================================

import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { DeviceEventEmitter } from 'react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  PanResponder,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { FontSize, Radius, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import api from '@/services/api';
import Logger from '@/utils/logger';

// Full alphabet + # bucket for non-Latin names
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#'.split('');
const SIDEBAR_W = 22;

type User    = { id: number; name: string; username: string; avatar: string | null; isOnline: boolean; bio?: string };
type Section = { title: string; data: User[] };

function buildSections(users: User[]): Section[] {
  const map: Record<string, User[]> = {};
  for (const u of users) {
    const first  = (u.name || u.username || '')[0]?.toUpperCase() ?? '#';
    const bucket = /[A-Z]/.test(first) ? first : '#';
    if (!map[bucket]) map[bucket] = [];
    map[bucket].push(u);
  }
  return Object.keys(map).sort().map(k => ({ title: k, data: map[k] }));
}

export default function NewChatScreen() {
  const router          = useRouter();
  const { colors, isDark } = useAppTheme();
  const HDR_BG = isDark ? '#071a30' : '#083a7a';

  // ── Refs ─────────────────────────────────────────────────
  const listRef        = useRef<SectionList<User, Section>>(null);
  const barRef         = useRef<View>(null);
  const barLayout      = useRef({ y: 0, height: 0 });
  // Mutable refs so PanResponder (created once) always reads fresh data
  const letterIndexRef = useRef<Record<string, number>>({});
  const scrollFn       = useRef<(l: string) => void>(() => {});
  const letterFromYFn  = useRef<(pageY: number) => string | null>(() => null);

  // ── State ─────────────────────────────────────────────────
  const [allUsers,     setAllUsers]     = useState<User[]>([]);
  const [query,        setQuery]        = useState('');
  const [isLoading,    setIsLoading]    = useState(true);
  const [isCreating,   setIsCreating]   = useState(false);
  const [activeLetter, setActiveLetter] = useState<string | null>(null);

  // ── Load all users once ───────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/users');
        setAllUsers(data);
      } catch (e) {
        Logger.error('Failed to load users', e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // ── Client-side filter ────────────────────────────────────
  const filtered = useMemo(() => {
    if (!query.trim()) return allUsers;
    const q = query.toLowerCase();
    return allUsers.filter(u =>
      (u.name || '').toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q)
    );
  }, [allUsers, query]);

  const sections = useMemo(() => buildSections(filtered), [filtered]);

  // Keep letterIndex ref in sync with sections
  useEffect(() => {
    const map: Record<string, number> = {};
    sections.forEach((sec, i) => { map[sec.title] = i; });
    letterIndexRef.current = map;
  }, [sections]);

  // ── Scroll-to-letter (kept fresh via ref so PanResponder
  //    always calls the latest version) ─────────────────────
  scrollFn.current = (letter: string) => {
    const idx = letterIndexRef.current[letter];
    if (idx === undefined) return;
    setActiveLetter(letter);
    try {
      listRef.current?.scrollToLocation({
        sectionIndex: idx,
        itemIndex:    0,
        animated:     false,
        viewOffset:   0,
      });
    } catch (_) {}
  };

  // ── Letter from touch Y position ─────────────────────────
  letterFromYFn.current = (pageY: number): string | null => {
    const { y, height } = barLayout.current;
    if (height === 0) return null;
    const rel = Math.max(0, Math.min(pageY - y, height - 1));
    const idx = Math.floor((rel / height) * ALPHABET.length);
    return ALPHABET[Math.min(idx, ALPHABET.length - 1)];
  };

  // ── PanResponder — created once, delegates to refs ───────
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,
      onPanResponderGrant: (e) => {
        const l = letterFromYFn.current(e.nativeEvent.pageY);
        if (l) scrollFn.current(l);
      },
      onPanResponderMove: (e) => {
        const l = letterFromYFn.current(e.nativeEvent.pageY);
        if (l) scrollFn.current(l);
      },
      onPanResponderRelease: () => {
        setTimeout(() => setActiveLetter(null), 700);
      },
    })
  ).current;

  // ── Start DM ─────────────────────────────────────────────
  const startChat = async (userId: number) => {
    if (isCreating) return;
    setIsCreating(true);
    try {
      const { data } = await api.post('/conversations', { participantIds: [userId], isGroup: false });
      DeviceEventEmitter.emit('REFRESH_CHATS');
      router.replace(`/chat/${data.id}`);
    } catch (e) {
      Logger.error('New chat screen error', e);
    } finally {
      setIsCreating(false);
    }
  };

  // ─────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.surface }]} edges={['bottom']}>

      {/* ── Search header ───────────────────────────────── */}
      <View style={[s.searchHeader, { backgroundColor: HDR_BG }]}>
        <View style={s.searchWrap}>
          <Ionicons name="search" size={18} color="rgba(255,255,255,0.7)" />
          <TextInput
            style={s.searchInput}
            placeholder="Search by name or username…"
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            keyboardAppearance="dark"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.6)" />
            </Pressable>
          )}
        </View>
      </View>

      {/* ── "Me" / Saved Messages — shown before user list ── */}
      <Pressable
        onPress={() => router.push('/saved-messages')}
        style={({ pressed }) => [s.meTile, { backgroundColor: pressed ? colors.surfaceAlt : colors.surface }]}>
        <View style={[s.meAvatar, { backgroundColor: colors.primary }]}>
          <Ionicons name="bookmark" size={22} color="#fff" />
        </View>
        <View style={s.meInfo}>
          <Text style={[s.meName, { color: colors.text }]}>Saved Messages</Text>
          <Text style={[s.meSub,  { color: colors.textSecondary }]}>Your personal notes</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.border} />
      </Pressable>
      <View style={[s.divider, { backgroundColor: colors.border }]} />

      {/* ── Count bar ───────────────────────────────────── */}
      {!isLoading && (
        <View style={[s.countBar, { backgroundColor: colors.surfaceAlt, borderBottomColor: colors.border }]}>
          <Text style={[s.countText, { color: colors.textSecondary }]}>
            {filtered.length} contact{filtered.length !== 1 ? 's' : ''}
          </Text>
        </View>
      )}

      {/* ── Body: list + sidebar ────────────────────────── */}
      <View style={s.body}>

        {isLoading ? (
          <View style={s.center}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <SectionList
            ref={listRef}
            sections={sections}
            keyExtractor={(item) => String(item.id)}
            stickySectionHeadersEnabled
            contentContainerStyle={[
              { paddingRight: SIDEBAR_W + 4, paddingBottom: 40 },
              sections.length === 0 && { flex: 1 },
            ]}
            renderSectionHeader={({ section }) => (
              <View style={[
                s.sectionHeader,
                { backgroundColor: colors.surfaceAlt, borderBottomColor: colors.border },
              ]}>
                <Text style={[s.sectionLetter, { color: colors.primary }]}>
                  {section.title}
                </Text>
              </View>
            )}
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [
                  s.row,
                  { backgroundColor: pressed ? colors.surfaceAlt : colors.surface },
                ]}
                onPress={() => startChat(item.id)}
                disabled={isCreating}>

                <Avatar
                  uri={item.avatar}
                  name={item.name || item.username}
                  size={48}
                  showOnline
                  isOnline={item.isOnline}
                />

                <View style={s.info}>
                  <Text style={[s.name, { color: colors.text }]} numberOfLines={1}>
                    {item.name || item.username}
                  </Text>
                  <Text style={[s.handle, { color: colors.textSecondary }]}>
                    @{item.username}
                  </Text>
                  {!!item.bio && (
                    <Text style={[s.bio, { color: colors.textSecondary }]} numberOfLines={1}>
                      {item.bio}
                    </Text>
                  )}
                </View>

                <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
              </Pressable>
            )}
            ItemSeparatorComponent={() => (
              <View style={[s.sep, { backgroundColor: colors.border }]} />
            )}
            ListEmptyComponent={
              <View style={s.empty}>
                <Ionicons name="person-outline" size={52} color={colors.border} />
                <Text style={[s.emptyTitle, { color: colors.text }]}>No users found</Text>
                {query.length > 0 && (
                  <Text style={[s.emptySub, { color: colors.textSecondary }]}>
                    No results for "{query}"
                  </Text>
                )}
              </View>
            }
            onScrollToIndexFailed={() => {}}
          />
        )}

        {/* ── Alphabet sidebar ─────────────────────────── */}
        {!isLoading && sections.length > 0 && (
          <View
            ref={barRef}
            style={s.sidebar}
            onLayout={() => {
              barRef.current?.measure((_x, _y, _w, h, _px, py) => {
                barLayout.current = { y: py, height: h };
              });
            }}
            {...panResponder.panHandlers}>

            {ALPHABET.map((letter) => {
              const exists   = letterIndexRef.current[letter] !== undefined;
              const isActive = letter === activeLetter;
              return (
                <Pressable
                  key={letter}
                  style={[
                    s.sidebarItem,
                    isActive && { backgroundColor: colors.primary, borderRadius: 10 },
                  ]}
                  onPress={() => { scrollFn.current(letter); setTimeout(() => setActiveLetter(null), 700); }}
                  hitSlop={2}>
                  <Text style={[
                    s.sidebarLetter,
                    { color: exists ? colors.primary : colors.border },
                    isActive && { color: '#fff', fontWeight: '800' },
                  ]}>
                    {letter}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* ── Floating letter bubble while dragging ────── */}
        {activeLetter !== null && (
          <View
            style={[s.floatBubble, { backgroundColor: colors.primary }]}
            pointerEvents="none">
            <Text style={s.floatLetter}>{activeLetter}</Text>
          </View>
        )}

      </View>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe:  { flex: 1 },
  body:  { flex: 1, position: 'relative' },
  center:{ flex: 1, justifyContent: 'center', alignItems: 'center' },

  // ── Me tile ──────────────────────────────────────────────
  meTile:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: 13, gap: 12 },
  meAvatar:{ width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  meInfo:  { flex: 1 },
  meName:  { fontSize: FontSize.md, fontWeight: '700' },
  meSub:   { fontSize: FontSize.sm, marginTop: 2 },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 50 + Spacing.md + 12 },

  // ── Search header ────────────────────────────────────────
  searchHeader: {
    paddingHorizontal: Spacing.md,
    paddingVertical:   10,
    overflow:          'hidden',
  },
  searchWrap: {
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   'rgba(255,255,255,0.13)',
    borderRadius:      Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical:   10,
    gap:               Spacing.sm,
    borderWidth:       1,
    borderColor:       'rgba(255,255,255,0.2)',
  },
  searchInput: { flex: 1, fontSize: FontSize.md, color: '#fff' },

  // ── Count bar ────────────────────────────────────────────
  countBar: {
    paddingHorizontal: Spacing.md,
    paddingVertical:   5,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  countText: {
    fontSize:      FontSize.xs,
    fontWeight:    '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },

  // ── Section header ───────────────────────────────────────
  sectionHeader: {
    paddingHorizontal: Spacing.md,
    paddingVertical:   5,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sectionLetter: { fontSize: FontSize.sm, fontWeight: '700', letterSpacing: 0.3 },

  // ── User row ─────────────────────────────────────────────
  row: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: Spacing.md,
    paddingVertical:   12,
    gap:               Spacing.md,
    minHeight:         70,
  },
  info:   { flex: 1 },
  name:   { fontSize: FontSize.md, fontWeight: '600' },
  handle: { fontSize: FontSize.sm, marginTop: 1 },
  bio:    { fontSize: 11, marginTop: 2 },
  sep:    { height: StyleSheet.hairlineWidth, marginLeft: 48 + Spacing.md * 2 },

  // ── Empty state ──────────────────────────────────────────
  empty: {
    flex:              1,
    alignItems:        'center',
    justifyContent:    'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom:     80,
    gap:               Spacing.md,
  },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '700' },
  emptySub:   { fontSize: FontSize.sm, textAlign: 'center' },

  // ── Alphabet sidebar ─────────────────────────────────────
  sidebar: {
    position:       'absolute',
    right:          2,
    top:            0,
    bottom:         0,
    width:          SIDEBAR_W,
    alignItems:     'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap:             1,
  },
  sidebarItem: {
    width:          20,
    height:         20,
    alignItems:     'center',
    justifyContent: 'center',
  },
  sidebarLetter: {
    fontSize:   10,
    fontWeight: '600',
    lineHeight: 12,
  },

  // ── Floating bubble ──────────────────────────────────────
  floatBubble: {
    position:       'absolute',
    left:           '50%',
    top:            '50%',
    transform:      [{ translateX: -30 }, { translateY: -30 }],
    width:          60,
    height:         60,
    borderRadius:   30,
    justifyContent: 'center',
    alignItems:     'center',
    elevation:      10,
    shadowColor:    '#083a7a',
    shadowOffset:   { width: 0, height: 3 },
    shadowOpacity:  0.4,
    shadowRadius:   6,
  },
  floatLetter: { color: '#fff', fontSize: 28, fontWeight: '800' },
});
