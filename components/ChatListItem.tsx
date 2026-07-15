// ============================================================
// ChatListItem — premium glass-ready conversation row
// ============================================================

import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from './Avatar';
import { FontSize, Radius, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { ConvMeta, isMuted } from '@/utils/chatMeta';

interface Props {
  conversation:  any;
  currentUserId: number;
  meta?:         ConvMeta;
  onPress:       () => void;
  onLongPress?:  () => void;
}

export function ChatListItem({ conversation, currentUserId, meta, onPress, onLongPress }: Props) {
  const { colors, isDark } = useAppTheme();
  const muted  = isMuted(meta);
  const pinned = meta?.pinned ?? false;
  const locked = meta?.locked ?? false;

  const hasUnread = (conversation.unreadCount ?? 0) > 0;

  const other       = conversation.participants?.find((p: any) => p.user.id !== currentUserId);
  const displayName = conversation.isGroup
    ? conversation.name || 'Group Chat'
    : other?.user?.name || other?.user?.username || 'Unknown';
  const avatarUri   = conversation.isGroup ? conversation.avatar : other?.user?.avatar;
  const isOnline    = !conversation.isGroup && (other?.user?.isOnline ?? false);

  const lastMsg = conversation.messages?.[0] ?? null;
  const isMyMsg = lastMsg?.sender?.id === currentUserId;

  let preview = 'No messages yet';
  if (lastMsg) {
    const body = lastMsg.messageType === 'image' ? '📷 Photo' : (lastMsg.content ?? '');
    if (isMyMsg) preview = `You: ${body}`;
    else if (conversation.isGroup && lastMsg.sender?.username) preview = `${lastMsg.sender.username}: ${body}`;
    else preview = body;
    if (preview.length > 50) preview = preview.slice(0, 50) + '…';
  }

  const fmtTime = (d: string) => {
    const date = new Date(d);
    const now  = new Date();
    if (date.toDateString() === now.toDateString())
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const diff = Math.floor((now.getTime() - date.getTime()) / 86400000);
    if (diff < 7) return date.toLocaleDateString([], { weekday: 'short' });
    return date.toLocaleDateString([], { day: 'numeric', month: 'short' });
  };

  const renderTicks = () => {
    if (!lastMsg || !isMyMsg) return null;
    const isRead  = lastMsg.status === 'read';
    const isDel   = lastMsg.status === 'delivered' || isRead;
    return (
      <Text style={[s.tick, { color: isRead ? '#53BDEB' : colors.textSecondary }]}>
        {isDel ? '✓✓' : '✓'}
      </Text>
    );
  };

  const unread = conversation.unreadCount ?? 0;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [
        s.row,
        { backgroundColor: pressed ? colors.surfaceAlt : colors.surface },
      ]}>

      {/* Subtle left accent for unread rows */}
      {hasUnread && (
        <View
          style={[s.unreadAccent, { backgroundColor: colors.primary }]}
        />
      )}

      <Avatar uri={avatarUri} name={displayName} size={54} showOnline={!conversation.isGroup} isOnline={isOnline} />

      <View style={s.body}>
        <View style={s.topRow}>
          <Text style={[s.name, { color: colors.text, fontWeight: hasUnread ? '700' : '500' }]} numberOfLines={1}>
            {displayName}
          </Text>
          <View style={s.timeRow}>
            {renderTicks()}
            {lastMsg && (
              <Text style={[s.time, { color: hasUnread ? colors.primary : colors.textSecondary }]}>
                {fmtTime(lastMsg.createdAt)}
              </Text>
            )}
          </View>
        </View>

        <View style={s.bottomRow}>
          <Text
            style={[s.preview, { color: hasUnread ? colors.text : colors.textSecondary, fontWeight: hasUnread ? '500' : '400' }]}
            numberOfLines={1}>
            {preview}
          </Text>

          {/* Status icons: pin · mute · lock */}
          <View style={s.statusIcons}>
            {pinned && <Ionicons name="pin"               size={12} color={colors.primary} />}
            {muted  && <Ionicons name="notifications-off" size={12} color={colors.textSecondary} />}
            {locked && <Ionicons name="lock-closed"       size={12} color={colors.textSecondary} />}
          </View>

          {/* Solid unread badge — grey when muted */}
          {unread > 0 && (
            <View style={s.badgeWrap}>
              <View
                style={[StyleSheet.absoluteFill, { borderRadius: Radius.full, backgroundColor: muted ? '#9ca3af' : colors.primary }]}
              />
              <Text style={s.badgeText}>{unread > 99 ? '99+' : unread}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: Spacing.md,
    paddingVertical:   10,
    minHeight:         72,
    gap:               12,
    position:          'relative',
  },
  unreadAccent: {
    position:     'absolute',
    left:         0,
    top:          8,
    bottom:       8,
    width:        3,
    borderRadius: 2,
  },
  body:     { flex: 1, justifyContent: 'center', gap: 4 },
  topRow:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  name:     { flex: 1, fontSize: FontSize.md },
  timeRow:  { flexDirection: 'row', alignItems: 'center', gap: 3 },
  tick:     { fontSize: 13, lineHeight: 16 },
  time:     { fontSize: FontSize.xs },
  bottomRow:{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  preview:  { flex: 1, fontSize: FontSize.sm, lineHeight: 18 },
  statusIcons: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  badgeWrap:{
    minWidth:  22,
    height:    22,
    borderRadius: Radius.full,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems:    'center',
    overflow:      'hidden',
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '800', lineHeight: 14, zIndex: 1 },
});
