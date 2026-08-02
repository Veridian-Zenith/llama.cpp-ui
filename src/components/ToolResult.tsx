import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Terminal,
  Globe,
  Search,
  FileText,
  Brain,
  ChevronDown,
  Check,
  X,
  Loader2,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import type { ToolCall } from '../lib/tools/types';

const CATEGORY_ICONS: Record<string, React.ComponentType<{ size: number; className?: string }>> = {
  search: Search,
  web: Globe,
  terminal: Terminal,
  file: FileText,
  util: Brain,
};

const STATUS_STYLES: Record<string, { bg: string; border: string; text: string; icon: React.ComponentType<{ size: number; className?: string }> }> = {
  running: { bg: 'bg-blue-500/5', border: 'border-blue-500/30', text: 'text-blue-400', icon: Loader2 },
  completed: { bg: 'bg-green-500/5', border: 'border-green-500/30', text: 'text-green-400', icon: Check },
  error: { bg: 'bg-red-500/5', border: 'border-red-500/30', text: 'text-red-400', icon: AlertTriangle },
  denied: { bg: 'bg-red-500/5', border: 'border-red-500/30', text: 'text-red-400', icon: X },
};

export function ToolResultCard({ toolCall }: { toolCall: ToolCall }) {
  const [expanded, setExpanded] = useState(toolCall.status === 'running');
  const status = STATUS_STYLES[toolCall.status] || STATUS_STYLES.running;
  const CategoryIcon = CATEGORY_ICONS[toolCall.name === 'think' ? 'util' : 'search'] || Brain;

  const duration = toolCall.startTime && toolCall.endTime
    ? `${((toolCall.endTime - toolCall.startTime) / 1000).toFixed(1)}s`
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border ${status.border} ${status.bg} overflow-hidden`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/[0.02] transition-colors cursor-pointer"
      >
        <CategoryIcon size={12} className={status.text} />

        <span className={`text-[11px] font-bold uppercase tracking-wider ${status.text}`}>
          {toolCall.name}
        </span>

        {toolCall.status === 'running' && (
          <Loader2 size={10} className={`${status.text} animate-spin`} />
        )}

        {duration && (
          <span className="ml-auto flex items-center gap-1 text-[9px] font-mono text-[var(--vz-text-secondary)]/30">
            <Clock size={8} /> {duration}
          </span>
        )}

        <motion.div
          animate={{ rotate: expanded ? 0 : -90 }}
          transition={{ duration: 0.15 }}
        >
          <ChevronDown size={12} className={`${status.text}/50`} />
        </motion.div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 border-t border-white/[0.03] pt-2">
              {/* Arguments */}
              <div className="mb-2">
                <span className="text-[9px] font-mono uppercase tracking-wider text-[var(--vz-text-secondary)]/30 block mb-1">
                  Arguments
                </span>
                <pre className="text-[10px] font-mono text-[var(--vz-text-secondary)]/50 bg-black/20 rounded-lg p-2 whitespace-pre-wrap">
                  {JSON.stringify(toolCall.arguments, null, 2)}
                </pre>
              </div>

              {/* Result */}
              {toolCall.result && (
                <div>
                  <span className="text-[9px] font-mono uppercase tracking-wider text-[var(--vz-text-secondary)]/30 block mb-1">
                    Result
                  </span>
                  <pre className="text-[10px] font-mono text-[var(--vz-text-secondary)]/70 bg-black/20 rounded-lg p-2 whitespace-pre-wrap max-h-48 overflow-y-auto scrollbar-hide leading-relaxed">
                    {toolCall.result}
                  </pre>
                </div>
              )}

              {/* Error */}
              {toolCall.error && (
                <div>
                  <span className="text-[9px] font-mono uppercase tracking-wider text-red-400/50 block mb-1">
                    Error
                  </span>
                  <pre className="text-[10px] font-mono text-red-400/70 bg-red-500/5 rounded-lg p-2 whitespace-pre-wrap">
                    {toolCall.error}
                  </pre>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
