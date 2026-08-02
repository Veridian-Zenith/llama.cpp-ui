import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Cpu, Zap, Database, Clock, Gauge, BarChart3 } from 'lucide-react';
import { useServerStats } from '../hooks/useServerStats';
import { useStore } from '../lib/store';

function StatItem({
  label, value, unit, icon: Icon, color = 'text-[var(--vz-accent-vibrant)]',
}: {
  label: string;
  value: string | number;
  unit?: string;
  icon: React.ComponentType<{ size: number; className?: string }>;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-[var(--vz-bg-secondary)]/40 border border-[var(--vz-border-color)]/20">
      <Icon size={10} className={`${color} shrink-0`} />
      <div className="min-w-0 flex-1">
        <div className="text-[8px] font-mono uppercase tracking-wider text-[var(--vz-text-secondary)]/25 truncate">{label}</div>
        <div className={`text-[11px] font-mono font-bold ${color} truncate`}>
          {value}{unit && <span className="text-[8px] opacity-40 ml-0.5">{unit}</span>}
        </div>
      </div>
    </div>
  );
}

function ContextBar({ used, total }: { used: number; total: number }) {
  const percent = total > 0 ? (used / total) * 100 : 0;
  const color = percent > 90 ? 'bg-red-500' : percent > 70 ? 'bg-amber-500' : 'bg-[var(--vz-accent-vibrant)]';
  const textColor = percent > 90 ? 'text-red-400' : percent > 70 ? 'text-amber-400' : 'text-[var(--vz-accent-vibrant)]';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[8px] font-mono uppercase tracking-wider text-[var(--vz-text-secondary)]/25">Context Window</span>
        <span className={`text-[10px] font-mono font-bold ${textColor}`}>
          {used.toLocaleString()} / {total.toLocaleString()}
          <span className="text-[8px] opacity-50 ml-1">({percent.toFixed(1)}%)</span>
        </span>
      </div>
      <div className="h-2 rounded-full bg-[var(--vz-bg-secondary)] border border-[var(--vz-border-color)]/20 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(percent, 100)}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={`h-full rounded-full ${color} relative`}
        >
          {percent > 15 && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/10" />
          )}
        </motion.div>
      </div>
      <div className="flex justify-between text-[7px] font-mono text-[var(--vz-text-secondary)]/15">
        <span>0</span>
        <span>{total.toLocaleString()} tokens</span>
      </div>
    </div>
  );
}

export function StatsPanel() {
  const { isConnected, settings, streamingStats, isStreaming, serverCapabilities } = useStore();
  const { stats } = useServerStats(settings.serverUrl, isConnected);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Use promptTokens as the actual context usage (tokens sent to the model)
  const contextLimit = serverCapabilities?.contextSize || stats.totalContext || 76800;
  const contextUsed = streamingStats.promptTokens || 0;

  return (
    <div className="space-y-3">
      <div className="text-center">
        <div className="text-base font-mono font-bold text-[var(--vz-accent-vibrant)]">
          {currentTime.toLocaleTimeString()}
        </div>
        <div className="text-[8px] font-mono text-[var(--vz-text-secondary)]/25 uppercase tracking-widest">
          {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        </div>
      </div>

      {/* Context Window Tracker */}
      <ContextBar used={contextUsed} total={contextLimit} />

      {/* Speed metrics */}
      <div className="grid grid-cols-2 gap-1">
        <StatItem label="Prompt" value={streamingStats.promptTokensPerSecond.toFixed(1)} unit="tok/s" icon={Zap}
          color={isStreaming && streamingStats.promptTokensPerSecond > 0 ? 'text-green-400' : 'text-[var(--vz-text-secondary)]/40'} />
        <StatItem label="Generate" value={streamingStats.generationTokensPerSecond.toFixed(1)} unit="tok/s" icon={Gauge}
          color={isStreaming && streamingStats.generationTokensPerSecond > 0 ? 'text-green-400' : 'text-[var(--vz-text-secondary)]/40'} />
        <StatItem label="Prompt" value={streamingStats.promptMs > 0 ? streamingStats.promptMs.toFixed(0) : '-'} unit="ms" icon={Clock} />
        <StatItem label="Gen" value={streamingStats.generationMs > 0 ? streamingStats.generationMs.toFixed(0) : '-'} unit="ms" icon={Clock} />
      </div>

      {/* Token counts */}
      <div className="grid grid-cols-2 gap-1">
        <StatItem label="Slots" value={`${stats.idleSlots}/${stats.slots.length}`} icon={Cpu}
          color={stats.busySlots > 0 ? 'text-green-400' : 'text-[var(--vz-text-secondary)]/40'} />
        <StatItem label="Prompt" value={streamingStats.promptTokens.toLocaleString()} unit="tok" icon={BarChart3} />
        <StatItem label="Output" value={streamingStats.generationTokens.toLocaleString()} unit="tok" icon={Activity} />
        <StatItem label="Total" value={streamingStats.totalTokens.toLocaleString()} unit="tok" icon={Activity} color="text-[var(--vz-accent-vibrant)]" />
        {streamingStats.cacheTokens > 0 && (
          <StatItem label="Cache" value={streamingStats.cacheTokens.toLocaleString()} unit="tok" icon={Database} color="text-green-400" />
        )}
        {isStreaming && (
          <StatItem label="Status" value="Generating" icon={Activity} color="text-green-400" />
        )}
      </div>

      {/* Remaining context */}
      {contextUsed > 0 && (
        <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-[var(--vz-bg-secondary)]/30 border border-[var(--vz-border-color)]/15">
          <span className="text-[8px] font-mono text-[var(--vz-text-secondary)]/25 uppercase tracking-wider">Remaining</span>
          <span className={`text-[10px] font-mono font-bold ${
            (contextLimit - contextUsed) < contextLimit * 0.1 ? 'text-red-400' : 'text-green-400'
          }`}>
            {(contextLimit - contextUsed).toLocaleString()} tok
          </span>
        </div>
      )}

      {/* Server capabilities */}
      {serverCapabilities && (
        <div className="pt-1 border-t border-[var(--vz-border-color)]/20">
          <div className="text-[8px] font-mono text-[var(--vz-text-secondary)]/20 uppercase tracking-wider mb-1">Server Capabilities</div>
          <div className="flex flex-wrap gap-1">
            {serverCapabilities.supportsMiRoC && (
              <span className="text-[8px] font-mono px-1 py-0.5 rounded bg-[var(--vz-accent-vibrant)]/10 text-[var(--vz-accent-vibrant)]/50">MiRoC</span>
            )}
            {serverCapabilities.supportsNativeTools && (
              <span className="text-[8px] font-mono px-1 py-0.5 rounded bg-green-500/10 text-green-400/50">Tools</span>
            )}
            {serverCapabilities.supportsGrammar && (
              <span className="text-[8px] font-mono px-1 py-0.5 rounded bg-purple-500/10 text-purple-400/50">Grammar</span>
            )}
            {serverCapabilities.supportsStructuredOutput && (
              <span className="text-[8px] font-mono px-1 py-0.5 rounded bg-blue-500/10 text-blue-400/50">JSON</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
