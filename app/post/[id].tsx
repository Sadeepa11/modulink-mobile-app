// ============================================================
// Post Comments Screen (themed)
// ============================================================

import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { FontSize, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useCustomAlert } from '@/context/AlertContext';
import { useAppTheme } from '@/hooks/useAppTheme';
import api from '@/services/api';
import Logger from '@/utils/logger';

export default function CommentsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { colors } = useAppTheme();
  const { showAlert } = useCustomAlert();

  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);

  const fetchComments = useCallback(async () => {
    try {
      const { data } = await api.get(`/posts/${id}/comments`);
      setComments(data);
    } catch (e) { Logger.error('Comments screen error', e); }
    finally { setIsLoading(false); }
  }, [id]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  const addComment = async () => {
    const text = newComment.trim();
    if (!text || isPosting) return;
    setIsPosting(true);
    const prev = newComment;
    setNewComment('');
    try {
      const { data } = await api.post(`/posts/${id}/comments`, { content: text });
      setComments((c) => [...c, data]);
    } catch {
      setNewComment(prev);
      showAlert({ type: 'error', title: 'Error', message: 'Failed to post comment.' });
    } finally { setIsPosting(false); }
  };

  const fmt = (d: string) => {
    const ms = Date.now() - new Date(d).getTime();
    const m = Math.floor(ms / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    return `${Math.floor(h / 24)}d`;
  };

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>

        <FlatList
          data={comments}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: Spacing.md }}
          renderItem={({ item }) => (
            <View style={styles.commentRow}>
              <Avatar uri={item.user.avatar} name={item.user.name} size={36} />
              <View style={[styles.bubble, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                <View style={styles.bubbleHeader}>
                  <Text style={[styles.author, { color: colors.primary }]}>{item.user.username}</Text>
                  <Text style={[styles.time, { color: colors.textSecondary }]}>{fmt(item.createdAt)}</Text>
                </View>
                <Text style={[styles.content, { color: colors.text }]}>{item.content}</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No comments yet. Be the first!
              </Text>
            </View>
          }
        />

        {/* Input row */}
        <View style={[styles.inputRow, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <Avatar uri={user?.avatar} name={user?.name} size={32} />
          <TextInput
            style={[styles.input, {
              backgroundColor: colors.surfaceAlt,
              borderColor: colors.border,
              color: colors.text,
            }]}
            placeholder="Add a comment…"
            placeholderTextColor={colors.textSecondary}
            value={newComment}
            onChangeText={setNewComment}
            multiline
            maxLength={500}
          />
          <Pressable onPress={addComment} disabled={!newComment.trim() || isPosting}>
            <Text style={[
              styles.postBtn,
              { color: newComment.trim() ? colors.primary : colors.textSecondary },
            ]}>
              Post
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  commentRow: { flexDirection: 'row', marginBottom: Spacing.md, gap: Spacing.sm },
  bubble: {
    flex: 1, borderRadius: 12, padding: Spacing.sm,
    borderWidth: 1,
  },
  bubbleHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  author: { fontSize: FontSize.sm, fontWeight: '700' },
  time: { fontSize: FontSize.xs },
  content: { fontSize: FontSize.sm, lineHeight: 19 },
  empty: { padding: Spacing.xl, alignItems: 'center' },
  emptyText: { fontSize: FontSize.sm },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: Spacing.md,
    borderTopWidth: 1,
    gap: Spacing.sm,
  },
  input: {
    flex: 1, borderRadius: 20,
    paddingHorizontal: Spacing.md, paddingVertical: 10,
    fontSize: FontSize.sm, maxHeight: 100, borderWidth: 1.5,
  },
  postBtn: { fontSize: FontSize.sm, fontWeight: '700', paddingVertical: 10 },
});
