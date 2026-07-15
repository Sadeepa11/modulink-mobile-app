// ============================================================
// GroupListItem — group conversation row for the Groups tab
//
// Extends the standard chat row with:
//   • Member count pill  👥 4
//   • Group icon background (uses primary colour palette)
//   • "You:" / "Name:" last-message prefix
//   • Unread badge
// ============================================================

import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from './Avatar';
import { FontSize, Spacing, Radius } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';

interface Props {
  conversation: any;
  currentUserId: number;
  onPress: () => void;
  onLongPress?: () => void;
}

export function GroupListItem({ conversation, currentUserId, onPress, onLongPress }: Props) {
  const { colors } = useAppTheme();

  const hasUnread     = (conversation.unreadCount ?? 0) > 0;
  const memberCount   = conversation.participants?.length ?? 0;
  const groupName     = conversation.name || 'Group Chat';
  const lastMsg       = conversation.messages?.[0] ?? null;
  const isMyMsg       = lastMsg?.sender?.id === currentUserId;

  // Build preview text
  let preview = 'No messages yet';
  if (lastMsg) {
    const body = lastMsg.messageType === 'image' ? '📷 Photo' : (lastMsg.content ?? '');
    if (isMyMsg) preview = `You: ${body}`;
    else if (lastMsg.sender?.username) preview = `${lastMsg.sender.username}: ${body}`;
    else preview = body;
    if (preview.length > 52) preview = preview.slice(0, 52) + '…';
  }

  // Format timestamp
  const fmtTime = (d: string) => {
    const date = new Date(d);
    const now  = new Date();
    if (date.toDateString() === now.toDateString())
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const diff = Math.floor((now.getTime() - date.getTime()) / 86400000);
    if (diff < 7) return date.toLocaleDateString([], { weekday: 'short' });
    return date.toLocaleDateString([], { day: 'numeric', month: 'short' });
  };

  const unreadCount = conversation.unreadCount ?? 0;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [
        s.row,
        { backgroundColor: pressed ? colors.surfaceAlt : colors.surface },
      ]}>

      {/* Group avatar — circular with initials */}
      <Avatar uri={null} name={groupName} size={54} />

      {/* Content */}
      <View style={s.body}>

        {/* Top: name + timestamp */}
        <View style={s.topRow}>
          <Text
            style={[s.name, { color: colors.text, fontWeight: hasUnread ? '700' : '500' }]}
            numberOfLines={1}>
            {groupName}
          </Text>
          {lastMsg && (
            <Text style={[s.time, { color: hasUnread ? colors.primary : colors.textSecondary }]}>
              {fmtTime(lastMsg.createdAt)}
            </Text>
          )}
        </View>

        {/* Bottom: preview + member count + badge */}
        <View style={s.bottomRow}>
          <Text
            style={[
              s.preview,
              { color: hasUnread ? colors.text : colors.textSecondary,
                fontWeight: hasUnread ? '500' : '400' },
            ]}
            numberOfLines={1}>
            {preview}
          </Text>

          {/* Member count pill */}
          <View style={[s.memberPill, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
            <Ionicons name="people" size={11} color={colors.textSecondary} />
            <Text style={[s.memberCount, { color: colors.textSecondary }]}>{memberCount}</Text>
          </View>

          {/* Unread badge */}
          {unreadCount > 0 && (
            <View style={[s.badge, { backgroundColor: colors.primary }]}>
              <Text style={s.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
            </View>
          )}
        </View>

      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection:  'row',
    alignItems:     'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    minHeight:      72,
    gap:            12,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    gap: 5,
  },
  topRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           4,
  },
  name: {
    flex:     1,
    fontSize: FontSize.md,
  },
  time: {
    fontSize: FontSize.xs,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           6,
  },
  preview: {
    flex:     1,
    fontSize: FontSize.sm,
    lineHeight: 18,
  },
  memberPill: {
    flexDirection:  'row',
    alignItems:     'center',
    paddingHorizontal: 6,
    paddingVertical:   2,
    borderRadius:   Radius.full,
    borderWidth:    1,
    gap: 3,
  },
  memberCount: {
    fontSize:   10,
    fontWeight: '600',
  },
  badge: {
    minWidth:  20,
    height:    20,
    borderRadius: Radius.full,
    paddingHorizontal: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color:      '#fff',
    fontSize:   11,
    fontWeight: '700',
    lineHeight: 14,
  },
});
