import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare, Plus, Trash2, Edit3, Check, X,
  Clock, Search,
} from 'lucide-react';
import { chatStore } from '../lib/chat-store';
import { useStore } from '../lib/store';

export function ChatHistory() {
  const { activeChatId, switchChat, deleteChat, renameChat, chats } = useStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAll, setShowAll] = useState(false);

  const filteredChats = searchQuery
    ? chatStore.search(searchQuery)
    : chats;

  const displayedChats = showAll ? filteredChats : filteredChats.slice(0, 20);

  const handleNew = () => {
    useStore.getState().createChat();
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Delete this chat?')) {
      deleteChat(id);
    }
  };

  const handleRename = (id: string) => {
    if (editTitle.trim()) {
      renameChat(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-2">
      {/* Search + New */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--vz-text-secondary)]/25" />
          <input
            type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chats..."
            className="w-full bg-[var(--vz-bg-secondary)] border border-[var(--vz-border-color)]/50 rounded-lg pl-7 pr-2 py-1.5 text-[10px] font-mono text-[var(--vz-text-secondary)] placeholder:text-[var(--vz-accent-muted)]/20 outline-none focus:border-[var(--vz-accent-vibrant)]/40 transition-colors"
          />
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={handleNew}
          className="shrink-0 px-2.5 rounded-lg bg-[var(--vz-accent-vibrant)]/10 border border-[var(--vz-accent-vibrant)]/30 text-[var(--vz-accent-vibrant)] hover:bg-[var(--vz-accent-vibrant)]/20 transition-colors cursor-pointer"
        >
          <Plus size={13} />
        </motion.button>
      </div>

      {/* Chat list */}
      <div className="space-y-0.5 max-h-[250px] overflow-y-auto scrollbar-hide">
        {displayedChats.length === 0 && (
          <p className="text-center text-[10px] text-[var(--vz-text-secondary)]/20 py-4 font-mono">
            {searchQuery ? 'No matching chats' : 'No chats yet'}
          </p>
        )}
        {displayedChats.map((chat) => {
          const active = chat.id === activeChatId;
          return (
            <motion.div
              key={chat.id}
              layout
              onClick={() => switchChat(chat.id)}
              className={`group flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-colors ${
                active
                  ? 'bg-[var(--vz-accent-vibrant)]/10 border border-[var(--vz-accent-vibrant)]/20'
                  : 'hover:bg-[var(--vz-bg-secondary)]/50 border border-transparent'
              }`}
            >
              <MessageSquare size={11} className={active ? 'text-[var(--vz-accent-vibrant)]' : 'text-[var(--vz-text-secondary)]/25'} />
              <div className="flex-1 min-w-0">
                {editingId === chat.id ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                      className="flex-1 bg-[var(--vz-bg-primary)] border border-[var(--vz-accent-vibrant)]/30 rounded px-1.5 py-0.5 text-[10px] font-mono text-[var(--vz-text-secondary)] outline-none"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRename(chat.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                    />
                    <button onClick={() => handleRename(chat.id)} className="text-green-400 cursor-pointer"><Check size={10} /></button>
                    <button onClick={() => setEditingId(null)} className="text-red-400 cursor-pointer"><X size={10} /></button>
                  </div>
                ) : (
                  <>
                    <div className={`text-[11px] font-mono truncate ${active ? 'text-[var(--vz-accent-vibrant)]' : 'text-[var(--vz-text-secondary)]/60'}`}>
                      {chat.title}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] text-[var(--vz-text-secondary)]/20 font-mono">
                        {chat.messages.length} msg
                      </span>
                      <span className="text-[9px] text-[var(--vz-text-secondary)]/15 font-mono flex items-center gap-0.5">
                        <Clock size={7} /> {formatTime(chat.updatedAt)}
                      </span>
                    </div>
                  </>
                )}
              </div>
              {/* Actions */}
              {!editingId && (
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditingId(chat.id); setEditTitle(chat.title); }}
                    className="p-0.5 text-[var(--vz-text-secondary)]/20 hover:text-[var(--vz-accent-vibrant)] cursor-pointer"
                  >
                    <Edit3 size={9} />
                  </button>
                  <button
                    onClick={(e) => handleDelete(e, chat.id)}
                    className="p-0.5 text-[var(--vz-text-secondary)]/20 hover:text-red-400 cursor-pointer"
                  >
                    <Trash2 size={9} />
                  </button>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {filteredChats.length > 20 && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full text-center text-[10px] text-[var(--vz-accent-vibrant)]/40 hover:text-[var(--vz-accent-vibrant)]/70 font-mono cursor-pointer py-1"
        >
          Show all ({filteredChats.length})
        </button>
      )}

      <div className="text-[9px] text-center text-[var(--vz-text-secondary)]/15 font-mono">
        {chats.length} chats
      </div>
    </div>
  );
}
