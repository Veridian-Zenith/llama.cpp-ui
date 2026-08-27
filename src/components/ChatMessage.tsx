import { memo, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Bot, User } from 'lucide-react';
import type { DisplayMessage } from '../lib/store';
import { ToolResultCard } from './ToolResult';
import { ToolApprovalCard } from './ToolApproval';
import { useStore } from '../lib/store';

const MarkdownRenderer = lazy(() => import('./MarkdownRenderer').then(m => ({ default: m.MarkdownRenderer })));

interface Props {
  message: DisplayMessage;
  index: number;
}

export const ChatMessage = memo(function ChatMessage({ message, index: _index }: Props) {
  const { approveToolCall, denyToolCall } = useStore();
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`flex gap-[clamp(8px,1.2vw,12px)] ${isUser ? 'flex-row-reverse' : ''} will-change-transform`}
    >
      {/* Avatar — fluid */}
      <div className={`shrink-0 w-[clamp(28px,4vw,32px)] h-[clamp(28px,4vw,32px)] rounded-xl flex items-center justify-center border ${
        isUser
          ? 'bg-[var(--vz-accent-vibrant)]/15 border-[var(--vz-accent-vibrant)]/30'
          : 'bg-[var(--vz-bg-secondary)] border-[var(--vz-border-color)]/50'
      }`}>
        {isUser ? (
          <User size={14} className="text-[var(--vz-accent-vibrant)] w-[clamp(12px,1.4vw,14px)] h-[clamp(12px,1.4vw,14px)]" />
        ) : (
          <Bot size={14} className="text-[var(--vz-accent-vibrant)] w-[clamp(12px,1.4vw,14px)] h-[clamp(12px,1.4vw,14px)]" />
        )}
      </div>

      {/* Content — fluid max-width */}
      <div className={`max-w-[min(85%,65ch)] sm:max-w-[78%] min-w-0 space-y-2 ${isUser ? 'items-end' : ''}`}>
        <div
          className={`rounded-2xl px-[clamp(12px,1.5vw,16px)] py-[clamp(10px,1.2vw,12px)] border transition-colors ${
            isUser
              ? 'bg-[var(--vz-accent-vibrant)]/8 border-[var(--vz-accent-vibrant)]/20'
              : 'bg-[var(--vz-bg-secondary)]/80 border-[var(--vz-border-color)]/40'
          }`}
        >
          {isUser ? (
            <p className="text-[clamp(12px,1.4vw,14px)] font-mono text-[var(--vz-accent-vibrant)]/90 whitespace-pre-wrap leading-[clamp(1.4,1.8vw,1.6)] break-words">
              {message.content}
            </p>
          ) : (
            <div className="text-[clamp(12px,1.4vw,14px)] leading-[clamp(1.4,1.8vw,1.6)] break-words">
              {message.content ? (
                <Suspense fallback={<span className="text-[clamp(11px,1.1vw,12px)] text-[var(--vz-text-secondary)]/40">Loading…</span>}>
                  <MarkdownRenderer content={message.content} />
                </Suspense>
              ) : message.thinking ? (
                <div className="text-[var(--vz-text-secondary)]/40 italic text-[clamp(11px,1.1vw,12px)]">
                  Thinking...
                </div>
              ) : (
                <span className="inline-flex items-center gap-2 text-[var(--vz-text-secondary)]/30 text-[clamp(11px,1.1vw,12px)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--vz-accent-vibrant)] animate-pulse" />
                  Processing...
                </span>
              )}
            </div>
          )}
        </div>

        {/* Tool calls */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="space-y-2">
            {message.toolCalls.map((tc) =>
              tc.status === 'pending' ? (
                <ToolApprovalCard
                  key={tc.id}
                  toolCall={tc}
                  onApprove={approveToolCall}
                  onDeny={denyToolCall}
                />
              ) : (
                <ToolResultCard key={tc.id} toolCall={tc} />
              )
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
});
