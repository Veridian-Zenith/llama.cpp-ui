import type { DisplayMessage } from './store';

export interface ChatConversation {
  id: string;
  title: string;
  messages: DisplayMessage[];
  createdAt: number;
  updatedAt: number;
  model?: string;
  mode?: string;
  pinned?: boolean;
  tags?: string[];
}

const STORAGE_KEY = 'llamacpp-chats';
const ACTIVE_CHAT_KEY = 'llamacpp-active-chat';

function generateId(): string {
  return `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function loadChats(): ChatConversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveChats(chats: ChatConversation[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
}

function generateTitle(content: string): string {
  const clean = content.replace(/\n/g, ' ').trim();
  if (clean.length <= 40) return clean;
  return clean.slice(0, 40) + '...';
}

export const chatStore = {
  getAll(): ChatConversation[] {
    return loadChats().sort((a, b) => b.updatedAt - a.updatedAt);
  },

  getById(id: string): ChatConversation | undefined {
    return loadChats().find((c) => c.id === id);
  },

  getActiveId(): string | null {
    return localStorage.getItem(ACTIVE_CHAT_KEY);
  },

  setActiveId(id: string | null): void {
    if (id) localStorage.setItem(ACTIVE_CHAT_KEY, id);
    else localStorage.removeItem(ACTIVE_CHAT_KEY);
  },

  create(firstMessage?: string): ChatConversation {
    const chats = loadChats();
    const now = Date.now();
    const chat: ChatConversation = {
      id: generateId(),
      title: firstMessage ? generateTitle(firstMessage) : 'New Chat',
      messages: [],
      createdAt: now,
      updatedAt: now,
    };
    chats.push(chat);
    saveChats(chats);
    this.setActiveId(chat.id);
    return chat;
  },

  update(id: string, partial: Partial<Pick<ChatConversation, 'title' | 'pinned' | 'tags' | 'model' | 'mode'>>): ChatConversation | undefined {
    const chats = loadChats();
    const chat = chats.find((c) => c.id === id);
    if (!chat) return undefined;

    if (partial.title !== undefined) chat.title = partial.title;
    if (partial.pinned !== undefined) chat.pinned = partial.pinned;
    if (partial.tags !== undefined) chat.tags = partial.tags;
    if (partial.model !== undefined) chat.model = partial.model;
    if (partial.mode !== undefined) chat.mode = partial.mode;
    chat.updatedAt = Date.now();

    saveChats(chats);
    return chat;
  },

  addMessage(chatId: string, message: DisplayMessage): void {
    const chats = loadChats();
    const chat = chats.find((c) => c.id === chatId);
    if (!chat) return;

    chat.messages.push(message);
    chat.updatedAt = Date.now();

    // Auto-title from first user message
    if (chat.messages.length === 1 && message.role === 'user') {
      chat.title = generateTitle(message.content);
    }

    saveChats(chats);
  },

  updateMessages(chatId: string, messages: DisplayMessage[]): void {
    const chats = loadChats();
    const chat = chats.find((c) => c.id === chatId);
    if (!chat) return;

    chat.messages = messages;
    chat.updatedAt = Date.now();
    saveChats(chats);
  },

  delete(id: string): boolean {
    const chats = loadChats();
    const idx = chats.findIndex((c) => c.id === id);
    if (idx === -1) return false;
    chats.splice(idx, 1);
    saveChats(chats);
    if (this.getActiveId() === id) {
      this.setActiveId(chats[0]?.id || null);
    }
    return true;
  },

  clearAll(): void {
    saveChats([]);
    localStorage.removeItem(ACTIVE_CHAT_KEY);
  },

  search(query: string): ChatConversation[] {
    const q = query.toLowerCase();
    return loadChats()
      .filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.messages.some((m) => m.content.toLowerCase().includes(q))
      )
      .sort((a, b) => b.updatedAt - a.updatedAt);
  },

  exportAll(): string {
    return JSON.stringify(loadChats(), null, 2);
  },

  importAll(json: string): number {
    try {
      const imported: ChatConversation[] = JSON.parse(json);
      const existing = loadChats();
      const existingIds = new Set(existing.map((c) => c.id));
      let added = 0;

      for (const chat of imported) {
        if (!existingIds.has(chat.id)) {
          existing.push(chat);
          added++;
        }
      }

      saveChats(existing);
      return added;
    } catch {
      return 0;
    }
  },

  /** Get summary stats for display */
  getStats(): { totalChats: number; totalMessages: number; storageUsed: number } {
    const chats = loadChats();
    const totalMessages = chats.reduce((sum, c) => sum + c.messages.length, 0);
    const raw = localStorage.getItem(STORAGE_KEY) || '';
    return {
      totalChats: chats.length,
      totalMessages,
      storageUsed: new Blob([raw]).size,
    };
  },
};
