import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare, Plus, Trash2, Edit3, Check, X, Clock, Search,
  Bot, Zap, Shield, Brain,
} from 'lucide-react';
import { chatStore } from '../lib/chat-store';
import { useStore } from '../lib/store';
import type { AgenticMode } from '../lib/agentic';

const MODES: { mode: AgenticMode; icon: React.ComponentType<{ size: number; className?: string }>; label: string; color: string; bg: string }[] = [
  { mode: 'chat', icon: Bot, label: 'Chat', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { mode: 'auto', icon: Zap, label: 'Auto', color: 'text-green-400', bg: 'bg-green-500/10' },
  { mode: 'manual', icon: Shield, label: 'Manual', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { mode: 'plan', icon: Brain, label: 'Plan', color: 'text-purple-400', bg: 'bg-purple-500/10' },
];

interface Props {
  onOpenSettings: () => void;
}

export function LeftPanel({ onOpenSettings: _onOpenSettings }: Props) {
  const { activeChatId, switchChat, deleteChat, renameChat, chats, createChat, agenticMode, setAgenticMode } = useStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

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
    const diffMs = Date.now() - ts;
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
      {/* Mode selector — always visible */}
      <div className="px-2.5 pt-2.5 pb-2 border-b border-[var(--vz-border-color)]/10 shrink-0">
        <div className="text-[8px] font-mono text-[var(--vz-text-secondary)]/20 uppercase tracking-wider mb-1.5 px-0.5">Mode</div>
        <div className="grid grid-cols-2 gap-1">
          {MODES.map((m) => {
            const Icon = m.icon;
            const active = agenticMode === m.mode;
            return (
              <motion.button
                key={m.mode}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => setAgenticMode(m.mode)}
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[9px] font-bold transition-all cursor-pointer ${
                  active
                    ? `${m.bg} ${m.color} border border-current/20`
                    : 'bg-white/[0.02] text-[var(--vz-text-secondary)]/25 hover:text-[var(--vz-text-secondary)]/40 border border-transparent hover:border-[var(--vz-border-color)]/15'
                }`}
              >
                <Icon size={10} />
                {m.label}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Chat list header */}
      <div className="flex items-center justify-between px-3 pt-2.5 pb-1.5 shrink-0">
        <div className="flex items-center gap-1.5">
          <MessageSquare size={10} className="text-[var(--vz-accent-vibrant)]/50" />
          <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--vz-text-secondary)]/40">Chats</span>
          <span className="text-[7px] font-mono text-[var(--vz-text-secondary)]/15">({chats.length})</span>
        </div>
        <motion.button
          whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }}
          onClick={() => createChat()}
          className="w-5 h-5 rounded-md bg-[var(--vz-accent-vibrant)]/10 flex items-center justify-center text-[var(--vz-accent-vibrant)]/70 hover:bg-[var(--vz-accent-vibrant)]/20 transition-colors cursor-pointer"
        >
          <Plus size={10} />
        </motion.button>
      </div>

      {/* Search */}
      <div className="px-2 pb-2 shrink-0">
        <div className="relative">
          <Search size={9} className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--vz-text-secondary)]/15" />
          <input
            type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="w-full bg-[var(--vz-bg-secondary)] border border-[var(--vz-border-color)]/15 rounded-lg pl-6 pr-2 py-1.5 text-[9px] font-mono text-[var(--vz-text-secondary)] placeholder:text-[var(--vz-text-secondary)]/12 outline-none focus:border-[var(--vz-accent-vibrant)]/20 transition-all"
          />
        </div>
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-1.5 space-y-0.5">
        {filtered.length === 0 && (
          <p className="text-center text-[9px] text-[var(--vz-text-secondary)]/12 py-6 font-mono">
            {searchQuery ? 'No matches' : 'No chats yet'}
          </p>
        )}
        {filtered.map((chat, i) => {
          const active = chat.id === activeChatId;
          return (
            <motion.div
              key={chat.id}
              layout
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              onClick={() => switchChat(chat.id)}
              className={`group flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-all ${
                active
                  ? 'glass border border-[var(--vz-accent-vibrant)]/15 sidebar-active'
                  : 'hover:bg-white/[0.02] border border-transparent'
              }`}
            >
              <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                active ? 'bg-[var(--vz-accent-vibrant)]/12' : 'bg-white/[0.02]'
              }`}>
                <MessageSquare size={9} className={active ? 'text-[var(--vz-accent-vibrant)]/70' : 'text-[var(--vz-text-secondary)]/15'} />
              </div>
              <div className="flex-1 min-w-0">
                {editingId === chat.id ? (
                  <div className="flex items-center gap-1">
                    <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                      className="flex-1 bg-[var(--vz-bg-primary)] border border-[var(--vz-accent-vibrant)]/25 rounded px-1 py-0.5 text-[9px] font-mono text-[var(--vz-text-secondary)] outline-none"
                      autoFocus onKeyDown={(e) => { if (e.key === 'Enter') handleRename(chat.id); if (e.key === 'Escape') setEditingId(null); }} />
                    <button onClick={() => handleRename(chat.id)} className="text-green-400 cursor-pointer"><Check size={9} /></button>
                    <button onClick={() => setEditingId(null)} className="text-red-400 cursor-pointer"><X size={9} /></button>
                  </div>
                ) : (
                  <>
                    <div className={`text-[9px] font-mono truncate ${active ? 'text-[var(--vz-accent-vibrant)]/80' : 'text-[var(--vz-text-secondary)]/40'}`}>
                      {chat.title}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[7px] text-[var(--vz-text-secondary)]/12 font-mono">{chat.messages.length}</span>
                      <span className="text-[7px] text-[var(--vz-text-secondary)]/10 font-mono flex items-center gap-0.5">
                        <Clock size={5} /> {formatTime(chat.updatedAt)}
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
