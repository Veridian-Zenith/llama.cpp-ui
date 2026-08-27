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
    <div className="shrink-0 px-2 sm:px-3 pt-3 relative z-30">
      {/* Floating pill — responsive, fluid sizing */}
      <div className="navbar-custom backdrop-blur-2xl rounded-[1.5rem] sm:rounded-full px-3 sm:px-5 py-2.5 sm:py-2 flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 relative overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.5)] hover:border-[var(--vz-accent-vibrant)]/40 transition-colors will-change-transform">
        {/* shimmer */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--vz-accent-vibrant)]/[0.02] to-transparent animate-shimmer pointer-events-none rounded-[inherit]" />

        {/* Left: hamburger + logo */}
          <div className="flex items-center gap-2 sm:gap-2.5 relative z-10 shrink-0 logo-custom">
          <motion.button
            whileHover={{ scale: 1.15, rotate: 5 }} whileTap={{ scale: 0.9 }}
            onClick={onToggleSidebar}
            className="p-2 rounded-full bg-white/[0.03] hover:bg-[var(--vz-accent-vibrant)]/10 text-[var(--vz-text-secondary)]/40 hover:text-[var(--vz-accent-vibrant)] transition-all cursor-pointer border border-transparent hover:border-[var(--vz-accent-vibrant)]/15"
          >
            <Menu size={15} />
          </motion.button>

          <div className="flex items-center gap-2">
            <motion.div
              whileHover={{ rotate: 180, scale: 1.2, filter: "brightness(1.3) drop-shadow(0 0 20px var(--vz-glow-color))" }}
              transition={{ type: "spring", stiffness: 200, damping: 12 }}
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--vz-accent-vibrant)]/25 to-[var(--vz-accent-vibrant)]/5 border border-[var(--vz-accent-vibrant)]/30 flex items-center justify-center shadow-glow-themeable cursor-pointer"
            >
              <Cpu size={15} className="text-[var(--vz-accent-vibrant)]" />
            </motion.div>
            <div className="hidden xs:block sm:block">
              <span className="text-[clamp(11px,1.2vw,13px)] font-black gradient-themeable block leading-tight tracking-tight">llama.cpp</span>
              <span className="text-[clamp(6px,0.7vw,7px)] font-mono text-[var(--vz-text-secondary)]/20 uppercase tracking-widest hidden sm:block">agentic interface</span>
            </div>
          </div>
        </div>

        <div className="hidden sm:block w-px h-7 bg-gradient-to-b from-transparent via-[var(--vz-border-color)]/20 to-transparent relative z-10 shrink-0" />

        {/* Mode switcher — scrollable on narrow */}
        <div className="flex items-center gap-1 relative z-10 shrink-0 order-last sm:order-none w-full sm:w-auto justify-center sm:justify-start overflow-x-auto scrollbar-hide -mx-1 px-1 sm:mx-0 sm:px-0 py-1 sm:py-0">
          {MODES.map((m) => {
            const Icon = m.icon;
            const active = agenticMode === m.mode;
            return (
              <motion.button
                key={m.mode}
                whileHover={{ scale: 1.08, y: -1 }} whileTap={{ scale: 0.92 }}
                onClick={() => setAgenticMode(m.mode)}
                className={`relative flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-2xl text-[clamp(9px,0.9vw,10px)] font-black uppercase tracking-widest transition-all cursor-pointer border overflow-hidden shrink-0 ${
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

        {/* Center — connection status pill — hidden on small to save space */}
        <div className="hidden md:flex flex-1 min-w-0 items-center justify-center relative z-10">
          <motion.div
            initial={false}
            animate={{}}
            transition={{ duration: 2 }}
            className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl border backdrop-blur-sm min-w-0 max-w-[min(280px,35vw)] ${
              isConnected
                ? 'bg-green-500/5 border-green-500/20 shadow-[0_0_20px_rgba(74,222,128,0.08)]'
                : 'bg-red-500/5 border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.08)]'
            }`}
          >
            <div className={`relative shrink-0 ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
              {isConnected ? <Wifi size={11} /> : <WifiOff size={11} />}
              {isConnected && (
                <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              )}
            </div>
            <span className={`text-[clamp(9px,0.9vw,10px)] font-mono font-bold truncate ${isConnected ? 'text-green-400/80' : 'text-red-400/80'}`}>
              {isConnected ? currentModel || 'Connected' : 'Offline'}
            </span>
          </motion.div>

          {isConnected && serverCapabilities?.supportsMiRoC && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[var(--vz-accent-vibrant)]/5 border border-[var(--vz-accent-vibrant)]/15 ml-2 shrink-0"
            >
              <Database size={9} className="text-[var(--vz-accent-vibrant)]/60" />
              <span className="text-[clamp(8px,0.8vw,9px)] font-mono font-bold text-[var(--vz-accent-vibrant)]/50">MiRoC</span>
              {streamingStats.cacheTokens > 0 && (
                <span className="text-[clamp(8px,0.8vw,9px)] font-mono text-[var(--vz-accent-vibrant)]/80">{streamingStats.cacheTokens}</span>
              )}
            </motion.div>
          )}
        </div>

        {/* Right — stats + actions — stats hidden on narrow */}
        <div className="flex items-center gap-1 sm:gap-2 relative z-10 shrink-0 ml-auto sm:ml-0">
          {isStreaming && streamingStats.generationTokensPerSecond > 0 && (
            <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
              className="hidden sm:flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-2xl bg-green-500/8 border border-green-500/20 shadow-[0_0_12px_rgba(74,222,128,0.1)]">
              <Gauge size={10} className="text-green-400" />
              <span className="text-[clamp(10px,1vw,11px)] font-mono font-black text-green-400">{streamingStats.generationTokensPerSecond.toFixed(1)}</span>
              <span className="text-[clamp(7px,0.8vw,8px)] font-mono text-green-400/40">tok/s</span>
            </motion.div>
          )}

          {streamingStats.totalTokens > 0 && (
            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
              <Activity size={9} className="text-[var(--vz-text-secondary)]/30" />
              <span className="text-[clamp(9px,0.9vw,10px)] font-mono font-bold text-[var(--vz-text-secondary)]/40">{streamingStats.totalTokens.toLocaleString()}</span>
            </div>
          )}

          {streamingStats.generationMs > 0 && (
            <div className="hidden xl:flex items-center gap-1 px-2 py-1.5 rounded-2xl bg-white/[0.02]">
              <Clock size={8} className="text-[var(--vz-text-secondary)]/25" />
              <span className="text-[clamp(8px,0.8vw,9px)] font-mono text-[var(--vz-text-secondary)]/30">{(streamingStats.generationMs / 1000).toFixed(1)}s</span>
            </div>
          )}

          <div className="hidden sm:block w-px h-5 bg-gradient-to-b from-transparent via-[var(--vz-border-color)]/15 to-transparent" />

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
    </div>
  );
}
