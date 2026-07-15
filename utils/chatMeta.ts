// ============================================================
// Chat Metadata — pin, mute, archive, lock
// Stored in AsyncStorage keyed by conversation ID.
// ============================================================
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@modulink_chat_meta';

export interface ConvMeta {
  pinned:    boolean;
  muteUntil: number | null; // unix ms; -1 = muted forever; null = not muted
  archived:  boolean;
  locked:    boolean;
}

export type ChatMetaMap = Record<string, ConvMeta>;

const DEF: ConvMeta = { pinned: false, muteUntil: null, archived: false, locked: false };

export async function loadChatMeta(): Promise<ChatMetaMap> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : {};
}

async function save(map: ChatMetaMap): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(map));
}

export async function updateMeta(
  id: string | number,
  patch: Partial<ConvMeta>,
): Promise<ChatMetaMap> {
  const map = await loadChatMeta();
  const sid = String(id);
  map[sid] = { ...DEF, ...map[sid], ...patch };
  await save(map);
  return map;
}

export function isMuted(meta: ConvMeta | undefined): boolean {
  if (!meta?.muteUntil) return false;
  if (meta.muteUntil === -1) return true;
  return Date.now() < meta.muteUntil;
}

export function muteLabel(meta: ConvMeta | undefined): string {
  if (!meta?.muteUntil) return '';
  if (meta.muteUntil === -1) return 'Muted';
  const left = meta.muteUntil - Date.now();
  if (left <= 0) return '';
  const h = Math.ceil(left / 3600000);
  if (h < 24) return `Muted ${h}h`;
  const d = Math.ceil(left / 86400000);
  if (d < 7)  return `Muted ${d}d`;
  return `Muted ${Math.ceil(d / 7)}w`;
}
