import { memo } from 'react';
import { motion } from 'framer-motion';
import { Bot, User } from 'lucide-react';
import type { DisplayMessage } from '../lib/store';
import { MarkdownRenderer } from './MarkdownRenderer';
import { ToolResultCard } from './ToolResult';
import { ToolApprovalCard } from './ToolApproval';
import { useStore } from '../lib/store';

interface Props {
  message: DisplayMessage;
  index: number;
}

export const ChatMessage = memo(function ChatMessage({ message, index: _index }: Props) {
  const { approveToolCall, denyToolCall } = useStore();
  const isUser = message.role === 'user';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      <div className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center border ${
        isUser
          ? 'bg-[var(--vz-accent-vibrant)]/15 border-[var(--vz-accent-vibrant)]/30'
          : 'bg-[var(--vz-bg-secondary)] border-[var(--vz-border-color)]/50'
      }`}>
        {isUser ? (
          <User size={14} className="text-[var(--vz-accent-vibrant)]" />
        ) : (
          <Bot size={14} className="text-[var(--vz-accent-vibrant)]" />
        )}
      </div>

      {/* Content */}
      <div className={`max-w-[85%] min-w-0 space-y-2 ${isUser ? 'items-end' : ''}`}>
        <div
          className={`rounded-2xl px-4 py-3 border transition-colors ${
            isUser
              ? 'bg-[var(--vz-accent-vibrant)]/8 border-[var(--vz-accent-vibrant)]/20'
              : 'bg-[var(--vz-bg-secondary)]/80 border-[var(--vz-border-color)]/40'
          }`}
        >
          {isUser ? (
            <p className="text-sm font-mono text-[var(--vz-accent-vibrant)]/90 whitespace-pre-wrap leading-relaxed">
              {message.content}
            </p>
          ) : (
            <div className="text-sm leading-relaxed">
              {message.content ? (
                <MarkdownRenderer content={message.content} />
              ) : message.thinking ? (
                <div className="text-[var(--vz-text-secondary)]/40 italic text-xs">
                  Thinking...
                </div>
              ) : (
                <span className="inline-flex items-center gap-2 text-[var(--vz-text-secondary)]/30 text-xs">
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
