// ============================================================
// Saved Messages — personal notes (like WhatsApp "Message Yourself")
// Stored locally in AsyncStorage — no backend needed.
// ============================================================

import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
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

import { FontSize, Radius, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import {
  SavedNote,
  addSavedNote,
  deleteSavedNote,
  loadSavedNotes,
} from '@/utils/savedMessages';

export default function SavedMessagesScreen() {
  const { colors, isDark } = useAppTheme();
  const [notes,   setNotes]   = useState<SavedNote[]>([]);
  const [draft,   setDraft]   = useState('');
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    loadSavedNotes().then(setNotes);
  }, []);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    const note = await addSavedNote(text);
    setNotes(prev => [...prev, note]);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete note', 'Remove this saved message?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text:  'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteSavedNote(id);
          setNotes(prev => prev.filter(n => n.id !== id));
        },
      },
    ]);
  };

  const fmt = (d: string) =>
    new Date(d).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.chatBackground }]} edges={['bottom']}>
      <KeyboardAvoidingView
        style={s.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}>

        {/* Notes list */}
        <FlatList
          ref={listRef}
          data={notes}
          keyExtractor={n => n.id}
          contentContainerStyle={{ padding: Spacing.md, gap: 10 }}
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name="bookmark-outline" size={52} color={colors.border} />
              <Text style={[s.emptyTitle, { color: colors.text }]}>Saved Messages</Text>
              <Text style={[s.emptySub, { color: colors.textSecondary }]}>
                Save notes, links and messages here.{'\n'}Only you can see them.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              onLongPress={() => handleDelete(item.id)}
              style={[s.bubble, { backgroundColor: isDark ? '#135792' : '#d0eef5', alignSelf: 'flex-end' }]}>
              <Text style={[s.noteText, { color: isDark ? '#fff' : '#083a7a' }]}>{item.text}</Text>
              <Text style={[s.noteTime, { color: isDark ? 'rgba(255,255,255,0.55)' : 'rgba(8,58,122,0.5)' }]}>
                {fmt(item.createdAt)}
              </Text>
            </Pressable>
          )}
        />

        {/* Input bar */}
        <View style={[s.inputBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <TextInput
            style={[s.input, {
              backgroundColor: colors.surfaceAlt,
              borderColor: colors.border,
              color: colors.text,
            }]}
            placeholder="Add a note…"
            placeholderTextColor={colors.textSecondary}
            value={draft}
            onChangeText={setDraft}
            multiline
            maxLength={5000}
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />
          <Pressable
            style={[s.sendBtn, { backgroundColor: draft.trim() ? colors.primary : colors.border }]}
            onPress={handleSend}
            disabled={!draft.trim()}>
            <Ionicons name="send" size={18} color={draft.trim() ? '#fff' : colors.textSecondary} />
          </Pressable>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  kav:  { flex: 1 },
  empty: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingTop: 80, gap: Spacing.md, paddingHorizontal: Spacing.xl,
  },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '700' },
  emptySub:   { fontSize: FontSize.sm, textAlign: 'center', lineHeight: 20 },
  bubble: {
    maxWidth: '80%',
    borderRadius: Radius.lg,
    borderBottomRightRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    elevation: 1,
  },
  noteText: { fontSize: FontSize.md, lineHeight: 21 },
  noteTime: { fontSize: 10, marginTop: 4, textAlign: 'right' },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm,
    borderTopWidth: 1, gap: Spacing.sm,
  },
  input: {
    flex: 1, borderRadius: 22, paddingHorizontal: Spacing.md,
    paddingVertical: 10, fontSize: FontSize.md, maxHeight: 120, borderWidth: 1.5,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    justifyContent: 'center', alignItems: 'center',
  },
});
