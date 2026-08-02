import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2, Sparkles, Search, Globe, Terminal,
  Code, Brain, Zap, Clock, Database, Cpu, ArrowRight,
} from 'lucide-react';
import { useStore } from '../lib/store';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { memoryStore } from '../lib/memory';
import { profileStore } from '../lib/profile';

interface Props {
  onOpenPanel: () => void;
}

const SUGGESTIONS = [
  { icon: Search, label: 'Search the web', desc: 'Get real-time info from DuckDuckGo', color: 'text-blue-400', bg: 'bg-blue-500/8', border: 'border-blue-500/15', prompt: 'Search the web for ' },
  { icon: Globe, label: 'Fetch a URL', desc: 'Extract content from any webpage', color: 'text-cyan-400', bg: 'bg-cyan-500/8', border: 'border-cyan-500/15', prompt: 'Fetch and summarize ' },
  { icon: Terminal, label: 'Run a command', desc: 'Execute shell commands on this machine', color: 'text-green-400', bg: 'bg-green-500/8', border: 'border-green-500/15', prompt: '' },
  { icon: Code, label: 'Analyze code', desc: 'LSP diagnostics, symbols, formatting', color: 'text-amber-400', bg: 'bg-amber-500/8', border: 'border-amber-500/15', prompt: 'Analyze this code for errors: ' },
  { icon: Brain, label: 'Remember this', desc: 'Store facts and preferences in memory', color: 'text-purple-400', bg: 'bg-purple-500/8', border: 'border-purple-500/15', prompt: '' },
  { icon: Zap, label: 'Quick task', desc: 'Let me figure out the best approach', color: 'text-red-400', bg: 'bg-red-500/8', border: 'border-red-500/15', prompt: '' },
];

