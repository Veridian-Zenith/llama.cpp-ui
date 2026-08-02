import { motion } from 'framer-motion';
import {
  Cpu, Wifi, WifiOff, Trash2, Square,
  Bot, Zap, Shield, Brain, Settings, Menu,
  Database, Clock, Gauge, Activity,
} from 'lucide-react';
import { useStore } from '../lib/store';
import type { AgenticMode } from '../lib/agentic';

interface Props {
  onOpenSettings: () => void;
  onToggleSidebar: () => void;
}

const MODES: { mode: AgenticMode; icon: React.ComponentType<{ size: number; className?: string }>; label: string; color: string; glow: string; bg: string }[] = [
  { mode: 'chat', icon: Bot, label: 'Chat', color: 'text-blue-400', glow: 'shadow-[0_0_15px_rgba(96,165,250,0.5)]', bg: 'bg-blue-500/10' },
  { mode: 'auto', icon: Zap, label: 'Auto', color: 'text-green-400', glow: 'shadow-[0_0_15px_rgba(74,222,128,0.5)]', bg: 'bg-green-500/10' },
  { mode: 'manual', icon: Shield, label: 'Manual', color: 'text-amber-400', glow: 'shadow-[0_0_15px_rgba(251,191,36,0.5)]', bg: 'bg-amber-500/10' },
  { mode: 'plan', icon: Brain, label: 'Plan', color: 'text-purple-400', glow: 'shadow-[0_0_15px_rgba(192,132,252,0.5)]', bg: 'bg-purple-500/10' },
];

