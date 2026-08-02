import { motion } from 'framer-motion';
import {
  Check,
  X,
  Terminal,
  Globe,
  Search,
  FileText,
  Brain,
  Shield,
  AlertTriangle,
} from 'lucide-react';
import type { ToolCall } from '../lib/tools/types';
import { getToolByName } from '../lib/tools/types';

const CATEGORY_ICONS: Record<string, React.ComponentType<{ size: number; className?: string }>> = {
  search: Search,
  web: Globe,
  terminal: Terminal,
  file: FileText,
  util: Brain,
};

interface Props {
  toolCall: ToolCall;
  onApprove: (id: string) => void;
  onDeny: (id: string) => void;
}

export function ToolApprovalCard({ toolCall, onApprove, onDeny }: Props) {
  const def = getToolByName(toolCall.name);
  const Icon = CATEGORY_ICONS[def?.category || 'util'] || Brain;

  const formatArgs = (args: Record<string, unknown>) =>
    Object.entries(args)
      .map(([k, v]) => `${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`)
      .join('\n');

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      className="rounded-xl border border-amber-500/30 bg-amber-500/5 overflow-hidden"
    >
      <div className="px-3 py-2 flex items-center gap-2 border-b border-amber-500/10">
        <div className="w-6 h-6 rounded-md bg-amber-500/10 flex items-center justify-center">
          <Icon size={12} className="text-amber-400" />
        </div>
        <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
          Tool Call: {toolCall.name}
        </span>
        {def?.requiresApproval && (
          <div className="ml-auto flex items-center gap-1 text-[9px] text-amber-400/60 font-mono">
            <Shield size={10} />
            REQUIRES APPROVAL
          </div>
        )}
      </div>

      <div className="px-3 py-2">
        <pre className="text-[11px] font-mono text-amber-300/70 whitespace-pre-wrap leading-relaxed">
          {formatArgs(toolCall.arguments)}
        </pre>
      </div>

      {toolCall.status === 'pending' && (
        <div className="px-3 py-2 flex items-center gap-2 border-t border-amber-500/10">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onApprove(toolCall.id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-bold hover:bg-green-500/20 transition-colors cursor-pointer"
          >
            <Check size={12} /> Approve
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onDeny(toolCall.id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold hover:bg-red-500/20 transition-colors cursor-pointer"
          >
            <X size={12} /> Deny
          </motion.button>
        </div>
      )}

      {toolCall.status === 'denied' && (
        <div className="px-3 py-2 border-t border-red-500/10">
          <div className="flex items-center gap-1.5 text-xs text-red-400/70 font-mono">
            <AlertTriangle size={12} />
            Denied by user
          </div>
        </div>
      )}
    </motion.div>
  );
}
