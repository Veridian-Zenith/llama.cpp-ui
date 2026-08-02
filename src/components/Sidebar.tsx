import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Wifi, WifiOff, ChevronDown,
  Thermometer, Gauge, Cpu, Shield, Zap, Sliders, Terminal,
  Globe, Search, Brain, Lock, Unlock, AlertTriangle,
  BarChart3, Cloud, Hash, User, MessageSquare, Sparkles,
} from 'lucide-react';
import { useStore } from '../lib/store';
import { PERSONALITIES } from '../lib/personality';
import { StatsPanel } from './StatsPanel';
import { WeatherWidget } from './WeatherWidget';
import { MemoryManager } from './MemoryManager';
import { ChatHistory } from './ChatHistory';
import { ProfileSettings } from './ProfileSettings';

function Section({
  title, icon: Icon, children, defaultOpen = false, badge,
}: {
  title: string;
  icon: React.ComponentType<{ size: number; className?: string }>;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-[var(--vz-border-color)]/30 last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-[var(--vz-text-secondary)] hover:text-[var(--vz-accent-vibrant)] transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Icon size={13} className="text-[var(--vz-accent-vibrant)]/60" />
          <span className="text-[11px] font-bold uppercase tracking-wider">{title}</span>
          {badge && (
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-[var(--vz-accent-vibrant)]/10 text-[var(--vz-accent-vibrant)]/70">
              {badge}
            </span>
          )}
        </div>
        <motion.div animate={{ rotate: open ? 0 : -90 }} transition={{ duration: 0.15 }}>
          <ChevronDown size={13} className="text-[var(--vz-text-secondary)]/30" />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SliderField({
  label, value, onChange, min, max, step, icon: Icon,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  icon: React.ComponentType<{ size: number; className?: string }>;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Icon size={11} className="text-[var(--vz-accent-vibrant)]/50" />
          <span className="text-[10px] font-mono text-[var(--vz-text-secondary)]/60 uppercase tracking-wider">{label}</span>
        </div>
        <span className="text-[10px] font-mono text-[var(--vz-accent-vibrant)]">{value}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1 rounded-full appearance-none cursor-pointer bg-[var(--vz-bg-secondary)] border border-[var(--vz-border-color)]/50 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--vz-accent-vibrant)] [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[var(--vz-bg-primary)]"
      />
    </div>
  );
}

interface Props {
  onClose: () => void;
}

export function Sidebar({ onClose }: Props) {
  const {
    settings, updateSettings, connect, isConnected, currentModel,
    sandbox, updateSandbox,
    terminalOpen, setTerminalOpen, serverCapabilities,
  } = useStore();
  const [urlInput, setUrlInput] = useState(settings.serverUrl);

  return (
    <aside className="w-full h-full bg-[var(--vz-bg-primary)] border-l border-[var(--vz-border-color)]/50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--vz-border-color)]/30 shrink-0">
        <div className="flex items-center gap-2">
          <Sliders size={13} className="text-[var(--vz-accent-vibrant)]" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--vz-accent-vibrant)]">Settings</span>
          <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-mono ${
            isConnected ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
          }`}>
            {isConnected ? <Wifi size={8} /> : <WifiOff size={8} />}
            {isConnected ? 'LIVE' : 'OFF'}
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-[var(--vz-accent-vibrant)]/10 text-[var(--vz-text-secondary)]/40 hover:text-[var(--vz-accent-vibrant)] transition-colors cursor-pointer"
        >
          <X size={14} />
        </motion.button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {/* Connection */}
        <Section title="Connection" icon={Wifi} defaultOpen={true}>
          <div className="space-y-2">
            <input
              type="text" value={urlInput} onChange={(e) => setUrlInput(e.target.value)}
              placeholder="http://127.0.0.1:8080"
              className="w-full bg-[var(--vz-bg-secondary)] border border-[var(--vz-border-color)]/50 rounded-lg px-3 py-2 text-xs font-mono text-[var(--vz-text-secondary)] placeholder:text-[var(--vz-accent-muted)]/20 outline-none focus:border-[var(--vz-accent-vibrant)]/40 transition-colors"
            />
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => connect(urlInput)}
                className="flex-1 bg-[var(--vz-accent-vibrant)]/10 hover:bg-[var(--vz-accent-vibrant)]/20 border border-[var(--vz-accent-vibrant)]/30 text-[var(--vz-accent-vibrant)] text-xs font-bold rounded-lg py-2 transition-colors cursor-pointer"
              >
                {isConnected ? 'Reconnect' : 'Connect'}
              </motion.button>
            </div>
            {isConnected && currentModel && (
              <div className="text-[10px] font-mono text-[var(--vz-text-secondary)]/40 truncate">
                Model: <span className="text-[var(--vz-accent-vibrant)]/60">{currentModel}</span>
              </div>
            )}
            {/* Server capabilities */}
            {serverCapabilities && (
              <div className="flex flex-wrap gap-1 mt-1">
                {serverCapabilities.supportsMiRoC && (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[var(--vz-accent-vibrant)]/10 text-[var(--vz-accent-vibrant)]/60 border border-[var(--vz-accent-vibrant)]/20">
                    MiRoC
                  </span>
                )}
                {serverCapabilities.supportsNativeTools && (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-green-500/10 text-green-400/60 border border-green-500/20">
                    Native Tools
                  </span>
                )}
                {serverCapabilities.supportsGrammar && (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400/60 border border-purple-500/20">
                    Grammar
                  </span>
                )}
                {serverCapabilities.supportsCaching && (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400/60 border border-blue-500/20">
                    Cache
                  </span>
                )}
              </div>
            )}
          </div>
        </Section>

        {/* Chats */}
        <Section title="Chats" icon={MessageSquare} badge={undefined} defaultOpen={true}>
          <ChatHistory />
        </Section>

        {/* Memory */}
        <Section title="Memory" icon={Brain} defaultOpen={true}>
          <MemoryManager />
        </Section>

        {/* Profile */}
        <Section title="Profile" icon={User}>
          <ProfileSettings />
        </Section>

        {/* Personality */}
        <Section title="Personality" icon={Sparkles} defaultOpen={true}>
          <div className="space-y-2">
            {PERSONALITIES.map((p) => {
              const active = settings.personalityMode === p.id;
              return (
                <motion.button
                  key={p.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => updateSettings({ personalityMode: p.id })}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    active
                      ? 'bg-[var(--vz-accent-vibrant)]/10 border-[var(--vz-accent-vibrant)]/30'
                      : 'bg-[var(--vz-bg-secondary)]/40 border-[var(--vz-border-color)]/20 hover:border-[var(--vz-accent-vibrant)]/15'
                  }`}
                >
                  <span className="text-lg">{p.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className={`text-[11px] font-bold ${active ? 'text-[var(--vz-accent-vibrant)]' : 'text-[var(--vz-text-secondary)]/70'}`}>
                      {p.name}
                    </div>
                    <div className="text-[9px] text-[var(--vz-text-secondary)]/30 truncate">
                      {p.description}
                    </div>
                  </div>
                  {active && (
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--vz-accent-vibrant)] animate-pulse" />
                  )}
                </motion.button>
              );
            })}
          </div>
        </Section>

        {/* Tools */}
        <Section title="Tools" icon={Terminal} defaultOpen={true}>
          <div className="space-y-2">
            <div className="grid grid-cols-1 gap-1">
              {[
                { name: 'Web Search', icon: Search, active: true },
                { name: 'Web Fetch', icon: Globe, active: true },
                { name: 'Terminal', icon: Terminal, active: true },
                { name: 'File I/O', icon: Cpu, active: true },
                { name: 'Memory', icon: Brain, active: true },
              ].map((tool) => (
                <div key={tool.name} className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-[var(--vz-bg-secondary)]/40 border border-[var(--vz-border-color)]/30">
                  <div className="flex items-center gap-2">
                    <tool.icon size={10} className="text-[var(--vz-accent-vibrant)]/40" />
                    <span className="text-[10px] font-mono text-[var(--vz-text-secondary)]/50">{tool.name}</span>
                  </div>
                  <div className={`w-1.5 h-1.5 rounded-full ${tool.active ? 'bg-green-400' : 'bg-red-400'}`} />
                </div>
              ))}
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => setTerminalOpen(!terminalOpen)}
              className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg border text-[10px] font-bold transition-colors cursor-pointer ${
                terminalOpen
                  ? 'bg-[var(--vz-accent-vibrant)]/15 border-[var(--vz-accent-vibrant)]/40 text-[var(--vz-accent-vibrant)]'
                  : 'bg-[var(--vz-bg-secondary)] border-[var(--vz-border-color)]/50 text-[var(--vz-text-secondary)]/40 hover:border-[var(--vz-accent-vibrant)]/20'
              }`}
            >
              <Terminal size={11} />
              {terminalOpen ? 'Close Terminal' : 'Open Terminal'}
            </motion.button>
          </div>
        </Section>

        {/* Stats */}
        <Section title="Stats" icon={BarChart3} defaultOpen={true}>
          <StatsPanel />
        </Section>

        {/* Weather */}
        <Section title="Weather" icon={Cloud}>
          <WeatherWidget />
        </Section>

        {/* Sandbox */}
        <Section title="Sandbox" icon={sandbox.enabled ? Lock : Unlock}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-[var(--vz-text-secondary)]/60 uppercase tracking-wider">Sandbox</span>
              <motion.button
                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                onClick={() => updateSandbox({ enabled: !sandbox.enabled })}
                className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${
                  sandbox.enabled ? 'bg-[var(--vz-accent-vibrant)]/30 border border-[var(--vz-accent-vibrant)]/50' : 'bg-red-500/20 border border-red-500/30'
                }`}
              >
                <motion.div
                  animate={{ x: sandbox.enabled ? 20 : 2 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className={`absolute top-0.5 w-4 h-4 rounded-full ${sandbox.enabled ? 'bg-[var(--vz-accent-vibrant)]' : 'bg-red-400'}`}
                />
              </motion.button>
            </div>
            {!sandbox.enabled && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                className="flex items-center gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                <AlertTriangle size={11} className="text-red-400 shrink-0" />
                <span className="text-[10px] text-red-400/70">Sandbox disabled. Terminal commands will execute freely.</span>
              </motion.div>
            )}
          </div>
        </Section>

        {/* Sampling */}
        <Section title="Sampling" icon={Sliders}>
          <SliderField label="Temperature" value={settings.temperature} onChange={(v) => updateSettings({ temperature: v })} min={0} max={2} step={0.05} icon={Thermometer} />
          <SliderField label="Top P" value={settings.top_p} onChange={(v) => updateSettings({ top_p: v })} min={0} max={1} step={0.05} icon={Gauge} />
          <SliderField label="Top K" value={settings.top_k} onChange={(v) => updateSettings({ top_k: v })} min={0} max={100} step={1} icon={Cpu} />
          <SliderField label="Max Tokens" value={settings.max_tokens} onChange={(v) => updateSettings({ max_tokens: v })} min={64} max={16384} step={64} icon={Zap} />
          <SliderField label="Seed" value={settings.seed} onChange={(v) => updateSettings({ seed: v })} min={-1} max={99999} step={1} icon={Hash} />
        </Section>

        {/* Penalties */}
        <Section title="Penalties" icon={Shield}>
          <SliderField label="Repeat Penalty" value={settings.repeat_penalty} onChange={(v) => updateSettings({ repeat_penalty: v })} min={1} max={2} step={0.05} icon={Shield} />
          <SliderField label="Frequency" value={settings.frequency_penalty} onChange={(v) => updateSettings({ frequency_penalty: v })} min={0} max={2} step={0.05} icon={Sliders} />
          <SliderField label="Presence" value={settings.presence_penalty} onChange={(v) => updateSettings({ presence_penalty: v })} min={0} max={2} step={0.05} icon={Sliders} />
        </Section>

        {/* System Prompt */}
        <Section title="System Prompt" icon={Cpu}>
          <textarea
            value={settings.systemPrompt}
            onChange={(e) => updateSettings({ systemPrompt: e.target.value })}
            rows={4}
            className="w-full bg-[var(--vz-bg-secondary)] border border-[var(--vz-border-color)]/50 rounded-lg px-3 py-2 text-xs font-mono text-[var(--vz-text-secondary)] outline-none focus:border-[var(--vz-accent-vibrant)]/40 transition-colors resize-none"
          />
        </Section>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-[var(--vz-border-color)]/30 text-center shrink-0">
        <p className="text-[9px] font-mono text-[var(--vz-accent-muted)]/15 uppercase tracking-widest">
          llama.cpp · bun · react
        </p>
      </div>
    </aside>
  );
}