export function TopBar({ onOpenSettings, onToggleSidebar }: Props) {
  const {
    isConnected, currentModel, isStreaming, stopStreaming,
    agenticMode, setAgenticMode, pendingApproval,
    streamingStats, clearMessages, serverCapabilities,
  } = useStore();

  return (
    <div className="shrink-0 relative z-30">
      {/* Main bar — 56px, gradient background */}
      <div className="h-14 bg-gradient-to-r from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a] border-b border-[var(--vz-border-color)]/20 flex items-center px-3 gap-2 relative overflow-hidden">
        {/* Animated shimmer overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--vz-accent-vibrant)]/[0.02] to-transparent animate-shimmer pointer-events-none" />
        {/* Top glow line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--vz-accent-vibrant)]/50 to-transparent" />

        {/* Left: hamburger + logo */}
        <div className="flex items-center gap-2.5 relative z-10 shrink-0">
          <motion.button
            whileHover={{ scale: 1.15, rotate: 5 }} whileTap={{ scale: 0.9 }}
            onClick={onToggleSidebar}
            className="p-2 rounded-xl bg-white/[0.03] hover:bg-[var(--vz-accent-vibrant)]/10 text-[var(--vz-text-secondary)]/40 hover:text-[var(--vz-accent-vibrant)] transition-all cursor-pointer border border-transparent hover:border-[var(--vz-accent-vibrant)]/15"
          >
            <Menu size={15} />
          </motion.button>

          <div className="flex items-center gap-2">
            <motion.div
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.6 }}
              className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[var(--vz-accent-vibrant)]/25 to-[var(--vz-accent-vibrant)]/5 border border-[var(--vz-accent-vibrant)]/30 flex items-center justify-center glow-red-strong cursor-pointer"
            >
              <Cpu size={15} className="text-[var(--vz-accent-vibrant)]" />
            </motion.div>
            <div>
              <span className="text-[13px] font-black gradient-text block leading-tight tracking-tight">llama.cpp</span>
              <span className="text-[7px] font-mono text-[var(--vz-text-secondary)]/20 uppercase tracking-widest">agentic interface</span>
            </div>
          </div>
        </div>

        <div className="w-px h-7 bg-gradient-to-b from-transparent via-[var(--vz-border-color)]/20 to-transparent relative z-10 shrink-0" />

        {/* Mode switcher — pill style */}
        <div className="flex items-center gap-1 relative z-10 shrink-0">
          {MODES.map((m) => {
            const Icon = m.icon;
            const active = agenticMode === m.mode;
            return (
              <motion.button
                key={m.mode}
                whileHover={{ scale: 1.08, y: -1 }} whileTap={{ scale: 0.92 }}
                onClick={() => setAgenticMode(m.mode)}
                className={`relative flex items-center gap-1.5 px-3 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer border overflow-hidden ${
                  active
                    ? `${m.color} ${m.bg} border-current/25 ${m.glow}`
                    : 'text-[var(--vz-text-secondary)]/20 border-transparent hover:text-[var(--vz-text-secondary)]/40 hover:bg-white/[0.02]'
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="mode-bg"
                    className="absolute inset-0 bg-gradient-to-r from-white/[0.03] to-white/[0.06] rounded-2xl"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon size={11} className="relative z-10" />
                <span className="relative z-10">{m.label}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Center — connection status pill */}
        <div className="flex-1 flex items-center justify-center relative z-10">
          <motion.div
            initial={false}
            animate={{ scale: [1, 1.01, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl border backdrop-blur-sm ${
              isConnected
                ? 'bg-green-500/5 border-green-500/20 shadow-[0_0_20px_rgba(74,222,128,0.08)]'
                : 'bg-red-500/5 border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.08)]'
            }`}
          >
            <div className={`relative ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
              {isConnected ? <Wifi size={11} /> : <WifiOff size={11} />}
              {isConnected && (
                <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              )}
            </div>
            <span className={`text-[10px] font-mono font-bold ${isConnected ? 'text-green-400/80' : 'text-red-400/80'}`}>
              {isConnected ? currentModel || 'Connected' : 'Offline'}
            </span>
          </motion.div>

          {isConnected && serverCapabilities?.supportsMiRoC && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[var(--vz-accent-vibrant)]/5 border border-[var(--vz-accent-vibrant)]/15 ml-2"
            >
              <Database size={9} className="text-[var(--vz-accent-vibrant)]/60" />
              <span className="text-[9px] font-mono font-bold text-[var(--vz-accent-vibrant)]/50">MiRoC</span>
              {streamingStats.cacheTokens > 0 && (
                <span className="text-[9px] font-mono text-[var(--vz-accent-vibrant)]/80">{streamingStats.cacheTokens}</span>
              )}
            </motion.div>
          )}
        </div>

        {/* Right — stats + actions */}
        <div className="flex items-center gap-2 relative z-10 shrink-0">
          {isStreaming && streamingStats.generationTokensPerSecond > 0 && (
            <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-green-500/8 border border-green-500/20 shadow-[0_0_12px_rgba(74,222,128,0.1)]">
              <Gauge size={10} className="text-green-400" />
              <span className="text-[11px] font-mono font-black text-green-400">{streamingStats.generationTokensPerSecond.toFixed(1)}</span>
              <span className="text-[8px] font-mono text-green-400/40">tok/s</span>
            </motion.div>
          )}

          {streamingStats.totalTokens > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
              <Activity size={9} className="text-[var(--vz-text-secondary)]/30" />
              <span className="text-[10px] font-mono font-bold text-[var(--vz-text-secondary)]/40">{streamingStats.totalTokens.toLocaleString()}</span>
            </div>
          )}

          {streamingStats.generationMs > 0 && (
            <div className="flex items-center gap-1 px-2 py-1.5 rounded-2xl bg-white/[0.02]">
              <Clock size={8} className="text-[var(--vz-text-secondary)]/25" />
              <span className="text-[9px] font-mono text-[var(--vz-text-secondary)]/30">{(streamingStats.generationMs / 1000).toFixed(1)}s</span>
            </div>
          )}

          <div className="w-px h-5 bg-gradient-to-b from-transparent via-[var(--vz-border-color)]/15 to-transparent" />

          {pendingApproval && (
            <motion.div initial={{ scale: 0.5 }} animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="px-3 py-1 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-400 text-[9px] font-black shadow-[0_0_12px_rgba(251,191,36,0.15)]">
              AWAITING
            </motion.div>
          )}

          {isStreaming && (
            <motion.button initial={{ scale: 0.5 }} animate={{ scale: 1 }}
              whileHover={{ scale: 1.1, boxShadow: '0 0 20px rgba(239,68,68,0.3)' }} whileTap={{ scale: 0.9 }}
              onClick={stopStreaming}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-red-500/10 border border-red-500/25 text-red-400 text-[10px] font-black cursor-pointer shadow-[0_0_10px_rgba(239,68,68,0.1)] hover:shadow-[0_0_20px_rgba(239,68,68,0.2)] transition-shadow">
              <Square size={8} fill="currentColor" /> Stop
            </motion.button>
          )}

          <motion.button whileHover={{ scale: 1.15, rotate: -10 }} whileTap={{ scale: 0.85 }}
            onClick={clearMessages}
            className="p-2 rounded-xl hover:bg-red-500/10 text-[var(--vz-text-secondary)]/25 hover:text-red-400 transition-all cursor-pointer border border-transparent hover:border-red-500/20"
            title="Clear chat">
            <Trash2 size={13} />
          </motion.button>

          <motion.button whileHover={{ scale: 1.15, rotate: 90 }} whileTap={{ scale: 0.85 }}
            onClick={onOpenSettings}
            className="p-2 rounded-xl hover:bg-[var(--vz-accent-vibrant)]/10 text-[var(--vz-text-secondary)]/25 hover:text-[var(--vz-accent-vibrant)] transition-all cursor-pointer border border-transparent hover:border-[var(--vz-accent-vibrant)]/20"
            title="Settings">
            <Settings size={13} />
          </motion.button>
        </div>
      </div>

      {/* Bottom accent line */}
      <div className="h-px bg-gradient-to-r from-transparent via-[var(--vz-accent-vibrant)]/50 to-transparent" />
    </div>
  );
}
