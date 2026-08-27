import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare, Plus, Trash2, Edit3, Check, X, Clock, Search,
} from 'lucide-react';
import { chatStore } from '../lib/chat-store';
import { useStore } from '../lib/store';

interface Props {
  onOpenSettings: () => void;
}

export function LeftPanel({ onOpenSettings: _onOpenSettings }: Props) {
  const { activeChatId, switchChat, deleteChat, renameChat, chats, createChat } = useStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [now, setNow] = useState(0);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const timeout = setTimeout(tick, 0);
    const interval = setInterval(tick, 30000);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  const filtered = searchQuery ? chatStore.search(searchQuery) : chats;

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteChat(id);
  };

  const handleRename = (id: string) => {
    if (editTitle.trim()) renameChat(id, editTitle.trim());
    setEditingId(null);
  };

  const formatTime = (ts: number) => {
    const diffMs = now - ts;
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d`;
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="h-full flex flex-col bg-[var(--vz-bg-primary)] overflow-hidden">
      {/* Header — fluid sizing */}
      <div className="px-[clamp(8px,1.2vw,12px)] pt-[clamp(8px,1vw,12px)] pb-2 shrink-0">
        <button
          onClick={() => createChat()}
          className="w-full flex items-center justify-center gap-1.5 h-[clamp(32px,4vw,36px)] rounded-xl bg-[var(--vz-accent-vibrant)]/10 border border-[var(--vz-accent-vibrant)]/20 text-[var(--vz-accent-vibrant)] text-[clamp(11px,1vw,12px)] font-bold hover:bg-[var(--vz-accent-vibrant)]/15 transition-colors cursor-pointer"
        >
          <Plus size={14} className="w-[clamp(12px,1.2vw,14px)] h-[clamp(12px,1.2vw,14px)]" /> New chat
        </button>
      </div>

      {/* Chat list header */}
      <div className="flex items-center justify-between px-[clamp(8px,1vw,12px)] pt-1 pb-1.5 shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <MessageSquare size={12} className="text-[var(--vz-accent-vibrant)]/50 shrink-0 w-[clamp(11px,1vw,12px)] h-[clamp(11px,1vw,12px)]" />
          <span className="text-[clamp(10px,0.9vw,11px)] font-bold uppercase tracking-wider text-[var(--vz-text-secondary)]/40 truncate">Chats</span>
          <span className="text-[clamp(9px,0.8vw,10px)] font-mono text-[var(--vz-text-secondary)]/20 shrink-0">({chats.length})</span>
        </div>
      </div>

      {/* Search — fluid */}
      <div className="px-[clamp(6px,0.8vw,8px)] pb-2 shrink-0">
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--vz-text-secondary)]/25 w-[clamp(11px,1vw,12px)] h-[clamp(11px,1vw,12px)]" />
          <input
            type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chats…"
            className="w-full bg-[var(--vz-bg-secondary)] border border-[var(--vz-border-color)]/15 rounded-xl pl-8 pr-2 py-[clamp(6px,0.8vw,8px)] text-[clamp(11px,1vw,12px)] font-mono text-[var(--vz-text-secondary)] placeholder:text-[var(--vz-text-secondary)]/25 outline-none focus:border-[var(--vz-accent-vibrant)]/25 transition-all"
          />
        </div>
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-1.5 space-y-1">
        {filtered.length === 0 && (
          <p className="text-center text-xs text-[var(--vz-text-secondary)]/30 py-6 font-mono">
            {searchQuery ? 'No matches' : 'No chats yet'}
          </p>
        )}
        {filtered.map((chat, i) => {
          const active = chat.id === activeChatId;
          const prefersReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          return (
            <motion.div
              key={chat.id}
              initial={prefersReduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={prefersReduced ? { duration: 0 } : { delay: Math.min(i * 0.015, 0.15), duration: 0.2 }}
              onClick={() => switchChat(chat.id)}
              className={`group flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-colors will-change-transform ${active
                  ? 'glass border border-[var(--vz-accent-vibrant)]/15 sidebar-active'
                  : 'hover:bg-white/[0.02] border border-transparent'
              }`}
            >
              <div className={`w-[clamp(18px,2vw,20px)] h-[clamp(18px,2vw,20px)] rounded-md flex items-center justify-center shrink-0 ${
                active ? 'bg-[var(--vz-accent-vibrant)]/12' : 'bg-white/[0.02]'
              }`}>
                <MessageSquare size={9} className={`${active ? 'text-[var(--vz-accent-vibrant)]/70' : 'text-[var(--vz-text-secondary)]/15'} w-[clamp(9px,1vw,10px)] h-[clamp(9px,1vw,10px)]`} />
              </div>
              <div className="flex-1 min-w-0">
                {editingId === chat.id ? (
                  <div className="flex items-center gap-1">
                    <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                      className="flex-1 bg-[var(--vz-bg-primary)] border border-[var(--vz-accent-vibrant)]/25 rounded px-2 py-1 text-[clamp(11px,1vw,12px)] font-mono text-[var(--vz-text-secondary)] outline-none"
                      autoFocus onKeyDown={(e) => { if (e.key === 'Enter') handleRename(chat.id); if (e.key === 'Escape') setEditingId(null); }} />
                    <button onClick={() => handleRename(chat.id)} className="text-green-400 cursor-pointer"><Check size={12} className="w-[clamp(11px,1vw,12px)] h-[clamp(11px,1vw,12px)]" /></button>
                    <button onClick={() => setEditingId(null)} className="text-red-400 cursor-pointer"><X size={12} className="w-[clamp(11px,1vw,12px)] h-[clamp(11px,1vw,12px)]" /></button>
                  </div>
                ) : (
                  <>
                    <div className={`text-[clamp(11px,1vw,12px)] font-mono truncate ${active ? 'text-[var(--vz-accent-vibrant)]/90' : 'text-[var(--vz-text-secondary)]/60'}`}>
                      {chat.title}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-[clamp(10px,0.9vw,11px)] text-[var(--vz-text-secondary)]/25 font-mono">{chat.messages.length} msgs</span>
                      <span className="text-[clamp(10px,0.9vw,11px)] text-[var(--vz-text-secondary)]/20 font-mono flex items-center gap-1">
                        <Clock size={10} className="w-[clamp(9px,0.9vw,10px)] h-[clamp(9px,0.9vw,10px)]" /> {formatTime(chat.updatedAt)}
                      </span>
                    </div>
                  </>
                )}
              </div>
              {!editingId && (
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button onClick={(e) => { e.stopPropagation(); setEditingId(chat.id); setEditTitle(chat.title); }}
                    className="p-0.5 text-[var(--vz-text-secondary)]/12 hover:text-[var(--vz-accent-vibrant)] cursor-pointer"><Edit3 size={8} /></button>
                  <button onClick={(e) => handleDelete(e, chat.id)}
                    className="p-0.5 text-[var(--vz-text-secondary)]/12 hover:text-red-400 cursor-pointer"><Trash2 size={8} /></button>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
