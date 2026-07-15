// ============================================================
// Saved Messages — personal notes stored locally
// ============================================================
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@modulink_saved_msgs';

export interface SavedNote {
  id:        string;
  text:      string;
  createdAt: string;
}

export async function loadSavedNotes(): Promise<SavedNote[]> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function addSavedNote(text: string): Promise<SavedNote> {
  const note: SavedNote = { id: String(Date.now()), text, createdAt: new Date().toISOString() };
  const list = await loadSavedNotes();
  await AsyncStorage.setItem(KEY, JSON.stringify([...list, note]));
  return note;
}

export async function deleteSavedNote(id: string): Promise<void> {
  const list = await loadSavedNotes();
  await AsyncStorage.setItem(KEY, JSON.stringify(list.filter(n => n.id !== id)));
}
