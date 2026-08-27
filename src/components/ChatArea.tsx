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
      {/* Messages — fluid padding */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-[clamp(12px,3vw,32px)] py-[clamp(16px,2vw,24px)]">
        {/* Disconnected empty state */}
        {!hasMessages && !isConnected && (
          <div className="h-full flex flex-col items-center justify-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="w-full max-w-[min(672px,92vw)] space-y-[clamp(16px,2.5vw,32px)]"
            >
              {/* Hero — fluid */}
              <div className="text-center space-y-[clamp(12px,1.5vw,16px)]">
                <div className="relative mx-auto w-[clamp(64px,12vw,96px)] h-[clamp(64px,12vw,96px)] logo-custom">
                  <div className="w-full h-full rounded-3xl bg-gradient-to-br from-[var(--vz-accent-vibrant)]/15 to-[var(--vz-accent-vibrant)]/5 border border-[var(--vz-accent-vibrant)]/20 flex items-center justify-center shadow-glow-themeable">
                    <Sparkles size={36} className="text-[var(--vz-accent-vibrant)]/60 w-[clamp(28px,5vw,36px)] h-[clamp(28px,5vw,36px)]" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-[clamp(12px,1.8vw,16px)] h-[clamp(12px,1.8vw,16px)] rounded-full bg-[var(--vz-accent-vibrant)] border-2 border-[var(--vz-bg-primary)] animate-pulse shadow-glow-themeable" />
                </div>
                <h1 className="text-[clamp(22px,4vw,36px)] font-black gradient-themeable filter brightness-110 tracking-tighter">llama.cpp</h1>
                <p className="text-[clamp(9px,1vw,11px)] uppercase tracking-[0.2em] font-bold text-primary-themeable">Agentic Interface</p>
                <p className="text-[clamp(12px,1.4vw,14px)] text-[var(--vz-text-secondary)]/50 max-w-md mx-auto leading-relaxed px-2">
                  An AI assistant with tools, memory, and web access.
                  Start your llama-server to begin.
                </p>
              </div>

              {/* Server command card — fluid */}
              <div className="bg-[var(--vz-card-bg)] rounded-3xl border border-[var(--vz-card-border)] p-[clamp(12px,2vw,20px)] backdrop-blur-sm shadow-[0_0_15px_var(--vz-shadow-color)]">
                <div className="text-[clamp(9px,1vw,10px)] font-mono text-primary-themeable/60 uppercase tracking-[0.2em] mb-3">Quick Start</div>
                <div className="bg-[var(--vz-bg-primary)] rounded-xl p-3 font-mono text-[clamp(10px,1.1vw,11px)] text-green-400/70 border border-green-500/10 break-all">
                  <span className="text-green-400/40">$</span> llama-server --model ~/model.gguf -ngl 10 -c 76800 -fa on --host 0.0.0.0 --port 8080
                </div>
                <p className="text-[clamp(10px,1vw,11px)] text-[var(--vz-text-secondary)]/35 mt-2 font-mono">Then open Settings and click Connect</p>
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
              className="w-full max-w-[min(768px,96vw)] space-y-[clamp(16px,2vw,24px)]"
            >
              {/* Welcome header — fluid */}
              <div className="text-center space-y-2 px-2">
                <h1 className="text-[clamp(20px,3.5vw,30px)] font-black gradient-themeable filter brightness-110 tracking-tighter">What can I help with?</h1>
                <p className="text-[clamp(12px,1.4vw,14px)] text-secondary-themeable/70">
                  {profile.name ? `Hey ${profile.name}, ` : ''}I have access to tools, memory, and the web.
                </p>
              </div>

              {/* Suggestion cards — fluid grid */}
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-[clamp(8px,1.5vw,12px)]">
                {SUGGESTIONS.map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <motion.div
                      key={s.label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + i * 0.05 }}
                      whileHover={{ y: -2, scale: 1.01 }}
                      onMouseEnter={() => setHoveredSuggestion(i)}
                      onMouseLeave={() => setHoveredSuggestion(null)}
                      className="group relative overflow-hidden bg-[var(--vz-card-bg)] rounded-3xl border border-[var(--vz-card-border)] p-[clamp(12px,1.5vw,16px)] cursor-pointer backdrop-blur-sm shadow-[0_0_15px_var(--vz-shadow-color)] hover:shadow-[0_0_35px_var(--vz-shadow-color)] transition-all will-change-transform"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--vz-accent-vibrant)]/0 to-transparent -translate-x-full group-hover:via-[var(--vz-accent-vibrant)]/10 group-hover:animate-shimmer pointer-events-none" />
                      <div className={`w-[clamp(36px,4vw,40px)] h-[clamp(36px,4vw,40px)] rounded-xl ${s.bg} flex items-center justify-center mb-3 relative`}>
                        <Icon size={18} className={`${s.color} w-[clamp(16px,1.8vw,18px)] h-[clamp(16px,1.8vw,18px)]`} />
                      </div>
                      <div className="text-[clamp(12px,1.3vw,13px)] font-bold text-[var(--vz-text-secondary)]/80 mb-0.5 relative">{s.label}</div>
                      <div className="text-[clamp(10px,1.1vw,11px)] text-[var(--vz-text-secondary)]/35 leading-relaxed relative">{s.desc}</div>
                      {hoveredSuggestion === i && s.prompt && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                          className="mt-2 pt-2 border-t border-[var(--vz-border-color)]/30 relative">
                          <span className="text-[10px] font-mono text-primary-themeable/50 flex items-center gap-1">
                            Type: "{s.prompt}..." <ArrowRight size={10} />
                          </span>
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* Bottom info cards — stack on narrow */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-[clamp(8px,1.5vw,12px)]">
                <div className="bg-[var(--vz-card-bg)] rounded-3xl border border-[var(--vz-card-border)] p-3 backdrop-blur-sm shadow-[0_0_15px_var(--vz-shadow-color)]">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Cpu size={12} className="text-primary-themeable/60" />
                    <span className="text-[11px] font-bold text-[var(--vz-text-secondary)]/60">Server</span>
                  </div>
                  <div className="space-y-1">
                    {serverCapabilities?.supportsMiRoC && (
                      <div className="flex items-center gap-1">
                        <Database size={10} className="text-primary-themeable/40" />
                        <span className="text-[11px] font-mono text-[var(--vz-text-secondary)]/40">MiRoC</span>
                      </div>
                    )}
                    {serverCapabilities?.supportsNativeTools && (
                      <div className="flex items-center gap-1">
                        <Zap size={10} className="text-green-400/50" />
                        <span className="text-[11px] font-mono text-[var(--vz-text-secondary)]/40">Native tools</span>
                      </div>
                    )}
                    <div className="text-[11px] font-mono text-[var(--vz-text-secondary)]/30">Ctx: {serverCapabilities?.contextSize?.toLocaleString() || '—'}</div>
                  </div>
                </div>

                <div className="bg-[var(--vz-card-bg)] rounded-3xl border border-[var(--vz-card-border)] p-3 backdrop-blur-sm shadow-[0_0_15px_var(--vz-shadow-color)]">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Brain size={12} className="text-purple-400/60" />
                    <span className="text-[11px] font-bold text-[var(--vz-text-secondary)]/60">Memory</span>
                  </div>
                  {memories.length > 0 ? (
                    <div className="space-y-1">
                      <span className="text-[11px] font-mono text-[var(--vz-text-secondary)]/40">{memories.length} stored</span>
                      <div className="flex flex-wrap gap-1">
                        {memories.slice(0, 3).map((m) => (
                          <span key={m.id} className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-[var(--vz-text-secondary)]/30">{m.key}</span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <span className="text-[11px] font-mono text-[var(--vz-text-secondary)]/30">Tell me something to remember</span>
                  )}
                </div>

                <div className="bg-[var(--vz-card-bg)] rounded-3xl border border-[var(--vz-card-border)] p-3 backdrop-blur-sm shadow-[0_0_15px_var(--vz-shadow-color)]">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Clock size={12} className="text-blue-400/60" />
                    <span className="text-[11px] font-bold text-[var(--vz-text-secondary)]/60">Session</span>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[11px] font-mono text-[var(--vz-text-secondary)]/40">
                      {messages.filter((m) => m.role !== 'system').length} messages
                    </div>
                    {streamingStats.totalTokens > 0 && (
                      <div className="text-[11px] font-mono text-[var(--vz-text-secondary)]/30">
                        {streamingStats.totalTokens.toLocaleString()} tokens
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Messages — fluid */}
        {hasMessages && (
          <div className="max-w-[min(896px,96vw)] mx-auto space-y-[clamp(12px,1.5vw,16px)]">
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
          <div className="max-w-[min(896px,96vw)] mx-auto">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-[var(--vz-accent-muted)]/40 text-[clamp(12px,1.2vw,14px)] font-mono py-2">
              <Loader2 size={14} className="animate-spin w-[clamp(12px,1.2vw,14px)] h-[clamp(12px,1.2vw,14px)]" />
              <span>Generating...</span>
            </motion.div>
          </div>
        )}

        {error && (
          <div className="max-w-[min(896px,96vw)] mx-auto">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border border-red-500/20 rounded-xl p-[clamp(10px,1.2vw,12px)] text-red-400 text-[clamp(11px,1.2vw,13px)] font-mono mt-4 break-words">
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
