import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wifi, Sliders, Sparkles, Terminal, Brain, User, X,
} from 'lucide-react';
import { useStore } from '../lib/store';
import { PERSONALITIES } from '../lib/personality';
import { StatsPanel } from './StatsPanel';
import { WeatherWidget } from './WeatherWidget';
import { MemoryManager } from './MemoryManager';
import { ProfileSettings } from './ProfileSettings';

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
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <Icon size={11} className="text-[var(--vz-accent-vibrant)]/50 shrink-0 w-[clamp(10px,1vw,11px)] h-[clamp(10px,1vw,11px)]" />
          <span className="text-[clamp(9px,0.9vw,10px)] font-mono text-[var(--vz-text-secondary)]/60 uppercase tracking-wider truncate">{label}</span>
        </div>
        <span className="text-[clamp(9px,0.9vw,10px)] font-mono text-[var(--vz-accent-vibrant)] shrink-0">{value}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-[var(--vz-bg-tertiary)] border border-[var(--vz-border-color)]/30 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--vz-accent-vibrant)] [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[var(--vz-bg-primary)] [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(255,45,45,0.4)] touch-manipulation"
      />
    </div>
  );
}

const NAV_ITEMS = [
  { id: 'connection', label: 'Server', icon: Wifi, desc: 'Connect to llama-server' },
  { id: 'model', label: 'Model', icon: Sliders, desc: 'Sampling & penalties' },
  { id: 'personality', label: 'Persona', icon: Sparkles, desc: 'Personality & system prompt' },
  { id: 'tools', label: 'Tools', icon: Terminal, desc: 'Available tools & terminal' },
  { id: 'memory', label: 'Memory', icon: Brain, desc: 'Persistent memory store' },
  { id: 'profile', label: 'Profile', icon: User, desc: 'Your identity & location' },
];

interface Props {
  onClose: () => void;
}

const ATMOSPHERES = [
  { id: '', label: 'Blood Moon', color: '#FF2D2D', desc: 'Default red' },
  { id: 'atmosphere-amber', label: 'Amber', color: '#FFB347', desc: 'vzdev classic' },
  { id: 'atmosphere-midnight-void', label: 'Midnight Void', color: '#818cf8', desc: 'Indigo' },
  { id: 'atmosphere-golden-zenith', label: 'Golden Zenith', color: '#FFD700', desc: 'Gold' },
];

