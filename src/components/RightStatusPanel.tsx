import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gauge, Activity, Clock, Zap, Database, Cloud, MapPin,
  Brain, Terminal, RefreshCw, Loader2, ChevronDown,
} from 'lucide-react';
import { useStore } from '../lib/store';
import { memoryStore } from '../lib/memory';
import { profileStore } from '../lib/profile';

function CollapsibleSection({
  title, icon: Icon, children, defaultOpen = true, badge,
}: {
  title: string;
  icon: React.ComponentType<{ size: number; className?: string }>;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-[var(--vz-border-color)]/10 last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 text-[var(--vz-text-secondary)] hover:text-[var(--vz-accent-vibrant)] transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-1.5">
          <Icon size={10} className="text-[var(--vz-accent-vibrant)]/50" />
          <span className="text-[9px] font-bold uppercase tracking-wider">{title}</span>
          {badge && (
            <span className="text-[7px] font-mono px-1 py-0.5 rounded-full bg-[var(--vz-accent-vibrant)]/10 text-[var(--vz-accent-vibrant)]/60">{badge}</span>
          )}
        </div>
        <motion.div animate={{ rotate: open ? 0 : -90 }} transition={{ duration: 0.15 }}>
          <ChevronDown size={10} className="text-[var(--vz-text-secondary)]/20" />
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
            <div className="px-3 pb-2.5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function RightStatusPanel() {
  const {
    isConnected, streamingStats, isStreaming, serverCapabilities,
  } = useStore();
  const [weather, setWeather] = useState<{ temp: string; cond: string; loc: string } | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [weatherError, setWeatherError] = useState('');

  const memories = memoryStore.getAll();
  const profile = profileStore.get();

  const fetchWeather = async () => {
    setLoadingWeather(true);
    setWeatherError('');
    try {
      const q = (profile.latitude && profile.longitude)
        ? `${profile.latitude},${profile.longitude}`
        : undefined;
      const url = q ? "https://wttr.in/" + encodeURIComponent(q) + "?format=j1" : "https://wttr.in/?format=j1";
      const res = await fetch(url, { headers: { 'User-Agent': 'curl/7.88.1' }, signal: AbortSignal.timeout(8000) });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      const c = data.current_condition?.[0];
      const a = data.nearest_area?.[0];
      if (!c) throw new Error('No data');
      setWeather({
        temp: c.temp_C,
        cond: c.weatherDesc?.[0]?.value || 'Unknown',
        loc: a?.areaName?.[0]?.value || q || 'Unknown',
      });
    } catch (e) {
      setWeatherError(`${e}`);
    } finally {
      setLoadingWeather(false);
    }
  };

  const contextSize = serverCapabilities?.contextSize || 0;
  const contextPct = contextSize > 0
    ? Math.round((streamingStats.promptTokens / contextSize) * 100)
    : 0;

  return (
    <div className="h-full flex flex-col bg-[var(--vz-bg-primary)] border-l border-[var(--vz-border-color)]/15 overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 border-b border-[var(--vz-border-color)]/10 shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-bold uppercase tracking-wider gradient-text">Status</span>
          <div className={`flex items-center gap-1 text-[8px] font-mono ${isConnected ? 'text-green-400/60' : 'text-red-400/60'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
            {isConnected ? 'LIVE' : 'OFF'}
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {/* Performance */}
        <CollapsibleSection title="Performance" icon={Gauge}>
          <div className="space-y-2">
            {/* Context window bar */}
            {contextSize > 0 && (
              <div>
                <div className="flex justify-between text-[8px] font-mono text-[var(--vz-text-secondary)]/30 mb-1">
                  <span>Context</span>
                  <span>{contextPct}%</span>
                </div>
                <div className="h-1.5 bg-[var(--vz-bg-tertiary)] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${contextPct}%` }}
                    transition={{ duration: 0.5 }}
                    className={`h-full rounded-full ${contextPct > 80 ? 'bg-red-500' : contextPct > 50 ? 'bg-amber-500' : 'bg-[var(--vz-accent-vibrant)]'}`}
                    style={{ boxShadow: `0 0 6px ${contextPct > 80 ? 'rgba(239,68,68,0.5)' : 'rgba(255,45,45,0.4)'}` }}
                  />
                </div>
                <div className="text-[7px] font-mono text-[var(--vz-text-secondary)]/20 mt-0.5">
                  {streamingStats.promptTokens.toLocaleString()} / {contextSize.toLocaleString()}
                </div>
              </div>
            )}

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-1.5">
              <StatCard icon={Zap} label="Speed" value={isStreaming && streamingStats.generationTokensPerSecond > 0 ? `${streamingStats.generationTokensPerSecond.toFixed(1)}` : '—'} unit="tok/s" />
              <StatCard icon={Activity} label="Tokens" value={streamingStats.totalTokens > 0 ? streamingStats.totalTokens.toLocaleString() : '—'} />
              <StatCard icon={Clock} label="Time" value={streamingStats.generationMs > 0 ? `${(streamingStats.generationMs / 1000).toFixed(1)}s` : '—'} />
              <StatCard icon={Database} label="Cache" value={streamingStats.cacheTokens > 0 ? `${streamingStats.cacheTokens}` : '—'} />
            </div>
          </div>
        </CollapsibleSection>

        {/* Weather */}
        <CollapsibleSection title="Weather" icon={Cloud}>
          <div className="space-y-2">
            {weather ? (
              <div className="glass rounded-lg p-2.5 card-glow">
                <div className="flex items-center gap-1 mb-1">
                  <MapPin size={8} className="text-[var(--vz-accent-vibrant)]/40" />
                  <span className="text-[8px] font-mono text-[var(--vz-text-secondary)]/30 truncate">{weather.loc}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-mono font-bold gradient-text">{weather.temp}°C</span>
                  <span className="text-[9px] text-[var(--vz-text-secondary)]/30">{weather.cond}</span>
                </div>
              </div>
            ) : weatherError ? (
              <div className="text-[8px] text-red-400/40 font-mono">{weatherError}</div>
            ) : (
              <div className="text-[8px] text-[var(--vz-text-secondary)]/20 font-mono">No weather data</div>
            )}
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={fetchWeather}
              disabled={loadingWeather}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-white/[0.02] border border-[var(--vz-border-color)]/15 text-[8px] font-mono text-[var(--vz-text-secondary)]/30 hover:text-[var(--vz-accent-vibrant)]/60 hover:border-[var(--vz-accent-vibrant)]/20 transition-all cursor-pointer"
            >
              {loadingWeather ? <Loader2 size={9} className="animate-spin" /> : <RefreshCw size={9} />}
              {weather ? 'Refresh' : 'Fetch'}
            </motion.button>
          </div>
        </CollapsibleSection>

        {/* Memory */}
        <CollapsibleSection title="Memory" icon={Brain} badge={memories.length > 0 ? `${memories.length}` : undefined}>
          <div className="space-y-1.5">
            {memories.length === 0 ? (
              <div className="text-[8px] text-[var(--vz-text-secondary)]/20 font-mono py-2 text-center">No memories stored</div>
            ) : (
              <>
                <div className="flex flex-wrap gap-1">
                  {memories.slice(0, 8).map((m) => (
                    <span key={m.id} className="text-[7px] font-mono px-1.5 py-0.5 rounded-full bg-white/[0.03] border border-[var(--vz-border-color)]/15 text-[var(--vz-text-secondary)]/30 truncate max-w-[100px]">
                      {m.key}
                    </span>
                  ))}
                  {memories.length > 8 && (
                    <span className="text-[7px] font-mono text-[var(--vz-accent-vibrant)]/30">+{memories.length - 8}</span>
                  )}
                </div>
                <div className="flex gap-1.5 text-[7px] font-mono text-[var(--vz-text-secondary)]/15">
                  {Object.entries(
                    memories.reduce((acc, m) => { acc[m.category] = (acc[m.category] || 0) + 1; return acc; }, {} as Record<string, number>)
                  ).map(([cat, count]) => (
                    <span key={cat}>{cat}:{count}</span>
                  ))}
                </div>
              </>
            )}
          </div>
        </CollapsibleSection>

        {/* Quick Tools */}
        <CollapsibleSection title="Tools" icon={Terminal}>
          <div className="grid grid-cols-2 gap-1">
            {['Search', 'Fetch', 'Terminal', 'Files', 'Memory', 'Profile'].map((t) => (
              <div key={t} className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-white/[0.02] border border-[var(--vz-border-color)]/10">
                <div className="w-1 h-1 rounded-full bg-green-400/60" />
                <span className="text-[8px] font-mono text-[var(--vz-text-secondary)]/25">{t}</span>
              </div>
            ))}
          </div>
        </CollapsibleSection>

        {/* Server Capabilities */}
        {serverCapabilities && (
          <CollapsibleSection title="Server" icon={Activity} defaultOpen={false}>
            <div className="flex flex-wrap gap-1">
              {serverCapabilities.supportsMiRoC && <span className="text-[7px] font-mono px-1.5 py-0.5 rounded bg-[var(--vz-accent-vibrant)]/8 text-[var(--vz-accent-vibrant)]/50 border border-[var(--vz-accent-vibrant)]/15">MiRoC</span>}
              {serverCapabilities.supportsNativeTools && <span className="text-[7px] font-mono px-1.5 py-0.5 rounded bg-green-500/8 text-green-400/50 border border-green-500/15">Native</span>}
              {serverCapabilities.supportsGrammar && <span className="text-[7px] font-mono px-1.5 py-0.5 rounded bg-purple-500/8 text-purple-400/50 border border-purple-500/15">Grammar</span>}
              {serverCapabilities.supportsCaching && <span className="text-[7px] font-mono px-1.5 py-0.5 rounded bg-blue-500/8 text-blue-400/50 border border-blue-500/15">Cache</span>}
            </div>
            <div className="text-[7px] font-mono text-[var(--vz-text-secondary)]/15 mt-1.5">
              Ctx: {serverCapabilities.contextSize?.toLocaleString() || '—'}
            </div>
          </CollapsibleSection>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon, label, value, unit,
}: {
  icon: React.ComponentType<{ size: number; className?: string }>;
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <div className="glass rounded-lg p-2 card-glow">
      <div className="flex items-center gap-1 mb-0.5">
        <Icon size={8} className="text-[var(--vz-accent-vibrant)]/40" />
        <span className="text-[7px] font-mono text-[var(--vz-text-secondary)]/25 uppercase">{label}</span>
      </div>
      <div className="flex items-baseline gap-0.5">
        <span className="text-[11px] font-mono font-bold text-[var(--vz-text-secondary)]/70">{value}</span>
        {unit && <span className="text-[7px] font-mono text-[var(--vz-text-secondary)]/20">{unit}</span>}
      </div>
    </div>
  );
}
