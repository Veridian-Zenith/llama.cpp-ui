import { motion } from 'framer-motion';
import {
  Terminal, Brain, Search, Globe, Code,
  Bot, Sparkles,
} from 'lucide-react';
import { useStore } from '../lib/store';

interface Props {
  onOpenSettings: () => void;
}

const QUICK_ACTIONS = [
  { label: 'Search', icon: Search, color: 'text-blue-400', bg: 'bg-blue-500/8', border: 'border-blue-500/15', shadow: 'hover:shadow-[0_0_12px_rgba(96,165,250,0.15)]' },
  { label: 'Fetch', icon: Globe, color: 'text-cyan-400', bg: 'bg-cyan-500/8', border: 'border-cyan-500/15', shadow: 'hover:shadow-[0_0_12px_rgba(34,211,238,0.15)]' },
  { label: 'Terminal', icon: Terminal, color: 'text-green-400', bg: 'bg-green-500/8', border: 'border-green-500/15', shadow: 'hover:shadow-[0_0_12px_rgba(74,222,128,0.15)]' },
  { label: 'Code', icon: Code, color: 'text-amber-400', bg: 'bg-amber-500/8', border: 'border-amber-500/15', shadow: 'hover:shadow-[0_0_12px_rgba(251,191,36,0.15)]' },
  { label: 'Think', icon: Brain, color: 'text-purple-400', bg: 'bg-purple-500/8', border: 'border-purple-500/15', shadow: 'hover:shadow-[0_0_12px_rgba(192,132,252,0.15)]' },
];

export function BottomBar({ onOpenSettings }: Props) {
  const { agenticMode, terminalOpen, setTerminalOpen } = useStore();

  const modeColor: Record<string, string> = {
    chat: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    auto: 'text-green-400 bg-green-500/10 border-green-500/20',
    manual: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    plan: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  };

  return (
    <div className="shrink-0 relative z-30">
      {/* Top accent */}
      <div className="h-px bg-gradient-to-r from-transparent via-[var(--vz-accent-vibrant)]/30 to-transparent" />

      {/* Main bar */}
      <div className="bg-gradient-to-r from-[#0a0a0a] via-[#0d0d0d] to-[#0a0a0a] border-t border-[var(--vz-border-color)]/12 px-3 py-2.5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--vz-accent-vibrant)]/0 via-[var(--vz-accent-vibrant)]/[0.015] to-[var(--vz-accent-vibrant)]/0 pointer-events-none" />

        <div className="flex items-center gap-2.5 relative z-10">
          {/* Mode pill */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border ${modeColor[agenticMode] || ''}`}>
            <Bot size={10} />
            <span className="text-[9px] font-black uppercase tracking-widest">{agenticMode}</span>
          </div>

          <div className="w-px h-5 bg-gradient-to-b from-transparent via-[var(--vz-border-color)]/12 to-transparent" />

          {/* Quick actions */}
          <div className="flex-1 flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
            {QUICK_ACTIONS.map((a) => {
              const Icon = a.icon;
              return (
                <motion.button
                  key={a.label}
                  whileHover={{ scale: 1.06, y: -2 }} whileTap={{ scale: 0.94 }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl ${a.bg} border ${a.border} text-[9px] font-black transition-all cursor-pointer whitespace-nowrap ${a.color} ${a.shadow}`}
                >
                  <Icon size={10} />
                  {a.label}
                </motion.button>
              );
            })}
          </div>

          <div className="w-px h-5 bg-gradient-to-b from-transparent via-[var(--vz-border-color)]/12 to-transparent" />

          {/* Right actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <motion.button
              whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
              onClick={() => setTerminalOpen(!terminalOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-[9px] font-black transition-all cursor-pointer border ${
                terminalOpen
                  ? 'bg-green-500/10 border-green-500/25 text-green-400 shadow-[0_0_12px_rgba(74,222,128,0.1)]'
                  : 'bg-white/[0.03] border-white/[0.05] text-[var(--vz-text-secondary)]/30 hover:text-green-400/60 hover:border-green-500/15'
              }`}
            >
              <Terminal size={10} />
              Terminal
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
              onClick={onOpenSettings}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white/[0.03] border border-white/[0.05] text-[9px] font-black text-[var(--vz-text-secondary)]/30 hover:text-[var(--vz-accent-vibrant)]/70 hover:border-[var(--vz-accent-vibrant)]/15 hover:shadow-[0_0_12px_rgba(255,45,45,0.08)] transition-all cursor-pointer"
            >
              <Sparkles size={10} />
              Config
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
