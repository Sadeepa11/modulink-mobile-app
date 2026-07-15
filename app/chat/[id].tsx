// ============================================================
// Chat Screen — premium design + sticker support
// ============================================================

import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { DeviceEventEmitter } from 'react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
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
import { MessageBubble } from '@/components/MessageBubble';
import { FontSize, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { useAppTheme } from '@/hooks/useAppTheme';
import api from '@/services/api';
import Logger from '@/utils/logger';

// ── Date separator helpers ────────────────────────────────────
function formatSeparator(dateStr: string): string {
  const d   = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.setHours(0,0,0,0) - d.setHours(0,0,0,0)) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7)   return d.toLocaleDateString([], { weekday: 'long' });
  return d.toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function ChatScreen() {
  const { id }      = useLocalSearchParams<{ id: string }>();
  const { user }    = useAuth();
  const { socket }  = useSocket();
  const navigation  = useNavigation();
  const { colors, isDark } = useAppTheme();

  const [messages,     setMessages]    = useState<any[]>([]);
  const [conversation, setConversation]= useState<any>(null);
  const [isLoading,    setIsLoading]   = useState(true);
  const [inputText,    setInputText]   = useState('');
  const [typingUsers,  setTypingUsers] = useState<string[]>([]);

  const flatListRef   = useRef<FlatList>(null);
  const typingRef     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const conversationId = parseInt(id);

  // ── Inject date separators into the message list ──────────
  const listData = useMemo(() => {
    const result: any[] = [];
    let lastDate = '';
    for (const msg of messages) {
      const day = new Date(msg.createdAt).toDateString();
      if (day !== lastDate) {
        result.push({ _type: 'separator', id: `sep_${day}`, date: msg.createdAt });
        lastDate = day;
      }
      result.push(msg);
    }
    return result;
  }, [messages]);

  // ── Load data ────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      const [convRes, msgRes] = await Promise.all([
        api.get(`/conversations/${conversationId}`),
        api.get(`/messages/${conversationId}`),
      ]);
      setConversation(convRes.data);
      setMessages(msgRes.data);

      const other = convRes.data.participants.find((p: any) => p.user.id !== user?.id);
      const title = convRes.data.isGroup
        ? convRes.data.name || 'Group Chat'
        : other?.user.name || other?.user.username || 'Chat';

      navigation.setOptions({
        title,
        headerRight: () => (
          <View style={{ marginRight: 12 }}>
            <Avatar
              uri={convRes.data.isGroup ? null : other?.user.avatar}
              name={title}
              size={34}
              showOnline={!convRes.data.isGroup}
              isOnline={other?.user.isOnline}
            />
          </View>
        ),
      });

      await api.put(`/messages/${conversationId}/read`);
    } catch (e) {
      Logger.error('Failed to load chat', e);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, user?.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Socket ───────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;
    socket.emit('join_conversation', conversationId);

    const onMessage = (msg: any) => {
      if (msg.conversationId !== conversationId) return;
      setMessages(prev => {
        // If it's a message we sent temporarily, replace it with the DB message
        if (msg.tempId && prev.some(m => m.id === msg.tempId)) {
          return prev.map(m => m.id === msg.tempId ? msg : m);
        }
        // Deduplicate messages already in the state
        if (prev.some(m => m.id === msg.id)) {
          return prev;
        }
        return [...prev, msg];
      });
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);
      if (msg.senderId !== user?.id)
        api.put(`/messages/${conversationId}/read`).catch(() => {});
    };
    const onTyping = (data: any) => {
      if (data.userId === user?.id) return;
      setTypingUsers(prev =>
        data.isTyping
          ? prev.includes(data.username) ? prev : [...prev, data.username]
          : prev.filter(n => n !== data.username)
      );
    };

    socket.on('new_message', onMessage);
    socket.on('user_typing', onTyping);
    return () => {
      socket.emit('leave_conversation', conversationId);
      socket.off('new_message', onMessage);
      socket.off('user_typing', onTyping);
      // Notify lists to refresh last-message preview + unread count when leaving chat
      DeviceEventEmitter.emit('REFRESH_CHATS');
      DeviceEventEmitter.emit('REFRESH_GROUPS');
    };
  }, [socket, conversationId, user?.id]);

  useEffect(() => {
    if (messages.length > 0 && !isLoading)
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 80);
  }, [isLoading]);

  // Scroll to bottom when keyboard opens
  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => {
      if (messages.length > 0) {
        flatListRef.current?.scrollToEnd({ animated: true });
      }
    });
    return () => {
      showSub.remove();
    };
  }, [messages.length]);



  // ── Typing ───────────────────────────────────────────────
  const handleTextChange = (text: string) => {
    setInputText(text);
    if (!socket || !user) return;
    socket.emit('typing_start', { conversationId, userId: user.id, username: user.username });
    if (typingRef.current) clearTimeout(typingRef.current);
    typingRef.current = setTimeout(() => {
      socket?.emit('typing_stop', { conversationId, userId: user.id, username: user.username });
    }, 2000);
  };

  // ── Send text ────────────────────────────────────────────
  const handleSend = () => {
    const text = inputText.trim();
    if (!text || !user) return;
    setInputText('');
    if (typingRef.current) clearTimeout(typingRef.current);
    socket?.emit('typing_stop', { conversationId, userId: user.id, username: user.username });

    const tempId = `temp_${Date.now()}`;
    setMessages(prev => [...prev, {
      id: tempId, content: text, messageType: 'text', status: 'sent',
      createdAt: new Date().toISOString(), conversationId, senderId: user.id,
      sender: { id: user.id, username: user.username, name: user.name, avatar: user.avatar },
    }]);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);
    socket?.emit('send_message', { conversationId, content: text, messageType: 'text', senderId: user.id, tempId });
  };

  // ── Send image ───────────────────────────────────────────
  const handleSendImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
    if (result.canceled || !result.assets[0]) return;
    try {
      const form = new FormData();
      form.append('conversationId', String(conversationId));
      form.append('messageType', 'image');
      form.append('media', { uri: result.assets[0].uri, type: 'image/jpeg', name: 'img.jpg' } as any);
      const res = await api.post('/messages', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMessages(prev => [...prev, res.data]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);
    } catch (e) { Logger.error('Image send error', e); }
  };



  // ── Wallpaper gradient colours ───────────────────────────
  const wallpaperColors: [string, string, string] = isDark
    ? ['#050e1a', '#071a2e', '#050e1a']
    : ['#dce9f2', '#e8f2f8', '#dce9f2'];

  if (isLoading) {
    return (
      <View style={s.center}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={s.root}>
      {/* Wallpaper background */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />

      <SafeAreaView style={s.safe} edges={['bottom']}>
        <KeyboardAvoidingView
          style={s.kav}
          behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 80}>

          {/* ── Message list ──────────────────────────── */}
          <FlatList
            ref={flatListRef}
            data={listData}
            keyExtractor={item => String(item.id)}
            contentContainerStyle={s.msgList}
            maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
            renderItem={({ item, index }) => {
              // Date separator
              if (item._type === 'separator') {
                return (
                  <View style={s.sepRow}>
                    <View style={[s.sepPill, {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(8,58,122,0.08)',
                    }]}>
                      <Text style={[s.sepTxt, { color: colors.textSecondary }]}>
                        {formatSeparator(item.date)}
                      </Text>
                    </View>
                  </View>
                );
              }

              // Real messages — find original index in messages array
              const msgIndex = messages.findIndex(m => m.id === item.id);
              const isMe     = (item.senderId ?? item.sender?.id) === user?.id;
              const prev     = msgIndex > 0 ? messages[msgIndex - 1] : null;
              const showAvatar = conversation?.isGroup && !isMe &&
                (!prev || prev.senderId !== item.senderId);

              return (
                <MessageBubble
                  message={item}
                  isMe={isMe}
                  showAvatar={showAvatar}
                  showSenderName={conversation?.isGroup && showAvatar}
                  conversationName={
                    conversation?.isGroup
                      ? conversation.name
                      : conversation?.participants?.find((p: any) => p.user.id !== user?.id)?.user?.name || 'Chat'
                  }
                />
              );
            }}
          />

          {/* ── Typing indicator ──────────────────────── */}
          {typingUsers.length > 0 && (
            <View style={[s.typingRow, {
              backgroundColor: isDark ? 'rgba(13,32,53,0.8)' : 'rgba(255,255,255,0.8)',
              borderTopColor: colors.border,
            }]}>
              <View style={[s.typingDots, {
                backgroundColor: isDark ? 'rgba(20,48,76,0.9)' : 'rgba(255,255,255,0.96)',
                borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(8,58,122,0.08)',
              }]}>
                <Text style={[s.typingTxt, { color: colors.textSecondary }]}>
                  {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing…
                </Text>
              </View>
            </View>
          )}

          {/* ── Input bar ─────────────────────────────── */}
          <View style={s.inputBar}>
            <View style={[s.inputCard, { backgroundColor: colors.surface }]}>
              <Pressable onPress={handleSendImage} style={s.attachBtn} hitSlop={6}>
                <Ionicons name="image-outline" size={22} color={colors.textSecondary} />
              </Pressable>

              <TextInput
                style={[s.input, { color: colors.text }]}
                placeholder="Message…"
                placeholderTextColor={colors.textSecondary}
                value={inputText}
                onChangeText={handleTextChange}
                multiline
                maxLength={5000}
              />
            </View>

            <Pressable
              onPress={handleSend}
              disabled={!inputText.trim()}
              style={({ pressed }) => [
                s.sendBtn,
                {
                  backgroundColor: inputText.trim() ? colors.primary : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(8,58,122,0.1)'),
                  transform: [{ scale: pressed ? 0.92 : 1 }],
                }
              ]}>
              <Ionicons
                name="send"
                size={18}
                color={inputText.trim() ? colors.textOnPrimary : colors.textSecondary}
              />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1 },
  safe:   { flex: 1 },
  kav:    { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  msgList: { paddingVertical: Spacing.sm, paddingBottom: Spacing.md },

  // Date separator
  sepRow:  { alignItems: 'center', marginVertical: 10 },
  sepPill: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  sepTxt:  { fontSize: FontSize.xs, fontWeight: '600' },

  // Typing
  typingRow: { paddingHorizontal: Spacing.md, paddingVertical: 4, borderTopWidth: StyleSheet.hairlineWidth },
  typingDots: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 14, borderWidth: 1,
  },
  typingTxt:  { fontSize: FontSize.xs, fontStyle: 'italic' },

  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 8,
    marginBottom: 8,
  },
  inputCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 48,
    maxHeight: 120,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  attachBtn: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: FontSize.md,
    paddingHorizontal: 4,
    paddingTop: 8,
    paddingBottom: 8,
    textAlignVertical: 'center',
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
});
