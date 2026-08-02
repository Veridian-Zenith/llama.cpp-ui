export type MemoryCategory = 'fact' | 'preference' | 'person' | 'project' | 'note' | 'skill' | 'context';

export interface Memory {
  id: string;
  key: string;
  value: string;
  category: MemoryCategory;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  accessCount: number;
  lastAccessedAt: number;
  source: 'user' | 'assistant' | 'auto';
  chatId?: string;
}

export interface MemorySearchResult {
  memory: Memory;
  score: number;
}

const STORAGE_KEY = 'llamacpp-memories';

function generateId(): string {
  return `mem-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function loadMemories(): Memory[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveMemories(memories: Memory[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(memories));
}

export const memoryStore = {
  getAll(): Memory[] {
    return loadMemories();
  },

  getById(id: string): Memory | undefined {
    return loadMemories().find((m) => m.id === id);
  },

  getByKey(key: string): Memory | undefined {
    return loadMemories().find((m) => m.key === key);
  },

  getByCategory(category: MemoryCategory): Memory[] {
    return loadMemories().filter((m) => m.category === category);
  },

  getByChat(chatId: string): Memory[] {
    return loadMemories().filter((m) => m.chatId === chatId);
  },

  search(query: string): MemorySearchResult[] {
    const memories = loadMemories();
    const q = query.toLowerCase();
    const results: MemorySearchResult[] = [];

    for (const mem of memories) {
      let score = 0;
      const keyLower = mem.key.toLowerCase();
      const valLower = mem.value.toLowerCase();

      // Exact key match
      if (keyLower === q) score += 10;
      // Key contains query
      else if (keyLower.includes(q)) score += 5;
      // Value contains query
      else if (valLower.includes(q)) score += 3;
      // Tag match
      if (mem.tags.some((t) => t.toLowerCase().includes(q))) score += 4;
      // Fuzzy: check if all words match
      const words = q.split(/\s+/);
      if (words.every((w) => keyLower.includes(w) || valLower.includes(w))) score += 2;

      // Boost by access count (popular memories rank higher)
      score += Math.min(mem.accessCount * 0.1, 2);

      if (score > 0) results.push({ memory: mem, score });
    }

    return results.sort((a, b) => b.score - a.score);
  },

  store(
    key: string,
    value: string,
    opts: {
      category?: MemoryCategory;
      tags?: string[];
      source?: 'user' | 'assistant' | 'auto';
      chatId?: string;
    } = {}
  ): Memory {
    const memories = loadMemories();
    const now = Date.now();

    // Upsert: update if key exists
    const existing = memories.find((m) => m.key === key);
    if (existing) {
      existing.value = value;
      existing.category = opts.category || existing.category;
      existing.tags = opts.tags || existing.tags;
      existing.updatedAt = now;
      existing.accessCount++;
      existing.lastAccessedAt = now;
      saveMemories(memories);
      return existing;
    }

    const mem: Memory = {
      id: generateId(),
      key,
      value,
      category: opts.category || 'note',
      tags: opts.tags || [],
      createdAt: now,
      updatedAt: now,
      accessCount: 1,
      lastAccessedAt: now,
      source: opts.source || 'auto',
      chatId: opts.chatId,
    };

    memories.push(mem);
    saveMemories(memories);
    return mem;
  },

  retrieve(key: string): Memory | undefined {
    const memories = loadMemories();
    const mem = memories.find((m) => m.key === key);
    if (mem) {
      mem.accessCount++;
      mem.lastAccessedAt = Date.now();
      saveMemories(memories);
    }
    return mem;
  },

  update(id: string, partial: Partial<Pick<Memory, 'key' | 'value' | 'category' | 'tags'>>): Memory | undefined {
    const memories = loadMemories();
    const mem = memories.find((m) => m.id === id);
    if (!mem) return undefined;

    if (partial.key !== undefined) mem.key = partial.key;
    if (partial.value !== undefined) mem.value = partial.value;
    if (partial.category !== undefined) mem.category = partial.category;
    if (partial.tags !== undefined) mem.tags = partial.tags;
    mem.updatedAt = Date.now();

    saveMemories(memories);
    return mem;
  },

  delete(id: string): boolean {
    const memories = loadMemories();
    const idx = memories.findIndex((m) => m.id === id);
    if (idx === -1) return false;
    memories.splice(idx, 1);
    saveMemories(memories);
    return true;
  },

  clear(): void {
    saveMemories([]);
  },

  exportAll(): string {
    return JSON.stringify(loadMemories(), null, 2);
  },

  importAll(json: string): number {
    try {
      const imported: Memory[] = JSON.parse(json);
      const existing = loadMemories();
      const existingKeys = new Set(existing.map((m) => m.key));
      let added = 0;

      for (const mem of imported) {
        if (!existingKeys.has(mem.key)) {
          existing.push(mem);
          added++;
        }
      }

      saveMemories(existing);
      return added;
    } catch {
      return 0;
    }
  },

  /** Build a context string from relevant memories for system prompt injection */
  buildContext(query: string, maxTokens: number = 500): string {
    const results = this.search(query);
    if (results.length === 0) return '';

    const lines: string[] = ['# Known Context'];
    let tokenEstimate = 0;

    for (const { memory } of results) {
      const line = `- ${memory.key}: ${memory.value}`;
      const lineTokens = Math.ceil(line.length / 4); // rough estimate
      if (tokenEstimate + lineTokens > maxTokens) break;
      lines.push(line);
      tokenEstimate += lineTokens;
    }

    return lines.join('\n');
  },

  /** Auto-extract memories from a conversation message */
  autoExtract(message: string, chatId?: string): Memory[] {
    const extracted: Memory[] = [];

    // Patterns that indicate user facts/preferences
    const patterns: Array<{ regex: RegExp; category: MemoryCategory; keyFn: (m: RegExpMatchArray) => string }> = [
      { regex: /(?:my name is|i'm|i am|call me)\s+(\w+)/i, category: 'person', keyFn: () => `user_name` },
      { regex: /(?:i (?:like|love|prefer|enjoy))\s+(.+?)(?:\.|$)/i, category: 'preference', keyFn: () => `preference_${Date.now()}` },
      { regex: /(?:i (?:hate|dislike|don't like))\s+(.+?)(?:\.|$)/i, category: 'preference', keyFn: () => `dislike_${Date.now()}` },
      { regex: /(?:i work (?:on|with|at))\s+(.+?)(?:\.|$)/i, category: 'project', keyFn: () => `project_${Date.now()}` },
      { regex: /(?:i (?:live|am based) (?:in|at))\s+(.+?)(?:\.|$)/i, category: 'fact', keyFn: () => `location_${Date.now()}` },
      { regex: /(?:remember|note|don't forget)(?: that)?\s+(.+?)(?:\.|$)/i, category: 'note', keyFn: () => `note_${Date.now()}` },
    ];

    for (const { regex, category, keyFn } of patterns) {
      const match = message.match(regex);
      if (match) {
        const mem = this.store(keyFn(match), match[0].trim(), {
          category,
          source: 'auto',
          chatId,
        });
        extracted.push(mem);
      }
    }

    return extracted;
  },
};
