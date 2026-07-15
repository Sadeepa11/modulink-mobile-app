// ============================================================
// Starred Messages — view all messages you have starred
// ============================================================

import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { Avatar } from '@/components/Avatar';
import { FontSize, Radius, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { StarredMsg, loadStarred, unstarMessage } from '@/utils/starredMessages';

export default function StarredMessagesScreen() {
  const { colors, isDark } = useAppTheme();
  const router = useRouter();
  const [starred, setStarred] = useState<StarredMsg[]>([]);

  const load = useCallback(async () => {
    setStarred(await loadStarred());
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleUnstar = (msgId: string | number) => {
    Alert.alert('Remove star', 'Remove this message from Starred?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await unstarMessage(msgId);
          setStarred(prev => prev.filter(m => String(m.msgId) !== String(msgId)));
        },
      },
    ]);
  };

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })
    + ' · '
    + new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      <FlatList
        data={starred}
        keyExtractor={m => String(m.msgId)}
        contentContainerStyle={starred.length === 0 ? { flex: 1 } : { paddingBottom: 20 }}
        ListEmptyComponent={
          <View style={s.empty}>
            <Ionicons name="star-outline" size={56} color={colors.border} />
            <Text style={[s.emptyTitle, { color: colors.text }]}>No Starred Messages</Text>
            <Text style={[s.emptySub, { color: colors.textSecondary }]}>
              Long-press any message in a chat and tap{'\n'}"Star message" to save it here.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/chat/${item.conversationId}`)}
            onLongPress={() => handleUnstar(item.msgId)}
            style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>

            {/* Conversation name + date */}
            <View style={s.cardHeader}>
              <Avatar uri={item.sender.avatar} name={item.sender.name || item.sender.username} size={28} />
              <View style={{ flex: 1 }}>
                <Text style={[s.convName, { color: colors.textSecondary }]} numberOfLines={1}>
                  {item.conversationName}
                </Text>
                <Text style={[s.senderName, { color: colors.primary }]} numberOfLines={1}>
                  {item.sender.name || item.sender.username}
                </Text>
              </View>
              <Ionicons name="star" size={14} color="#f59e0b" />
              <Text style={[s.date, { color: colors.textSecondary }]}>{fmt(item.createdAt)}</Text>
            </View>

            {/* Message content */}
            <Text style={[s.content, { color: colors.text }]} numberOfLines={3}>
              {item.messageType === 'image'
                ? '📷 Photo'
                : item.messageType === 'sticker'
                  ? '😊 Sticker'
                  : item.content ?? ''}
            </Text>

            <Text style={[s.hint, { color: colors.textSecondary }]}>
              Tap to open chat · Long-press to unstar
            </Text>
          </Pressable>
        )}
        ItemSeparatorComponent={() => <View style={[s.sep, { backgroundColor: colors.border }]} />}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1 },
  empty:  { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, paddingHorizontal: Spacing.xl },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '700' },
  emptySub:   { fontSize: FontSize.sm, textAlign: 'center', lineHeight: 20 },
  card: {
    marginHorizontal: Spacing.md, marginTop: Spacing.sm,
    borderRadius: Radius.lg, borderWidth: 1,
    padding: Spacing.md, gap: 8,
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 3,
  },
  cardHeader:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  convName:    { fontSize: FontSize.xs },
  senderName:  { fontSize: FontSize.sm, fontWeight: '700' },
  date:        { fontSize: FontSize.xs },
  content:     { fontSize: FontSize.md, lineHeight: 21 },
  hint:        { fontSize: 10 },
  sep:         { height: 1 },
});
