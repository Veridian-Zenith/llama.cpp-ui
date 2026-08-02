import { motion } from 'framer-motion';
import {
  Cpu,
  Wifi,
  WifiOff,
  Trash2,
  Settings,
  Bot,
  Zap,
  Shield,
  Brain,
  Square,
  Database,
  Clock,
  Gauge,
  Activity,
} from 'lucide-react';
import { useStore } from '../lib/store';
import type { AgenticMode } from '../lib/agentic';

interface Props {
  panelOpen: boolean;
  onTogglePanel: () => void;
}

const MODE_CONFIG: Record<string, {
  icon: React.ComponentType<{ size: number; className?: string }>;
  color: string;
  bg: string;
  border: string;
  label: string;
}> = {
  chat: { icon: Bot, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', label: 'Chat' },
  auto: { icon: Zap, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30', label: 'Auto' },
  manual: { icon: Shield, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', label: 'Manual' },
  plan: { icon: Brain, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30', label: 'Plan' },
};

export function Header({ panelOpen, onTogglePanel }: Props) {
  const {
    isConnected, currentModel, isStreaming, stopStreaming,
    agenticMode, setAgenticMode, pendingApproval,
    streamingStats, clearMessages, serverCapabilities,
  } = useStore();

  return (
    <header className="h-12 border-b border-[var(--vz-border-color)] bg-[var(--vz-bg-primary)]/90 backdrop-blur-xl flex items-center justify-between px-3 shrink-0 z-30">
      {/* Left section */}
      <div className="flex items-center gap-3">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[var(--vz-accent-vibrant)]/15 border border-[var(--vz-accent-vibrant)]/30 flex items-center justify-center">
            <Cpu size={14} className="text-[var(--vz-accent-vibrant)]" />
          </div>
          <span className="text-sm font-bold bg-gradient-to-r from-[var(--vz-accent-vibrant)] to-[var(--vz-accent-vibrant)]/60 bg-clip-text text-transparent hidden sm:block">
            llama.cpp
          </span>
        </div>

        {/* Divider */}
        <div className="h-5 w-px bg-[var(--vz-border-color)]/50" />

        {/* Mode switcher — inline in header */}
        <div className="flex items-center gap-1">
          {(Object.keys(MODE_CONFIG) as AgenticMode[]).map((m) => {
            const cfg = MODE_CONFIG[m];
            const Icon = cfg.icon;
            const active = agenticMode === m;
            return (
              <motion.button
                key={m}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setAgenticMode(m)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                  active
                    ? `${cfg.bg} ${cfg.border} ${cfg.color}`
                    : 'bg-transparent border-transparent text-[var(--vz-text-secondary)]/30 hover:text-[var(--vz-text-secondary)]/60'
                }`}
                title={cfg.label}
              >
                <Icon size={11} />
                <span className="hidden md:inline">{cfg.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Center section — live stats */}
      <div className="hidden lg:flex items-center gap-4 text-[10px] font-mono">
        {/* Connection */}
        <div className={`flex items-center gap-1.5 ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
          {isConnected ? <Wifi size={10} /> : <WifiOff size={10} />}
          <span className="truncate max-w-[120px]">{isConnected ? currentModel || 'Connected' : 'Offline'}</span>
        </div>

        {isConnected && (
          <>
            <div className="h-3 w-px bg-[var(--vz-border-color)]/30" />

            {/* MiRoC cache indicator */}
            {serverCapabilities?.supportsMiRoC && (
              <div className="flex items-center gap-1 text-[var(--vz-accent-vibrant)]/60">
                <Database size={9} />
                <span>MiRoC</span>
                {streamingStats.cacheTokens > 0 && (
                  <span className="text-[var(--vz-accent-vibrant)]">{streamingStats.cacheTokens}</span>
                )}
              </div>
            )}

            {/* Tokens/s */}
            {isStreaming && streamingStats.generationTokensPerSecond > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-1 text-green-400"
              >
                <Gauge size={9} />
                <span>{streamingStats.generationTokensPerSecond.toFixed(1)} tok/s</span>
              </motion.div>
            )}

            {/* Prompt tokens */}
            {streamingStats.promptTokens > 0 && (
              <div className="flex items-center gap-1 text-[var(--vz-text-secondary)]/40">
                <Activity size={9} />
                <span>{streamingStats.totalTokens.toLocaleString()} tok</span>
              </div>
            )}

            {/* Timing */}
            {streamingStats.generationMs > 0 && (
              <div className="flex items-center gap-1 text-[var(--vz-text-secondary)]/30">
                <Clock size={9} />
                <span>{(streamingStats.generationMs / 1000).toFixed(1)}s</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2">
        {/* Pending approval */}
        {pendingApproval && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[10px] font-bold animate-pulse"
          >
            AWAITING
          </motion.div>
        )}

        {/* Stop button */}
        {isStreaming && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={stopStreaming}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-[10px] font-bold uppercase tracking-wider hover:bg-red-500/30 transition-colors cursor-pointer"
          >
            <Square size={10} />
            <span className="hidden sm:inline">Stop</span>
          </motion.button>
        )}

        {/* Clear */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={clearMessages}
          className="p-1.5 rounded-lg hover:bg-[var(--vz-accent-vibrant)]/10 text-[var(--vz-text-secondary)]/40 hover:text-[var(--vz-accent-vibrant)] transition-colors cursor-pointer"
          title="Clear chat"
        >
          <Trash2 size={14} />
        </motion.button>

        {/* Settings toggle */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onTogglePanel}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            panelOpen
              ? 'bg-[var(--vz-accent-vibrant)]/15 text-[var(--vz-accent-vibrant)]'
              : 'hover:bg-[var(--vz-accent-vibrant)]/10 text-[var(--vz-text-secondary)]/40 hover:text-[var(--vz-accent-vibrant)]'
          }`}
          title="Settings"
        >
          <Settings size={14} />
        </motion.button>
      </div>
    </header>
  );
}
