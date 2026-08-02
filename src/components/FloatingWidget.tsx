import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, ChevronUp, Gauge, Zap, Clock, Database,
  Brain, Activity, Sparkles,
} from 'lucide-react';
import { useStore } from '../lib/store';
import { memoryStore } from '../lib/memory';

export function FloatingWidget() {
  const [collapsed, setCollapsed] = useState(true);
  const { streamingStats, isStreaming, isConnected, serverCapabilities } = useStore();
  const memories = memoryStore.getAll();

  if (!isConnected) return null;

  const ctxPct = serverCapabilities?.contextSize
    ? Math.round((streamingStats.promptTokens / serverCapabilities.contextSize) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="px-4 pb-1 pt-0.5"
    >
      <div className="glass rounded-2xl border border-[var(--vz-border-color)]/15 shadow-xl shadow-black/40 overflow-hidden max-w-4xl mx-auto">
        {/* Collapsed header — compact bar */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center gap-3 px-4 py-2 hover:bg-white/[0.02] transition-all cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <div className="relative">
              <Gauge size={11} className="text-[var(--vz-accent-vibrant)]/60" />
              {isStreaming && (
                <motion.div
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-green-400"
                />
              )}
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest text-[var(--vz-text-secondary)]/30">Live</span>
          </div>

          {/* Inline stats when collapsed */}
          <div className="flex items-center gap-3 flex-1">
            {isStreaming && streamingStats.generationTokensPerSecond > 0 && (
              <span className="text-[10px] font-mono font-bold text-green-400/70">
                {streamingStats.generationTokensPerSecond.toFixed(1)} tok/s
              </span>
            )}
            {streamingStats.totalTokens > 0 && (
              <span className="text-[9px] font-mono text-[var(--vz-text-secondary)]/30">
                {streamingStats.totalTokens.toLocaleString()} tok
              </span>
            )}
            {streamingStats.generationMs > 0 && (
              <span className="text-[9px] font-mono text-[var(--vz-text-secondary)]/25">
                {(streamingStats.generationMs / 1000).toFixed(1)}s
              </span>
            )}
            {serverCapabilities?.contextSize && (
              <div className="flex items-center gap-1.5">
                <div className="w-16 h-1 bg-[var(--vz-bg-tertiary)] rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-[var(--vz-accent-vibrant)]" style={{ width: `${ctxPct}%`, boxShadow: '0 0 6px rgba(255,45,45,0.4)' }} />
                </div>
                <span className="text-[8px] font-mono text-[var(--vz-text-secondary)]/20">{ctxPct}%</span>
              </div>
            )}
            {memories.length > 0 && (
              <span className="text-[8px] font-mono text-purple-400/30 flex items-center gap-0.5">
                <Brain size={7} /> {memories.length}
              </span>
            )}
          </div>

          <motion.div animate={{ rotate: collapsed ? 0 : 180 }} transition={{ duration: 0.2 }}>
            <ChevronUp size={11} className="text-[var(--vz-text-secondary)]/20" />
          </motion.div>
        </button>

        {/* Expanded detail */}
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-3 pt-1 border-t border-white/[0.03]">
                <div className="grid grid-cols-4 gap-2">
                  <div className="rounded-xl bg-white/[0.02] p-2.5 border border-white/[0.03]">
                    <div className="flex items-center gap-1 mb-1">
                      <Zap size={8} className="text-green-400/50" />
                      <span className="text-[7px] font-mono text-[var(--vz-text-secondary)]/25 uppercase tracking-wider">Speed</span>
                    </div>
                    <span className="text-[13px] font-mono font-black text-green-400/80">
                      {isStreaming && streamingStats.generationTokensPerSecond > 0
                        ? streamingStats.generationTokensPerSecond.toFixed(1) : '—'}
                    </span>
                    <span className="text-[7px] font-mono text-green-400/30 ml-0.5">tok/s</span>
                  </div>
                  <div className="rounded-xl bg-white/[0.02] p-2.5 border border-white/[0.03]">
                    <div className="flex items-center gap-1 mb-1">
                      <Activity size={8} className="text-[var(--vz-accent-vibrant)]/40" />
                      <span className="text-[7px] font-mono text-[var(--vz-text-secondary)]/25 uppercase tracking-wider">Tokens</span>
                    </div>
                    <span className="text-[13px] font-mono font-black text-[var(--vz-text-secondary)]/60">
                      {streamingStats.totalTokens > 0 ? streamingStats.totalTokens.toLocaleString() : '—'}
                    </span>
                  </div>
                  <div className="rounded-xl bg-white/[0.02] p-2.5 border border-white/[0.03]">
                    <div className="flex items-center gap-1 mb-1">
                      <Clock size={8} className="text-blue-400/40" />
                      <span className="text-[7px] font-mono text-[var(--vz-text-secondary)]/25 uppercase tracking-wider">Time</span>
                    </div>
                    <span className="text-[13px] font-mono font-black text-[var(--vz-text-secondary)]/60">
                      {streamingStats.generationMs > 0 ? `${(streamingStats.generationMs / 1000).toFixed(1)}s` : '—'}
                    </span>
                  </div>
                  <div className="rounded-xl bg-white/[0.02] p-2.5 border border-white/[0.03]">
                    <div className="flex items-center gap-1 mb-1">
                      <Database size={8} className="text-[var(--vz-accent-vibrant)]/40" />
                      <span className="text-[7px] font-mono text-[var(--vz-text-secondary)]/25 uppercase tracking-wider">Cache</span>
                    </div>
                    <span className="text-[13px] font-mono font-black text-[var(--vz-accent-vibrant)]/60">
                      {streamingStats.cacheTokens > 0 ? streamingStats.cacheTokens : '—'}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
