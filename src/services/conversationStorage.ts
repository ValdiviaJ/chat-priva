export interface SavedConversation {
  id: string;
  code: string;
  title: string;
  lastMessage?: string;
  lastActivity?: string;
  icon?: 'message' | 'code' | 'lightbulb' | 'file';
}

const STORAGE_KEY = 'quickchat_conversations';

export function getSavedConversations(): SavedConversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveConversation(conv: SavedConversation): void {
  try {
    const list = getSavedConversations();
    const existingIndex = list.findIndex(c => c.code === conv.code || c.id === conv.id);
    if (existingIndex >= 0) {
      list[existingIndex] = {
        ...list[existingIndex],
        ...conv,
        lastActivity: conv.lastActivity || list[existingIndex].lastActivity || new Date().toISOString(),
      };
    } else {
      list.unshift({
        ...conv,
        lastActivity: conv.lastActivity || new Date().toISOString(),
        icon: conv.icon || 'message'
      });
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 30)));
  } catch (e) {
    console.error('Error saving conversation to local storage', e);
  }
}

export function updateConversationTitle(code: string, newTitle: string): void {
  try {
    const list = getSavedConversations();
    const idx = list.findIndex(c => c.code === code || c.id === code);
    if (idx >= 0) {
      list[idx].title = newTitle;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    }
  } catch (e) {
    console.error('Error updating title', e);
  }
}

export function removeConversation(codeOrId: string): void {
  try {
    const list = getSavedConversations().filter(c => c.code !== codeOrId && c.id !== codeOrId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Error removing conversation', e);
  }
}
