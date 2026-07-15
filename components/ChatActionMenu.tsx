// ============================================================
// ChatActionMenu — WhatsApp-style bottom sheet for chat actions
//
// Actions: Pin · Mute · Archive · Lock · Starred Messages
// ============================================================

import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useEffect, useRef } from 'react';
import {
  Alert,
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Avatar } from './Avatar';
import { FontSize, Radius, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { ConvMeta, isMuted } from '@/utils/chatMeta';

export interface ChatAction {
  icon:        string;
  label:       string;
  destructive?: boolean;
  onPress:     () => void;
}

interface Props {
  visible:      boolean;
  onClose:      () => void;
  conversation: any;       // the conversation object
  meta:         ConvMeta;
  currentUserId: number;
  onPin:        () => void;
  onMute:       (until: number | null) => void;
  onArchive:    () => void;
  onLock:       () => void;
  onStarred:    () => void;
}

const SHEET_H = 380;

export function ChatActionMenu({
  visible, onClose, conversation, meta, currentUserId,
  onPin, onMute, onArchive, onLock, onStarred,
}: Props) {
  const { colors, isDark } = useAppTheme();
  const slideAnim = useRef(new Animated.Value(SHEET_H)).current;
  const [rendered, setRendered] = React.useState(false);

  useEffect(() => {
    if (visible) {
      setRendered(true);
      Animated.spring(slideAnim, {
        toValue: 0, useNativeDriver: true, tension: 160, friction: 20,
      }).start();
    } else {
      Animated.spring(slideAnim, {
        toValue: SHEET_H, useNativeDriver: true, tension: 160, friction: 20,
      }).start(({ finished }) => { if (finished) setRendered(false); });
    }
  }, [visible]);

  if (!rendered) return null;

  // Build display name
  const other = conversation.participants?.find((p: any) => p.user.id !== currentUserId);
  const name  = conversation.isGroup
    ? conversation.name || 'Group Chat'
    : other?.user?.name || other?.user?.username || 'Unknown';
  const avatarUri = conversation.isGroup ? conversation.avatar : other?.user?.avatar;

  const muted  = isMuted(meta);
  const bg     = isDark ? '#0d1e30' : '#f5f8fb';
  const border = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(8,58,122,0.08)';

  const actions: ChatAction[] = [
    {
      icon:    meta.pinned ? 'pin' : 'pin-outline',
      label:   meta.pinned ? 'Unpin Chat' : 'Pin Chat',
      onPress: () => { onClose(); onPin(); },
    },
    {
      icon:    muted ? 'volume-high-outline' : 'notifications-off-outline',
      label:   muted ? 'Unmute Notifications' : 'Mute Notifications',
      onPress: () => {
        if (muted) { onClose(); onMute(null); return; }
        Alert.alert('Mute notifications', 'How long?', [
          { text: 'Cancel', style: 'cancel' },
          { text: '8 hours',        onPress: () => { onClose(); onMute(Date.now() + 8  * 3600_000); } },
          { text: '1 week',         onPress: () => { onClose(); onMute(Date.now() + 7  * 86400_000); } },
          { text: 'Until unmuted',  onPress: () => { onClose(); onMute(-1); } },
        ]);
      },
    },
    {
      icon:    meta.archived ? 'archive' : 'archive-outline',
      label:   meta.archived ? 'Unarchive Chat' : 'Archive Chat',
      onPress: () => { onClose(); onArchive(); },
    },
    {
      icon:    meta.locked ? 'lock-open-outline' : 'lock-closed-outline',
      label:   meta.locked ? 'Unlock Chat' : 'Lock Chat',
      onPress: () => { onClose(); onLock(); },
    },
    {
      icon:    'star-outline',
      label:   'Starred Messages',
      onPress: () => { onClose(); onStarred(); },
    },
  ];

  return (
    <Modal transparent visible animationType="none" onRequestClose={onClose}>
      {/* Backdrop */}
      <Pressable style={s.backdrop} onPress={onClose} />

      {/* Sheet */}
      <Animated.View
        style={[s.sheet, { backgroundColor: bg, borderTopColor: border },
          { transform: [{ translateY: slideAnim }] }]}>

        {/* Drag handle */}
        <View style={[s.handle, { backgroundColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(8,58,122,0.18)' }]} />

        {/* Chat identity */}
        <View style={[s.identity, { borderBottomColor: border }]}>
          <Avatar uri={avatarUri} name={name} size={44} />
          <View style={{ flex: 1 }}>
            <Text style={[s.chatName, { color: colors.text }]} numberOfLines={1}>{name}</Text>
            {meta.pinned && <Text style={[s.badge, { color: colors.primary }]}>📌 Pinned</Text>}
            {muted   && <Text style={[s.badge, { color: colors.textSecondary }]}>🔇 Muted</Text>}
            {meta.archived && <Text style={[s.badge, { color: colors.textSecondary }]}>📦 Archived</Text>}
          </View>
        </View>

        {/* Action rows */}
        {actions.map((a) => (
          <Pressable
            key={a.label}
            onPress={a.onPress}
            style={({ pressed }) => [
              s.row,
              { backgroundColor: pressed ? (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(8,58,122,0.05)') : 'transparent' },
            ]}>
            <View style={[s.iconWrap, { backgroundColor: isDark ? 'rgba(121,218,223,0.1)' : 'rgba(8,58,122,0.07)' }]}>
              <Ionicons
                name={a.icon as any}
                size={20}
                color={a.destructive ? colors.error : colors.primary}
              />
            </View>
            <Text style={[s.label, { color: a.destructive ? colors.error : colors.text }]}>
              {a.label}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.border} />
          </Pressable>
        ))}
      </Animated.View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    position:     'absolute',
    left: 0, right: 0, bottom: 0,
    borderTopLeftRadius:  20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    paddingBottom:  30,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  handle: {
    alignSelf:    'center',
    width:        40,
    height:       4,
    borderRadius: 2,
    marginTop:    10,
    marginBottom: 4,
  },
  identity: {
    flexDirection:  'row',
    alignItems:     'center',
    paddingHorizontal: Spacing.md,
    paddingVertical:   12,
    gap:            12,
    borderBottomWidth: 1,
  },
  chatName: { fontSize: FontSize.md, fontWeight: '700' },
  badge:    { fontSize: FontSize.xs, marginTop: 2 },
  row: {
    flexDirection:  'row',
    alignItems:     'center',
    paddingHorizontal: Spacing.md,
    paddingVertical:   14,
    gap:            14,
  },
  iconWrap: {
    width: 38, height: 38, borderRadius: Radius.md,
    justifyContent: 'center', alignItems: 'center',
  },
  label: { flex: 1, fontSize: FontSize.md },
});
