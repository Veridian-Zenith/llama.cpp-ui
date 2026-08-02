import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, Trash2, Edit3, Check, X,
  Lightbulb, User, Briefcase, StickyNote, Wrench, Layers,
} from 'lucide-react';
import { memoryStore, type Memory, type MemoryCategory } from '../lib/memory';

const CATEGORY_CONFIG: Record<MemoryCategory, {
  icon: React.ComponentType<{ size: number; className?: string }>;
  color: string;
  label: string;
}> = {
  fact: { icon: Lightbulb, color: 'text-blue-400', label: 'Fact' },
  preference: { icon: Heart, color: 'text-pink-400', label: 'Preference' },
  person: { icon: User, color: 'text-green-400', label: 'Person' },
  project: { icon: Briefcase, color: 'text-purple-400', label: 'Project' },
  note: { icon: StickyNote, color: 'text-amber-400', label: 'Note' },
  skill: { icon: Wrench, color: 'text-cyan-400', label: 'Skill' },
  context: { icon: Layers, color: 'text-orange-400', label: 'Context' },
};

function Heart({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}

export function MemoryManager() {
  const [memories, setMemories] = useState<Memory[]>(() => memoryStore.getAll());
  const [searchQuery, setSearchQuery] = useState('');
  const [addingNew, setAddingNew] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newCategory, setNewCategory] = useState<MemoryCategory>('note');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const refresh = () => setMemories(memoryStore.getAll());

  const filtered = useMemo(() => {
    if (!searchQuery) return memories;
    return memoryStore.search(searchQuery).map((r) => r.memory);
  }, [memories, searchQuery]);

  const handleAdd = () => {
    if (!newKey.trim() || !newValue.trim()) return;
    memoryStore.store(newKey.trim(), newValue.trim(), { category: newCategory, source: 'user' });
    setNewKey(''); setNewValue(''); setAddingNew(false);
    refresh();
  };

  const handleDelete = (id: string) => {
    memoryStore.delete(id);
    refresh();
  };

  const handleEdit = (id: string) => {
    const mem = memories.find((m) => m.id === id);
    if (!mem) return;
    setEditingId(id);
    setEditValue(mem.value);
  };

  const handleSaveEdit = (id: string) => {
    memoryStore.update(id, { value: editValue });
    setEditingId(null);
    refresh();
  };

  return (
    <div className="space-y-2">
      {/* Search */}
      <div className="relative">
        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--vz-text-secondary)]/30" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search memories..."
          className="w-full bg-[var(--vz-bg-secondary)] border border-[var(--vz-border-color)]/50 rounded-lg pl-8 pr-3 py-1.5 text-[11px] font-mono text-[var(--vz-text-secondary)] placeholder:text-[var(--vz-accent-muted)]/20 outline-none focus:border-[var(--vz-accent-vibrant)]/40 transition-colors"
        />
      </div>

      {/* Add button */}
      {!addingNew && (
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => setAddingNew(true)}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-dashed border-[var(--vz-border-color)]/50 text-[10px] font-bold text-[var(--vz-text-secondary)]/40 hover:text-[var(--vz-accent-vibrant)] hover:border-[var(--vz-accent-vibrant)]/30 transition-colors cursor-pointer"
        >
          <Plus size={11} /> Add Memory
        </motion.button>
      )}

      {/* Add form */}
      <AnimatePresence>
        {addingNew && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-2 p-2 rounded-lg bg-[var(--vz-bg-secondary)]/50 border border-[var(--vz-border-color)]/30">
              <input
                type="text" value={newKey} onChange={(e) => setNewKey(e.target.value)}
                placeholder="Key (e.g. user_name)"
                className="w-full bg-[var(--vz-bg-primary)] border border-[var(--vz-border-color)]/30 rounded px-2 py-1.5 text-[10px] font-mono text-[var(--vz-text-secondary)] outline-none focus:border-[var(--vz-accent-vibrant)]/40"
              />
              <textarea
                value={newValue} onChange={(e) => setNewValue(e.target.value)}
                placeholder="Value..."
                rows={2}
                className="w-full bg-[var(--vz-bg-primary)] border border-[var(--vz-border-color)]/30 rounded px-2 py-1.5 text-[10px] font-mono text-[var(--vz-text-secondary)] outline-none focus:border-[var(--vz-accent-vibrant)]/40 resize-none"
              />
              <div className="flex items-center gap-1">
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as MemoryCategory)}
                  className="flex-1 bg-[var(--vz-bg-primary)] border border-[var(--vz-border-color)]/30 rounded px-2 py-1 text-[10px] font-mono text-[var(--vz-text-secondary)] outline-none"
                >
                  {Object.entries(CATEGORY_CONFIG).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
                <motion.button whileTap={{ scale: 0.95 }} onClick={handleAdd}
                  className="px-2 py-1 rounded bg-[var(--vz-accent-vibrant)]/15 text-[var(--vz-accent-vibrant)] text-[10px] font-bold cursor-pointer">
                  <Check size={11} />
                </motion.button>
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => setAddingNew(false)}
                  className="px-2 py-1 rounded bg-red-500/10 text-red-400 text-[10px] font-bold cursor-pointer">
                  <X size={11} />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Memory list */}
      <div className="space-y-1 max-h-[300px] overflow-y-auto scrollbar-hide">
        {filtered.length === 0 && (
          <p className="text-center text-[10px] text-[var(--vz-text-secondary)]/20 py-4 font-mono">
            {searchQuery ? 'No matching memories' : 'No memories stored yet'}
          </p>
        )}
        {filtered.map((mem) => {
          const cfg = CATEGORY_CONFIG[mem.category] || CATEGORY_CONFIG.note;
          const Icon = cfg.icon;
          return (
            <motion.div
              key={mem.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="group flex items-start gap-2 p-2 rounded-lg bg-[var(--vz-bg-secondary)]/30 border border-[var(--vz-border-color)]/20 hover:border-[var(--vz-accent-vibrant)]/20 transition-colors"
            >
              <Icon size={11} className={`${cfg.color} shrink-0 mt-0.5`} />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-mono font-bold text-[var(--vz-accent-vibrant)]/60 truncate">{mem.key}</div>
                {editingId === mem.id ? (
                  <div className="flex items-center gap-1 mt-1">
                    <input
                      type="text" value={editValue} onChange={(e) => setEditValue(e.target.value)}
                      className="flex-1 bg-[var(--vz-bg-primary)] border border-[var(--vz-accent-vibrant)]/30 rounded px-1.5 py-0.5 text-[10px] font-mono text-[var(--vz-text-secondary)] outline-none"
                      autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(mem.id)}
                    />
                    <button onClick={() => handleSaveEdit(mem.id)} className="text-green-400 cursor-pointer"><Check size={10} /></button>
                    <button onClick={() => setEditingId(null)} className="text-red-400 cursor-pointer"><X size={10} /></button>
                  </div>
                ) : (
                  <div className="text-[10px] text-[var(--vz-text-secondary)]/40 truncate">{mem.value}</div>
                )}
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button onClick={() => handleEdit(mem.id)} className="text-[var(--vz-text-secondary)]/30 hover:text-[var(--vz-accent-vibrant)] cursor-pointer"><Edit3 size={10} /></button>
                <button onClick={() => handleDelete(mem.id)} className="text-[var(--vz-text-secondary)]/30 hover:text-red-400 cursor-pointer"><Trash2 size={10} /></button>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="text-[9px] text-center text-[var(--vz-text-secondary)]/15 font-mono">
        {memories.length} memories stored
      </div>
    </div>
  );
}
