import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, X, ChevronRight, Brain, Terminal,
  MessageSquare, Lightbulb, Zap, Bot,
} from 'lucide-react';
import { useStore } from '../lib/store';
import { memoryStore } from '../lib/memory';

interface Suggestion {
  id: string;
  icon: React.ComponentType<{ size: number; className?: string }>;
  title: string;
  description: string;
  action?: () => void;
  type: 'tip' | 'action' | 'memory' | 'context';
}

export function Assistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const {
    isConnected, messages, agenticMode,
    serverCapabilities,
  } = useStore();

  const generateSuggestions = useCallback(() => {
    const newSuggestions: Suggestion[] = [];
    const msgCount = messages.filter((m) => m.role !== 'system').length;
    const memories = memoryStore.getAll();

    // Contextual tips based on state
    if (!isConnected) {
      newSuggestions.push({
        id: 'connect',
        icon: Zap,
        title: 'Connect to server',
        description: 'Open Settings to connect to your llama-server instance.',
        type: 'context',
      });
    }

    if (isConnected && msgCount === 0) {
      newSuggestions.push({
        id: 'first-chat',
        icon: MessageSquare,
        title: 'Start a conversation',
        description: 'Try: "Search for the latest Rust benchmarks" or "What files are in my home directory?"',
        type: 'tip',
      });
      newSuggestions.push({
        id: 'try-tools',
        icon: Terminal,
        title: 'Try the tools',
        description: 'I can search the web, run commands, read files, remember things, analyze code, and more.',
        type: 'tip',
      });
    }

    if (isConnected && agenticMode === 'chat') {
      newSuggestions.push({
        id: 'switch-mode',
        icon: Zap,
        title: 'Try Auto mode',
        description: 'Switch to Auto mode to let me use tools autonomously.',
        type: 'action',
        action: () => useStore.getState().setAgenticMode('auto'),
      });
    }

    if (memories.length === 0 && msgCount > 2) {
      newSuggestions.push({
        id: 'store-memory',
        icon: Brain,
        title: 'I can remember things',
        description: 'Tell me facts about yourself and I\'ll remember them across conversations.',
        type: 'memory',
      });
    }

    if (serverCapabilities) {
      if (serverCapabilities.supportsMiRoC) {
        newSuggestions.push({
          id: 'miroc',
          icon: Zap,
          title: 'MiRoC caching active',
          description: 'Prompt caching is enabled for faster responses.',
          type: 'context',
        });
      }
      if (serverCapabilities.supportsNativeTools) {
        newSuggestions.push({
          id: 'native-tools',
          icon: Zap,
          title: 'Native tool calling',
          description: 'Server supports native tool routing for faster execution.',
          type: 'context',
        });
      }
    }

    if (agenticMode === 'auto' || agenticMode === 'manual') {
      newSuggestions.push({
        id: 'code-analyze',
        icon: Lightbulb,
        title: 'Code analysis',
        description: 'Paste code and ask me to analyze it — I\'ll check for errors, symbols, and formatting.',
        type: 'tip',
      });
    }

    // Filter out dismissed
    return newSuggestions.filter((s) => !dismissed.has(s.id));
  }, [isConnected, messages, agenticMode, serverCapabilities, dismissed]);

  const suggestions = useMemo(() => generateSuggestions(), [generateSuggestions]);

  const dismiss = (id: string) => {
    setDismissed((prev) => new Set(prev).add(id));
  };

  const tips = suggestions.filter((s) => s.type === 'tip');
  const actions = suggestions.filter((s) => s.type === 'action');
  const contexts = suggestions.filter((s) => s.type === 'context' || s.type === 'memory');

  return (
    <>
      {/* Floating button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-20 right-4 z-50 w-12 h-12 rounded-2xl bg-[var(--vz-accent-vibrant)]/10 border border-[var(--vz-accent-vibrant)]/25 flex items-center justify-center text-[var(--vz-accent-vibrant)] hover:bg-[var(--vz-accent-vibrant)]/20 transition-all cursor-pointer glow-red-strong"
      >
        <motion.div
          animate={isOpen ? { rotate: 0 } : { rotate: [0, 5, -5, 0] }}
          transition={{ duration: 2, repeat: isOpen ? 0 : Infinity }}
        >
          <Bot size={22} />
        </motion.div>
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-34 right-4 z-50 w-[320px] max-h-[400px] glass rounded-2xl shadow-2xl shadow-black/80 overflow-hidden animate-border-glow"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--vz-border-color)]/20">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-[var(--vz-accent-vibrant)]" />
                <span className="text-[11px] font-bold text-[var(--vz-accent-vibrant)]">Assistant</span>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-md hover:bg-white/5 text-[var(--vz-text-secondary)]/30 cursor-pointer"
              >
                <X size={13} />
              </motion.button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto scrollbar-hide max-h-[340px] p-3 space-y-3">
              {suggestions.length === 0 && (
                <div className="text-center py-6">
                  <Bot size={28} className="mx-auto mb-2 text-[var(--vz-accent-vibrant)]/30" />
                  <p className="text-[10px] text-[var(--vz-text-secondary)]/30 font-mono">
                    All caught up! I'll let you know if anything comes up.
                  </p>
                </div>
              )}

              {/* Actions */}
              {actions.length > 0 && (
                <div>
                  <div className="text-[8px] font-mono uppercase tracking-wider text-[var(--vz-accent-vibrant)]/40 mb-1.5">Quick Actions</div>
                  {actions.map((s) => (
                    <motion.div
                      key={s.id}
                      layout
                      className="flex items-center gap-2.5 p-2 rounded-xl bg-[var(--vz-accent-vibrant)]/5 border border-[var(--vz-accent-vibrant)]/15 cursor-pointer hover:bg-[var(--vz-accent-vibrant)]/10 transition-colors mb-1.5"
                      onClick={() => { s.action?.(); dismiss(s.id); }}
                    >
                      <s.icon size={14} className="text-[var(--vz-accent-vibrant)]" />
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-bold text-[var(--vz-accent-vibrant)]">{s.title}</div>
                        <div className="text-[9px] text-[var(--vz-text-secondary)]/30">{s.description}</div>
                      </div>
                      <ChevronRight size={12} className="text-[var(--vz-text-secondary)]/20" />
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Tips */}
              {tips.length > 0 && (
                <div>
                  <div className="text-[8px] font-mono uppercase tracking-wider text-[var(--vz-text-secondary)]/20 mb-1.5">Tips</div>
                  {tips.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-start gap-2.5 p-2 rounded-xl bg-white/[0.01] border border-[var(--vz-border-color)]/15 mb-1.5"
                    >
                      <s.icon size={12} className="text-[var(--vz-text-secondary)]/30 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-bold text-[var(--vz-text-secondary)]/60">{s.title}</div>
                        <div className="text-[9px] text-[var(--vz-text-secondary)]/25">{s.description}</div>
                      </div>
                      <button onClick={() => dismiss(s.id)} className="text-[var(--vz-text-secondary)]/15 hover:text-[var(--vz-text-secondary)]/40 cursor-pointer shrink-0">
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Context */}
              {contexts.length > 0 && (
                <div>
                  <div className="text-[8px] font-mono uppercase tracking-wider text-[var(--vz-text-secondary)]/20 mb-1.5">System</div>
                  {contexts.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center gap-2 p-1.5 rounded-lg mb-1"
                    >
                      <s.icon size={10} className="text-[var(--vz-text-secondary)]/20" />
                      <div className="text-[9px] text-[var(--vz-text-secondary)]/25">{s.title}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
