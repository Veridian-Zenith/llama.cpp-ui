import { motion } from 'framer-motion';
import {
  Terminal, Brain, Search, Globe, Code,
  Sparkles,
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
  const { terminalOpen, setTerminalOpen } = useStore();

  return (
    <div className="shrink-0 px-2 sm:px-3 pb-[clamp(8px,1.5vw,12px)] relative z-30">
      {/* Pill footer — fluid */}
      <div className="navbar-custom backdrop-blur-md rounded-full px-2 sm:px-5 py-2 flex items-center gap-1.5 sm:gap-2.5 relative overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.4)] w-full max-w-[min(640px,92vw)] mx-auto will-change-transform">
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--vz-accent-vibrant)]/0 via-[var(--vz-accent-vibrant)]/[0.015] to-[var(--vz-accent-vibrant)]/0 pointer-events-none rounded-full" />

        <div className="flex items-center gap-1.5 sm:gap-2.5 relative z-10 flex-1 min-w-0">

          {/* Quick actions — scrollable on narrow, wrap on wide */}
          <div className="flex-1 flex items-center gap-1 sm:gap-1.5 overflow-x-auto scrollbar-hide min-w-0">
            {QUICK_ACTIONS.map((a) => {
              const Icon = a.icon;
              return (
                <motion.button
                  key={a.label}
                  whileTap={{ scale: 0.96 }}
                  className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-2xl ${a.bg} border ${a.border} text-[clamp(8px,0.9vw,9px)] font-black transition-colors cursor-pointer whitespace-nowrap shrink-0 ${a.color} hover:brightness-110`}
                >
                  <Icon size={10} className="w-[clamp(10px,1vw,12px)] h-[clamp(10px,1vw,12px)]" />
                  {a.label}
                </motion.button>
              );
            })}
          </div>

          <div className="hidden sm:block w-px h-5 bg-gradient-to-b from-transparent via-[var(--vz-border-color)]/12 to-transparent shrink-0" />

          {/* Right actions — fluid */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => setTerminalOpen(!terminalOpen)}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-2xl text-[clamp(8px,0.9vw,9px)] font-black transition-colors cursor-pointer border shrink-0 ${
                terminalOpen
                  ? 'bg-green-500/10 border-green-500/25 text-green-400'
                  : 'bg-white/[0.03] border-white/[0.05] text-[var(--vz-text-secondary)]/30 hover:text-green-400/60 hover:border-green-500/15'
              }`}
            >
              <Terminal size={10} className="w-[clamp(10px,1vw,12px)] h-[clamp(10px,1vw,12px)]" />
              <span className="hidden xs:inline">Terminal</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={onOpenSettings}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-2xl bg-white/[0.03] border border-white/[0.05] text-[clamp(8px,0.9vw,9px)] font-black text-[var(--vz-text-secondary)]/30 hover:text-[var(--vz-accent-vibrant)]/70 hover:border-[var(--vz-accent-vibrant)]/15 transition-colors cursor-pointer shrink-0"
            >
              <Sparkles size={10} className="w-[clamp(10px,1vw,12px)] h-[clamp(10px,1vw,12px)]" />
              <span className="hidden xs:inline">Config</span>
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