export function SettingsPanel({ onClose }: Props) {
  const [activeTab, setActiveTab] = useState('connection');
  const [atmosphere, setAtmosphere] = useState(() => localStorage.getItem('llamacpp-atmosphere') || '');
  const {
    settings, updateSettings, connect, isConnected, currentModel,
    sandbox, updateSandbox,
    terminalOpen, setTerminalOpen, serverCapabilities,
  } = useStore();
  const [urlInput, setUrlInput] = useState(settings.serverUrl);

  const switchAtmosphere = (id: string) => {
    document.documentElement.classList.remove('atmosphere-amber','atmosphere-midnight-void','atmosphere-golden-zenith');
    if (id) document.documentElement.classList.add(id);
    localStorage.setItem('llamacpp-atmosphere', id);
    setAtmosphere(id);
  };

  return (
    <div className="h-full flex bg-[var(--vz-bg-primary)] noise-overlay">
      {/* Vertical nav rail — fluid */}
      <div className="w-[clamp(140px,18vw,180px)] shrink-0 border-r border-[var(--vz-border-color)]/20 flex flex-col bg-[var(--vz-bg-secondary)]/30">
        {/* Header */}
        <div className="flex items-center justify-between px-[clamp(10px,1vw,16px)] py-3 border-b border-[var(--vz-border-color)]/15 shrink-0">
          <span className="text-[clamp(10px,1vw,11px)] font-bold uppercase tracking-wider gradient-themeable">Settings</span>
          <motion.button whileTap={{ scale: 0.9 }}
            onClick={onClose} className="p-1 rounded-lg hover:bg-white/5 text-[var(--vz-text-secondary)]/30 hover:text-[var(--vz-accent-vibrant)] transition-colors cursor-pointer">
            <X size={14} className="w-[clamp(12px,1.2vw,14px)] h-[clamp(12px,1.2vw,14px)]" />
          </motion.button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-2 px-1.5 sm:px-2 space-y-0.5 overflow-y-auto scrollbar-hide">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <motion.button
                key={item.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-2 sm:gap-2.5 px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl text-left transition-colors cursor-pointer relative ${
                  active
                    ? 'bg-[var(--vz-accent-vibrant)]/10 text-[var(--vz-accent-vibrant)] sidebar-active'
                    : 'text-[var(--vz-text-secondary)]/35 hover:text-[var(--vz-text-secondary)]/60 hover:bg-white/[0.02]'
                }`}
              >
                <div className={`w-[clamp(24px,3vw,28px)] h-[clamp(24px,3vw,28px)] rounded-lg flex items-center justify-center shrink-0 ${
                  active ? 'bg-[var(--vz-accent-vibrant)]/15' : 'bg-white/[0.03]'
                }`}>
                  <Icon size={13} className="w-[clamp(11px,1.2vw,13px)] h-[clamp(11px,1.2vw,13px)]" />
                </div>
                <div className="min-w-0 hidden sm:block">
                  <div className="text-[clamp(9px,0.9vw,10px)] font-bold">{item.label}</div>
                  <div className="text-[clamp(7px,0.8vw,8px)] text-[var(--vz-text-secondary)]/20 truncate">{item.desc}</div>
                </div>
                <span className="sm:hidden text-[clamp(9px,0.9vw,10px)] font-bold truncate">{item.label}</span>
              </motion.button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 sm:px-4 py-3 border-t border-[var(--vz-border-color)]/15 shrink-0">
          <div className={`flex items-center gap-1.5 text-[clamp(8px,0.9vw,9px)] font-mono ${isConnected ? 'text-green-400/60' : 'text-red-400/60'}`}>
            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
            {isConnected ? 'Connected' : 'Offline'}
          </div>
        </div>
      </div>

      {/* Content area — fluid padding */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <AnimatePresence mode="wait">
          {activeTab === 'connection' && (
            <motion.div key="connection"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="p-[clamp(12px,1.8vw,20px)] space-y-[clamp(16px,2vw,20px)]"
            >
              <SectionHeader title="Server Connection" subtitle="Connect to your llama-server instance" />

              <div className="space-y-3 max-w-lg">
                <div className="glass rounded-xl p-4 space-y-3 card-glow">
                  <label className="text-[10px] font-mono text-[var(--vz-text-secondary)]/40 uppercase tracking-wider">Server URL</label>
                  <input
                    type="text" value={urlInput} onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://verz.nx.kg:9972"
                    className="w-full bg-[var(--vz-bg-primary)] border border-[var(--vz-border-color)]/40 rounded-lg px-3 py-2.5 text-xs font-mono text-[var(--vz-text-secondary)] placeholder:text-[var(--vz-accent-muted)]/15 outline-none focus:border-[var(--vz-accent-vibrant)]/50 focus:shadow-[0_0_15px_rgba(255,45,45,0.1)] transition-all"
                  />
                  <motion.button
                    whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    onClick={() => connect(urlInput)}
                    className="w-full bg-gradient-to-r from-[var(--vz-accent-vibrant)]/15 to-[var(--vz-accent-vibrant)]/5 hover:from-[var(--vz-accent-vibrant)]/25 hover:to-[var(--vz-accent-vibrant)]/10 border border-[var(--vz-accent-vibrant)]/30 text-[var(--vz-accent-vibrant)] text-xs font-bold rounded-lg py-2.5 transition-all cursor-pointer glow-hover"
                  >
                    {isConnected ? 'Reconnect' : 'Connect'}
                  </motion.button>
                </div>

                {isConnected && currentModel && (
                  <div className="glass rounded-xl p-3 card-glow">
                    <div className="text-[9px] font-mono text-[var(--vz-text-secondary)]/30 uppercase tracking-wider mb-1">Active Model</div>
                    <div className="text-[11px] font-mono text-[var(--vz-accent-vibrant)]/80 truncate">{currentModel}</div>
                  </div>
                )}

                {serverCapabilities && (
                  <div className="glass rounded-xl p-3 card-glow">
                    <div className="text-[9px] font-mono text-[var(--vz-text-secondary)]/30 uppercase tracking-wider mb-2">Server Capabilities</div>
                    <div className="flex flex-wrap gap-1.5">
                      {serverCapabilities.supportsMiRoC && <CapBadge label="MiRoC" color="vibrant" />}
                      {serverCapabilities.supportsNativeTools && <CapBadge label="Native Tools" color="green" />}
                      {serverCapabilities.supportsGrammar && <CapBadge label="Grammar" color="purple" />}
                      {serverCapabilities.supportsCaching && <CapBadge label="Cache" color="blue" />}
                    </div>
                  </div>
                )}
              </div>

              <div className="max-w-lg">
                <SectionHeader title="Atmosphere" subtitle="vzdev-inspired theme — blends with your site" />
                <div className="grid grid-cols-2 gap-2">
                  {ATMOSPHERES.map(a => (
                    <button key={a.id || 'default'} onClick={() => switchAtmosphere(a.id)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all ${atmosphere===a.id ? 'bg-[var(--vz-accent-vibrant)]/10 border-[var(--vz-accent-vibrant)]/30 shadow-glow-themeable' : 'bg-[var(--vz-bg-secondary)] border-[var(--vz-border-color)]/20 hover:border-[var(--vz-accent-vibrant)]/20'}`}>
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ background: a.color, boxShadow: `0 0 10px ${a.color}` }} />
                      <span className="min-w-0">
                        <span className="block text-xs font-bold text-[var(--vz-text-secondary)]">{a.label}</span>
                        <span className="block text-[10px] text-[var(--vz-text-secondary)]/40">{a.desc}</span>
                      </span>
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-[var(--vz-text-secondary)]/30 mt-2">Inspired by <span className="text-primary-themeable">vzdev.indevs.in</span> — amber default, midnight void, golden zenith.</p>
              </div>

              <div className="max-w-lg">
                <SectionHeader title="Live Stats" subtitle="Real-time server performance" />
                <StatsPanel />
              </div>

              <div className="max-w-lg">
                <SectionHeader title="Weather" subtitle="Current conditions at your location" />
                <WeatherWidget />
              </div>
            </motion.div>
          )}

          {activeTab === 'model' && (
            <motion.div key="model"
              initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="p-[clamp(12px,1.8vw,20px)] space-y-[clamp(16px,2vw,20px)]"
            >
              <SectionHeader title="Model Configuration" subtitle="Fine-tune generation parameters" />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-2xl">
                <div className="glass rounded-xl p-4 space-y-4 card-glow">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--vz-accent-vibrant)]/60">Sampling</div>
                  <SliderField label="Temperature" value={settings.temperature} onChange={(v) => updateSettings({ temperature: v })} min={0} max={2} step={0.05} icon={Sliders} />
                  <SliderField label="Top P" value={settings.top_p} onChange={(v) => updateSettings({ top_p: v })} min={0} max={1} step={0.05} icon={Sliders} />
                  <SliderField label="Top K" value={settings.top_k} onChange={(v) => updateSettings({ top_k: v })} min={0} max={100} step={1} icon={Sliders} />
                </div>

                <div className="glass rounded-xl p-4 space-y-4 card-glow">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--vz-accent-vibrant)]/60">Output</div>
                  <SliderField label="Max Tokens" value={settings.max_tokens} onChange={(v) => updateSettings({ max_tokens: v })} min={64} max={16384} step={64} icon={Sliders} />
                  <SliderField label="Seed" value={settings.seed} onChange={(v) => updateSettings({ seed: v })} min={-1} max={99999} step={1} icon={Sliders} />
                </div>

                <div className="glass rounded-xl p-4 space-y-4 card-glow">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--vz-accent-vibrant)]/60">Penalties</div>
                  <SliderField label="Repeat" value={settings.repeat_penalty} onChange={(v) => updateSettings({ repeat_penalty: v })} min={1} max={2} step={0.05} icon={Sliders} />
                  <SliderField label="Frequency" value={settings.frequency_penalty} onChange={(v) => updateSettings({ frequency_penalty: v })} min={0} max={2} step={0.05} icon={Sliders} />
                  <SliderField label="Presence" value={settings.presence_penalty} onChange={(v) => updateSettings({ presence_penalty: v })} min={0} max={2} step={0.05} icon={Sliders} />
                </div>

                <div className="glass rounded-xl p-4 space-y-4 card-glow">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--vz-accent-vibrant)]/60">Sandbox</div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-mono text-[var(--vz-text-secondary)]/60">{sandbox.enabled ? 'Sandboxed' : 'Unrestricted'}</div>
                      <div className="text-[8px] text-[var(--vz-text-secondary)]/25 mt-0.5">{sandbox.enabled ? 'Commands are restricted' : 'Full system access'}</div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                      onClick={() => updateSandbox({ enabled: !sandbox.enabled })}
                      className={`relative w-10 h-5 rounded-full transition-all cursor-pointer ${
                        sandbox.enabled
                          ? 'bg-[var(--vz-accent-vibrant)]/25 border border-[var(--vz-accent-vibrant)]/50 shadow-[0_0_10px_rgba(255,45,45,0.2)]'
                          : 'bg-red-500/15 border border-red-500/30'
                      }`}
                    >
                      <motion.div
                        animate={{ x: sandbox.enabled ? 20 : 2 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className={`absolute top-0.5 w-4 h-4 rounded-full shadow-lg ${sandbox.enabled ? 'bg-[var(--vz-accent-vibrant)]' : 'bg-red-400'}`}
                      />
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'personality' && (
            <motion.div key="personality"
              initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="p-[clamp(12px,1.8vw,20px)] space-y-[clamp(16px,2vw,20px)]"
            >
              <SectionHeader title="Personality" subtitle="Choose how the assistant behaves" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
                {PERSONALITIES.map((p) => {
                  const active = settings.personalityMode === p.id;
                  return (
                    <motion.button
                      key={p.id}
                      whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}
                      onClick={() => updateSettings({ personalityMode: p.id })}
                      className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border text-left transition-all cursor-pointer stagger-child ${
                        active
                          ? 'glass border-[var(--vz-accent-vibrant)]/30 glow-red'
                          : 'bg-[var(--vz-bg-secondary)]/40 border-[var(--vz-border-color)]/15 hover:border-[var(--vz-accent-vibrant)]/20 card-glow'
                      }`}
                    >
                      <span className="text-2xl">{p.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className={`text-[12px] font-bold ${active ? 'gradient-text' : 'text-[var(--vz-text-secondary)]/70'}`}>
                          {p.name}
                        </div>
                        <div className="text-[9px] text-[var(--vz-text-secondary)]/30 mt-0.5">{p.description}</div>
                      </div>
                      {active && <div className="w-2 h-2 rounded-full bg-[var(--vz-accent-vibrant)] animate-pulse shadow-[0_0_8px_rgba(255,45,45,0.5)]" />}
                    </motion.button>
                  );
                })}
              </div>

              <div className="max-w-2xl">
                <SectionHeader title="System Prompt" subtitle="Base instructions for the model" />
                <div className="glass rounded-xl p-4 card-glow">
                  <textarea
                    value={settings.systemPrompt}
                    onChange={(e) => updateSettings({ systemPrompt: e.target.value })}
                    rows={8}
                    className="w-full bg-[var(--vz-bg-primary)] border border-[var(--vz-border-color)]/30 rounded-lg px-3 py-2.5 text-[10px] font-mono text-[var(--vz-text-secondary)] outline-none focus:border-[var(--vz-accent-vibrant)]/40 focus:shadow-[0_0_15px_rgba(255,45,45,0.08)] transition-all resize-none leading-relaxed"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'tools' && (
            <motion.div key="tools"
              initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="p-[clamp(12px,1.8vw,20px)] space-y-[clamp(16px,2vw,20px)]"
            >
              <SectionHeader title="Available Tools" subtitle="Tools the model can use" />

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-w-3xl">
                {[
                  { name: 'Web Search', desc: 'Search DuckDuckGo', color: 'from-blue-500/10' },
                  { name: 'Web Fetch', desc: 'Fetch URL content', color: 'from-cyan-500/10' },
                  { name: 'Terminal', desc: 'Execute commands', color: 'from-green-500/10' },
                  { name: 'File Read/Write', desc: 'Local file access', color: 'from-amber-500/10' },
                  { name: 'Memory', desc: 'Persistent storage', color: 'from-purple-500/10' },
                  { name: 'Profile', desc: 'User profile mgmt', color: 'from-pink-500/10' },
                  { name: 'Code Analyze', desc: 'LSP diagnostics', color: 'from-red-500/10' },
                  { name: 'Code Run', desc: 'Execute snippets', color: 'from-orange-500/10' },
                  { name: 'Weather', desc: 'Current conditions', color: 'from-sky-500/10' },
                  { name: 'Diagram', desc: 'Mermaid charts', color: 'from-violet-500/10' },
                ].map((tool) => (
                  <div key={tool.name} className={`glass rounded-xl p-3 card-glow stagger-child bg-gradient-to-br ${tool.color} to-transparent`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-[var(--vz-text-secondary)]/60">{tool.name}</span>
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.5)]" />
                    </div>
                    <div className="text-[8px] text-[var(--vz-text-secondary)]/25 mt-0.5">{tool.desc}</div>
                  </div>
                ))}
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                onClick={() => setTerminalOpen(!terminalOpen)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-[10px] font-bold transition-all cursor-pointer glow-hover ${
                  terminalOpen
                    ? 'glass border-[var(--vz-accent-vibrant)]/40 text-[var(--vz-accent-vibrant)] glow-red'
                    : 'bg-[var(--vz-bg-secondary)] border-[var(--vz-border-color)]/30 text-[var(--vz-text-secondary)]/40 hover:border-[var(--vz-accent-vibrant)]/20'
                }`}
              >
                <Terminal size={11} />
                {terminalOpen ? 'Close Terminal' : 'Open Terminal'}
              </motion.button>
            </motion.div>
          )}

          {activeTab === 'memory' && (
            <motion.div key="memory"
              initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="p-[clamp(12px,1.8vw,20px)]"
            >
              <SectionHeader title="Memory Store" subtitle="Persistent memories across conversations" />
              <div className="max-w-2xl">
                <MemoryManager />
              </div>
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div key="profile"
              initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="p-[clamp(12px,1.8vw,20px)]"
            >
              <SectionHeader title="Your Profile" subtitle="Personalize your identity" />
              <div className="max-w-lg">
                <ProfileSettings />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-3 sm:mb-4">
      <h2 className="text-[clamp(12px,1.2vw,13px)] font-bold text-[var(--vz-text-secondary)]/80">{title}</h2>
      <p className="text-[clamp(8px,0.9vw,9px)] font-mono text-[var(--vz-text-secondary)]/25 mt-0.5 break-words">{subtitle}</p>
    </div>
  );
}

function CapBadge({ label, color }: { label: string; color: 'vibrant' | 'green' | 'purple' | 'blue' }) {
  const colors = {
    vibrant: 'bg-[var(--vz-accent-vibrant)]/10 text-[var(--vz-accent-vibrant)]/70 border-[var(--vz-accent-vibrant)]/25',
    green: 'bg-green-500/10 text-green-400/70 border-green-500/25',
    purple: 'bg-purple-500/10 text-purple-400/70 border-purple-500/25',
    blue: 'bg-blue-500/10 text-blue-400/70 border-blue-500/25',
  };
  return (
    <span className={`text-[clamp(8px,0.9vw,9px)] font-mono px-2 py-0.5 rounded-full border ${colors[color]}`}>
      {label}
    </span>
  );
}
