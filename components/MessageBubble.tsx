// ============================================================
// MessageBubble — premium chat bubble
//
// My messages   → right-aligned, blue gradient, white text
// Their messages → left-aligned, frosted card, themed text
// Images        → rounded preview inside bubble
// Stickers      → bubble-free, 140×140, timestamp below
// ============================================================

import React, { useEffect, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from './Avatar';
import { FontSize, Radius, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { API_BASE_URL } from '@/services/api';
import { isStarred, starMessage, unstarMessage } from '@/utils/starredMessages';

interface Props {
  message:          any;
  isMe:             boolean;
  showAvatar?:      boolean;
  showSenderName?:  boolean;
  conversationName?: string;
}

export function MessageBubble({ message, isMe, showAvatar = false, showSenderName = false, conversationName = '' }: Props) {
  const { colors, isDark } = useAppTheme();
  const [starred, setStarred] = useState(false);

  useEffect(() => {
    isStarred(message.id).then(setStarred);
  }, [message.id]);

  const handleLongPress = () => {
    const starLabel = starred ? '☆  Unstar message' : '⭐  Star message';
    Alert.alert('Message', undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: starLabel,
        onPress: async () => {
          if (starred) {
            await unstarMessage(message.id);
            setStarred(false);
          } else {
            await starMessage({
              msgId:            message.id,
              content:          message.content ?? null,
              messageType:      message.messageType,
              mediaUrl:         message.mediaUrl ?? null,
              createdAt:        message.createdAt,
              conversationId:   message.conversationId,
              conversationName,
              sender: {
                id:       message.sender?.id,
                name:     message.sender?.name,
                username: message.sender?.username,
                avatar:   message.sender?.avatar ?? null,
              },
            });
            setStarred(true);
          }
        },
      },
    ]);
  };

  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit', minute: '2-digit',
  });

  const tick = isMe
    ? message.status === 'read' ? '✓✓' : '✓'
    : null;

  const tickColor = message.status === 'read' ? '#79dadf' : 'rgba(255,255,255,0.55)';

  const StarDot = starred
    ? <Text style={s.starDot}>⭐</Text>
    : null;


  // ── Regular bubble ────────────────────────────────────────
  const hasImage = message.messageType === 'image' && message.mediaUrl;
  const hasText  = !!message.content;

  return (
    <Pressable onLongPress={handleLongPress} style={[s.row, isMe ? s.rowMe : s.rowThem]}>
      {!isMe && showAvatar && (
        <Avatar uri={message.sender?.avatar} name={message.sender?.name} size={26} />
      )}
      {!isMe && !showAvatar && <View style={s.avatarSpacer} />}

      <View style={[s.bubbleOuter, isMe ? s.bubbleOuterMe : s.bubbleOuterThem]}>

        {/* Bubble body */}
        {isMe ? (
          // My message — solid fill
          <View
            style={[s.bubble, s.bubbleMe, { backgroundColor: colors.myBubble }]}>

            {hasImage && (
              <Image
                source={{ uri: `${API_BASE_URL}${message.mediaUrl}` }}
                style={[s.msgImage, !hasText && s.msgImageOnly]}
                resizeMode="cover"
              />
            )}
            {hasText && (
              <Text style={[s.text, { color: colors.myBubbleText }]}>{message.content}</Text>
            )}
            <View style={[s.footer, { justifyContent: 'flex-end' }]}>
              <Text style={[s.metaTime, { color: 'rgba(255,255,255,0.65)' }]}>{time}</Text>
              {tick && <Text style={[s.metaTick, { color: tickColor }]}>{tick}</Text>}
            </View>
          </View>

        ) : (
          // Their message — frosted card
          <View style={[
            s.bubble, s.bubbleThem,
            {
              backgroundColor: isDark ? 'rgba(20,48,76,0.92)' : 'rgba(255,255,255,0.96)',
              borderColor:     isDark ? 'rgba(255,255,255,0.07)' : 'rgba(8,58,122,0.08)',
            },
          ]}>
            {showSenderName && (
              <Text style={[s.senderName, { color: colors.primary }]}>
                {message.sender?.name || message.sender?.username}
              </Text>
            )}
            {hasImage && (
              <Image
                source={{ uri: `${API_BASE_URL}${message.mediaUrl}` }}
                style={[s.msgImage, !hasText && s.msgImageOnly]}
                resizeMode="cover"
              />
            )}
            {hasText && (
              <Text style={[s.text, { color: colors.text }]}>{message.content}</Text>
            )}
            <View style={s.footer}>
              <Text style={[s.metaTime, { color: colors.textSecondary }]}>{time}</Text>
            </View>
          </View>
        )}

        {/* Bubble tail */}
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  row:     { flexDirection: 'row', alignItems: 'flex-end', marginVertical: 2, paddingHorizontal: Spacing.md },
  rowMe:   { justifyContent: 'flex-end' },
  rowThem: { justifyContent: 'flex-start' },

  avatarSpacer: { width: 26 + Spacing.xs },

  bubbleOuter:    { maxWidth: '78%', position: 'relative' },
  bubbleOuterMe:  { marginLeft: Spacing.xl, alignItems: 'flex-end' },
  bubbleOuterThem:{ marginRight: Spacing.xl, marginLeft: Spacing.xs, alignItems: 'flex-start' },

  bubble: {
    borderRadius: Radius.lg,
    paddingHorizontal: 12,
    paddingVertical:   8,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bubbleMe:   {},
  bubbleThem: { borderWidth: 1 },

  // Tail triangles
  tailMe: {
    position:   'absolute',
    top:        0,
    right:      -7,
    width:      0,
    height:     0,
    borderStyle:       'solid',
    borderTopWidth:    10,
    borderLeftWidth:   8,
    borderRightWidth:  0,
    borderBottomWidth: 0,
    borderLeftColor:   'transparent',
    borderRightColor:  'transparent',
    borderBottomColor: 'transparent',
  },
  tailThem: {
    position:   'absolute',
    top:        0,
    left:       -7,
    width:      0,
    height:     0,
    borderStyle:       'solid',
    borderTopWidth:    10,
    borderRightWidth:  8,
    borderLeftWidth:   0,
    borderBottomWidth: 0,
    borderRightColor:  'transparent',
    borderLeftColor:   'transparent',
    borderBottomColor: 'transparent',
  },

  senderName: { fontSize: FontSize.xs, fontWeight: '700', marginBottom: 3 },
  msgImage:   { width: 200, height: 200, borderRadius: 10, marginBottom: 4 },
  msgImageOnly: { marginBottom: 0 },
  text:   { fontSize: FontSize.md, lineHeight: 21 },
  footer: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  metaTime: { fontSize: 11 },
  metaTick: { fontSize: 11 },

  starDot:    { fontSize: 11, marginBottom: 2 },


});
