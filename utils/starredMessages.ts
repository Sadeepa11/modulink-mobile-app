// ============================================================
// Starred Messages — stored locally in AsyncStorage
// ============================================================
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@modulink_starred';

export interface StarredMsg {
  msgId:            string | number;
  content:          string | null;
  messageType:      string;
  mediaUrl?:        string | null;
  createdAt:        string;
  conversationId:   number;
  conversationName: string;
  sender: { id: number; name: string; username: string; avatar: string | null };
}

export async function loadStarred(): Promise<StarredMsg[]> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function starMessage(msg: StarredMsg): Promise<void> {
  const list = await loadStarred();
  if (list.find(m => String(m.msgId) === String(msg.msgId))) return;
  await AsyncStorage.setItem(KEY, JSON.stringify([msg, ...list]));
}

export async function unstarMessage(msgId: string | number): Promise<void> {
  const list = await loadStarred();
  await AsyncStorage.setItem(KEY, JSON.stringify(
    list.filter(m => String(m.msgId) !== String(msgId))
  ));
}

export async function isStarred(msgId: string | number): Promise<boolean> {
  const list = await loadStarred();
  return list.some(m => String(m.msgId) === String(msgId));
}