export function ChatArea({ onOpenPanel: _onOpenPanel }: Props) {
  const {
    messages, isStreaming, isConnected, error,
    streamingStats, serverCapabilities,
  } = useStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [hoveredSuggestion, setHoveredSuggestion] = useState<number | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const hasMessages = messages.filter((m) => m.role !== 'system').length > 0;
  const memories = memoryStore.getAll();
  const profile = profileStore.get();

  return (
    <div className="flex-1 flex flex-col min-h-0 relative">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 md:px-8 py-6">
        {/* Disconnected empty state */}
        {!hasMessages && !isConnected && (
          <div className="h-full flex flex-col items-center justify-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="w-full max-w-2xl space-y-8"
            >
              {/* Hero */}
              <div className="text-center space-y-4">
                <div className="relative mx-auto w-24 h-24">
                  <div className="w-full h-full rounded-3xl bg-gradient-to-br from-[var(--vz-accent-vibrant)]/15 to-[var(--vz-accent-vibrant)]/5 border border-[var(--vz-accent-vibrant)]/20 flex items-center justify-center glow-red-strong animate-border-glow">
                    <Sparkles size={40} className="text-[var(--vz-accent-vibrant)]/60" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 border-2 border-[var(--vz-bg-primary)] animate-pulse" />
                </div>
                <h1 className="text-2xl font-bold gradient-text">llama.cpp Agentic UI</h1>
                <p className="text-sm text-[var(--vz-text-secondary)]/40 max-w-md mx-auto leading-relaxed">
                  An AI assistant with tools, memory, and web access.
                  Start your llama-server to begin.
                </p>
              </div>

              {/* Server command card */}
              <div className="glass rounded-2xl p-5 card-glow">
                <div className="text-[9px] font-mono text-[var(--vz-accent-vibrant)]/40 uppercase tracking-wider mb-3">Quick Start</div>
                <div className="bg-[var(--vz-bg-primary)] rounded-xl p-3 font-mono text-[11px] text-green-400/70 border border-green-500/10">
                  <span className="text-green-400/40">$</span> llama-server --model ~/model.gguf -ngl 10 -c 76800 -fa on --host 0.0.0.0 --port 8080
                </div>
                <p className="text-[9px] text-[var(--vz-text-secondary)]/25 mt-2 font-mono">Then open Settings and click Connect</p>
              </div>
            </motion.div>
          </div>
        )}

        {/* Connected empty state — rich dashboard */}
        {!hasMessages && isConnected && (
          <div className="h-full flex flex-col items-center justify-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="w-full max-w-3xl space-y-6"
            >
              {/* Welcome header */}
              <div className="text-center space-y-3">
                <h1 className="text-2xl font-bold gradient-text">What can I help with?</h1>
                <p className="text-sm text-[var(--vz-text-secondary)]/35">
                  {profile.name ? `Hey ${profile.name}, ` : ''}I have access to tools, memory, and the web.
                </p>
              </div>

              {/* Suggestion cards — 3x2 grid filling the space */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {SUGGESTIONS.map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <motion.div
                      key={s.label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + i * 0.05 }}
                      onMouseEnter={() => setHoveredSuggestion(i)}
                      onMouseLeave={() => setHoveredSuggestion(null)}
                      className={`glass rounded-2xl p-4 cursor-pointer card-glow stagger-child border ${s.border} transition-all ${
                        hoveredSuggestion === i ? 'scale-[1.02]' : ''
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                        <Icon size={18} className={s.color} />
                      </div>
                      <div className="text-[12px] font-bold text-[var(--vz-text-secondary)]/70 mb-0.5">{s.label}</div>
                      <div className="text-[9px] text-[var(--vz-text-secondary)]/25 leading-relaxed">{s.desc}</div>
                      {hoveredSuggestion === i && s.prompt && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                          className="mt-2 pt-2 border-t border-white/[0.03]">
                          <span className="text-[8px] font-mono text-[var(--vz-accent-vibrant)]/30 flex items-center gap-1">
                            Type: "{s.prompt}..." <ArrowRight size={7} />
                          </span>
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* Bottom info cards */}
              <div className="grid grid-cols-3 gap-3">
                {/* Server info */}
                <div className="glass rounded-xl p-3 card-glow">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Cpu size={10} className="text-[var(--vz-accent-vibrant)]/50" />
                    <span className="text-[9px] font-bold text-[var(--vz-text-secondary)]/40">Server</span>
                  </div>
                  <div className="space-y-1">
                    {serverCapabilities?.supportsMiRoC && (
                      <div className="flex items-center gap-1">
                        <Database size={7} className="text-[var(--vz-accent-vibrant)]/30" />
                        <span className="text-[8px] font-mono text-[var(--vz-text-secondary)]/25">MiRoC caching</span>
                      </div>
                    )}
                    {serverCapabilities?.supportsNativeTools && (
                      <div className="flex items-center gap-1">
                        <Zap size={7} className="text-green-400/30" />
                        <span className="text-[8px] font-mono text-[var(--vz-text-secondary)]/25">Native tools</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <span className="text-[8px] font-mono text-[var(--vz-text-secondary)]/20">Ctx: {serverCapabilities?.contextSize?.toLocaleString() || '—'}</span>
                    </div>
                  </div>
                </div>

                {/* Memory hint */}
                <div className="glass rounded-xl p-3 card-glow">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Brain size={10} className="text-purple-400/50" />
                    <span className="text-[9px] font-bold text-[var(--vz-text-secondary)]/40">Memory</span>
                  </div>
                  {memories.length > 0 ? (
                    <div className="space-y-1">
                      <span className="text-[8px] font-mono text-[var(--vz-text-secondary)]/25">{memories.length} stored</span>
                      <div className="flex flex-wrap gap-0.5">
                        {memories.slice(0, 3).map((m) => (
                          <span key={m.id} className="text-[7px] font-mono px-1 py-0.5 rounded bg-white/[0.03] text-[var(--vz-text-secondary)]/20">{m.key}</span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <span className="text-[8px] font-mono text-[var(--vz-text-secondary)]/20">Tell me something to remember</span>
                  )}
                </div>

                {/* Quick stats */}
                <div className="glass rounded-xl p-3 card-glow">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Clock size={10} className="text-blue-400/50" />
                    <span className="text-[9px] font-bold text-[var(--vz-text-secondary)]/40">Session</span>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[8px] font-mono text-[var(--vz-text-secondary)]/25">
                      {messages.filter((m) => m.role !== 'system').length} messages
                    </div>
                    {streamingStats.totalTokens > 0 && (
                      <div className="text-[8px] font-mono text-[var(--vz-text-secondary)]/20">
                        {streamingStats.totalTokens.toLocaleString()} tokens used
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Messages */}
        {hasMessages && (
          <div className="max-w-4xl mx-auto space-y-4">
            <AnimatePresence initial={false}>
              {messages
                .filter((m) => m.role !== 'system')
                .map((msg, i) => (
                  <ChatMessage key={msg.id} message={msg} index={i} />
                ))}
            </AnimatePresence>
          </div>
        )}

        {isStreaming && (
          <div className="max-w-4xl mx-auto">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-[var(--vz-accent-muted)]/40 text-sm font-mono py-2">
              <Loader2 size={14} className="animate-spin" />
              <span>Generating...</span>
            </motion.div>
          </div>
        )}

        {error && (
          <div className="max-w-4xl mx-auto">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm font-mono mt-4">
              {error}
            </motion.div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <ChatInput />
    </div>
  );
}
