// PostCard — Instagram-style post with like/comment (themed, custom alerts)

import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Dimensions, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from './Avatar';
import { FontSize, Spacing } from '@/constants/theme';
import { useCustomAlert } from '@/context/AlertContext';
import { useAppTheme } from '@/hooks/useAppTheme';
import api, { API_BASE_URL } from '@/services/api';

const W = Dimensions.get('window').width;

interface Props {
  post: any;
  currentUserId: number;
  onDelete?: (id: number) => void;
}

export function PostCard({ post, currentUserId, onDelete }: Props) {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { showAlert } = useCustomAlert();

  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likeCount, setLikeCount] = useState(post._count.likes);
  const [busy, setBusy] = useState(false);

  const fmt = (d: string) => {
    const ms = Date.now() - new Date(d).getTime();
    const m = Math.floor(ms / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const day = Math.floor(h / 24);
    return day < 7 ? `${day}d ago` : new Date(d).toLocaleDateString();
  };

  const handleLike = async () => {
    if (busy) return;
    setBusy(true);
    // Optimistic update
    setIsLiked((v: boolean) => !v);
    setLikeCount((n: number) => isLiked ? n - 1 : n + 1);
    try {
      await api.post(`/posts/${post.id}/like`);
    } catch {
      // Revert on failure
      setIsLiked((v: boolean) => !v);
      setLikeCount((n: number) => isLiked ? n + 1 : n - 1);
      showAlert({ type: 'error', title: 'Error', message: 'Could not update like.' });
    } finally { setBusy(false); }
  };

  const imgUri = post.mediaUrl
    ? (post.mediaUrl.startsWith('http') || post.mediaUrl.startsWith('data:') ? post.mediaUrl : `${API_BASE_URL}${post.mediaUrl}`)
    : null;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.authorRow}>
          <Avatar uri={post.author.avatar} name={post.author.name} size={36} />
          <View style={{ marginLeft: Spacing.sm }}>
            <Text style={[styles.username, { color: colors.text }]}>{post.author.username}</Text>
            <Text style={[styles.ts, { color: colors.textSecondary }]}>{fmt(post.createdAt)}</Text>
          </View>
        </Pressable>
        {post.author.id === currentUserId && onDelete && (
          <Pressable onPress={() => onDelete(post.id)} style={styles.del}>
            <Text style={[styles.delText, { color: colors.textSecondary }]}>✕</Text>
          </Pressable>
        )}
      </View>

      {/* Image */}
      {imgUri && <Image source={{ uri: imgUri }} style={styles.img} resizeMode="cover" />}

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable style={styles.action} onPress={handleLike}>
          <Text style={styles.actionIcon}>{isLiked ? '❤️' : '🤍'}</Text>
          <Text style={[styles.count, { color: colors.text }]}>{likeCount}</Text>
        </Pressable>
        <Pressable style={styles.action} onPress={() => router.push(`/post/${post.id}` as any)}>
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={[styles.count, { color: colors.text }]}>{post._count.comments}</Text>
        </Pressable>
      </View>

      {/* Caption */}
      {post.caption && (
        <View style={styles.captionRow}>
          <Text style={[styles.captionUser, { color: colors.text }]}>{post.author.username} </Text>
          <Text style={[styles.caption, { color: colors.text }]}>{post.caption}</Text>
        </View>
      )}

      {post._count.comments > 0 && (
        <Pressable onPress={() => router.push(`/post/${post.id}` as any)}>
          <Text style={[styles.viewComments, { color: colors.textSecondary }]}>
            View all {post._count.comments} comments
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderBottomWidth: 1, marginBottom: 2 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
  },
  authorRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  username: { fontSize: FontSize.sm, fontWeight: '700' },
  ts: { fontSize: FontSize.xs },
  del: { padding: Spacing.xs },
  delText: { fontSize: FontSize.md },
  img: { width: W, height: W },
  actions: { flexDirection: 'row', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, gap: Spacing.md },
  action: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionIcon: { fontSize: 22 },
  count: { fontSize: FontSize.sm, fontWeight: '600' },
  captionRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.md, paddingBottom: Spacing.xs },
  captionUser: { fontSize: FontSize.sm, fontWeight: '700' },
  caption: { fontSize: FontSize.sm, flex: 1 },
  viewComments: { fontSize: FontSize.sm, paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm },
});
