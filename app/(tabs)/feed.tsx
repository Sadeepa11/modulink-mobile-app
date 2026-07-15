// ============================================================
// Feed Screen — Instagram-style (themed, custom alerts)
// ============================================================

import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PostCard } from '@/components/PostCard';
import { StoryRow } from '@/components/StoryRow';
import { FontSize, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useCustomAlert } from '@/context/AlertContext';
import { useAppTheme } from '@/hooks/useAppTheme';
import api from '@/services/api';
import Logger from '@/utils/logger';

export default function FeedScreen() {
  const { user } = useAuth();
  const { colors, isDark } = useAppTheme();
  const { showAlert } = useCustomAlert();

  const HDR_BG = isDark ? '#071a30' : '#083a7a';

  const [posts, setPosts] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newCaption, setNewCaption] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);

  const fetchFeed = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }
    try {
      const [postsRes, storiesRes] = await Promise.all([api.get('/posts'), api.get('/stories')]);
      setPosts(postsRes.data);
      setStories(storiesRes.data);
    } catch (e) { Logger.error('Feed fetch error', e); }
    finally { setIsLoading(false); setIsRefreshing(false); }
  }, [user]);

  useEffect(() => { fetchFeed(); }, [fetchFeed]);

  const handleDelete = (postId: number) => {
    showAlert({
      type: 'confirm',
      title: 'Delete Post',
      message: 'This will permanently remove your post.',
      confirmText: 'Delete',
      cancelText: 'Keep',
      destructive: true,
      onConfirm: async () => {
        try {
          await api.delete(`/posts/${postId}`);
          setPosts((prev) => prev.filter((p) => p.id !== postId));
          showAlert({ type: 'success', title: 'Deleted', message: 'Your post has been removed.' });
        } catch {
          showAlert({ type: 'error', title: 'Error', message: 'Failed to delete post.' });
        }
      },
    });
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (!result.canceled) setSelectedImage(result.assets[0].uri);
  };

  const handlePost = async () => {
    if (!selectedImage && !newCaption.trim()) {
      showAlert({ type: 'warning', title: 'Empty Post', message: 'Please add an image or caption.' });
      return;
    }
    setIsPosting(true);
    try {
      let base64Image = null;
      if (selectedImage) {
        const base64Data = await FileSystem.readAsStringAsync(selectedImage, {
          encoding: FileSystem.EncodingType.Base64,
        });
        base64Image = `data:image/jpeg;base64,${base64Data}`;
      }

      const res = await api.post('/posts', {
        caption: newCaption.trim() || undefined,
        image: base64Image || undefined,
      });

      setPosts((prev) => [res.data, ...prev]);
      setShowModal(false);
      setNewCaption('');
      setSelectedImage(null);
      showAlert({ type: 'success', title: 'Posted!', message: 'Your post is now live.' });
    } catch (e) {
      Logger.error('Create post error', e);
      showAlert({ type: 'error', title: 'Failed', message: 'Could not create post. Please try again.' });
    } finally { setIsPosting(false); }
  };

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: HDR_BG }]}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#071524' : colors.background }]} edges={['bottom']}>
      <FlatList
        data={posts}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <PostCard post={item} currentUserId={user?.id || 0} onDelete={handleDelete} />
        )}
        ListHeaderComponent={
          <StoryRow
            stories={stories}
            currentUserId={user?.id || 0}
            onStoryPress={(g) => showAlert({ type: 'info', title: g.user.username, message: 'Story viewer coming soon!' })}
            onAddPress={() => showAlert({ type: 'info', title: 'Stories', message: 'Story creation coming soon!' })}
          />
        }
        refreshControl={
          <RefreshControl refreshing={isRefreshing}
            onRefresh={() => { setIsRefreshing(true); fetchFeed(); }}
            tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📸</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Your feed is empty</Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>Follow people or create your first post!</Text>
          </View>
        }
      />

      {/* FAB — solid background to match Chats / Groups */}
      <Pressable
        style={({ pressed }) => [styles.fab, { transform: [{ scale: pressed ? 0.93 : 1 }] }]}
        onPress={() => setShowModal(true)}>
        <View style={[StyleSheet.absoluteFill, { borderRadius: 29, backgroundColor: colors.primary }]} />
        <Ionicons name="add" size={32} color={colors.textOnPrimary} style={{ zIndex: 1 }} />
      </Pressable>

      {/* Create Post Modal */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowModal(false)}>
        <SafeAreaView style={[styles.modalWrap, { backgroundColor: colors.surface }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Pressable onPress={() => setShowModal(false)}>
              <Text style={[{ color: colors.textSecondary, fontSize: FontSize.md }]}>Cancel</Text>
            </Pressable>
            <Text style={[styles.modalTitle, { color: colors.text }]}>New Post</Text>
            <Pressable onPress={handlePost} disabled={isPosting}>
              <Text style={[{ fontSize: FontSize.md, fontWeight: '700', color: colors.primary }, isPosting && styles.dim]}>Share</Text>
            </Pressable>
          </View>

          <Pressable
            style={[styles.imgPicker, { borderColor: selectedImage ? colors.primary : colors.border, backgroundColor: colors.surfaceAlt }]}
            onPress={pickImage}>
            {selectedImage
              ? <Text style={[styles.imgSelected, { color: colors.primary }]}>✓ Image selected — tap to change</Text>
              : <>
                  <Ionicons name="image-outline" size={48} color={colors.accent} />
                  <Text style={[{ fontSize: FontSize.sm, color: colors.textSecondary }]}>Tap to select a photo</Text>
                </>}
          </Pressable>

          <TextInput
            style={[styles.captionInput, { color: colors.text, borderColor: colors.border }]}
            placeholder="Write a caption…" placeholderTextColor={colors.textSecondary}
            value={newCaption} onChangeText={setNewCaption} multiline maxLength={2200}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: Spacing.xl },
  emptyEmoji: { fontSize: 52, marginBottom: Spacing.md },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', marginBottom: Spacing.sm },
  emptySub: { fontSize: FontSize.sm, textAlign: 'center', lineHeight: 20 },
  fab: {
    position: 'absolute', bottom: Spacing.xl, right: Spacing.lg,
    width: 58, height: 58, borderRadius: 29,
    justifyContent: 'center', alignItems: 'center',
    elevation: 8, shadowColor: '#083a7a',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8,
  },
  modalWrap: { flex: 1 },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, borderBottomWidth: 1,
  },
  modalTitle: { fontSize: FontSize.lg, fontWeight: '700' },
  dim: { opacity: 0.5 },
  imgPicker: {
    height: 200, margin: Spacing.md, borderRadius: 14,
    borderWidth: 2, borderStyle: 'dashed',
    justifyContent: 'center', alignItems: 'center', gap: Spacing.sm,
  },
  imgSelected: { fontSize: FontSize.sm, fontWeight: '600' },
  captionInput: {
    marginHorizontal: Spacing.md, fontSize: FontSize.md,
    minHeight: 80, textAlignVertical: 'top', borderTopWidth: 1, paddingTop: Spacing.md,
  },
});
