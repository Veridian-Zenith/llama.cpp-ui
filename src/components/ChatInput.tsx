import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Square, Terminal } from 'lucide-react';
import { useStore } from '../lib/store';

export function ChatInput() {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const {
    sendMessage, stopStreaming, isStreaming, isConnected,
    terminalOpen, setTerminalOpen, agenticMode,
  } = useStore();

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSubmit = () => {
    if (!input.trim() || isStreaming || !isConnected) return;
    sendMessage(input.trim());
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t border-[var(--vz-border-color)]/50 bg-[var(--vz-bg-primary)]/80 backdrop-blur-xl p-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="relative flex items-end gap-3 bg-[var(--vz-bg-secondary)] border border-[var(--vz-border-color)] rounded-2xl p-3 focus-within:border-[var(--vz-accent-vibrant)]/40 transition-all duration-200 focus-within:shadow-[0_0_20px_rgba(255,179,71,0.05)]">
          {/* Terminal toggle */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setTerminalOpen(!terminalOpen)}
            className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer mb-0.5 ${
              terminalOpen
                ? 'bg-[var(--vz-accent-vibrant)]/15 text-[var(--vz-accent-vibrant)]'
                : 'text-[var(--vz-text-secondary)]/30 hover:text-[var(--vz-text-secondary)]/60 hover:bg-[var(--vz-bg-secondary)]'
            }`}
            title="Terminal"
          >
            <Terminal size={15} />
          </motion.button>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isConnected
                ? agenticMode === 'chat'
                  ? 'Ask anything...'
                  : 'Ask anything — I can search, run commands, read files...'
                : 'Connect to server first...'
            }
            disabled={!isConnected}
            rows={1}
            className="flex-1 bg-transparent border-none outline-none resize-none font-mono text-sm text-[var(--vz-text-secondary)] placeholder:text-[var(--vz-accent-muted)]/30 disabled:opacity-40 max-h-48 leading-relaxed"
          />

          {isStreaming ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={stopStreaming}
              className="shrink-0 w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 hover:bg-red-500/30 transition-colors cursor-pointer mb-0.5"
            >
              <Square size={13} />
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSubmit}
              disabled={!input.trim() || !isConnected}
              className="shrink-0 w-8 h-8 rounded-lg bg-[var(--vz-accent-vibrant)]/15 border border-[var(--vz-accent-vibrant)]/30 flex items-center justify-center text-[var(--vz-accent-vibrant)] hover:bg-[var(--vz-accent-vibrant)]/25 transition-all disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer mb-0.5"
            >
              <Send size={13} />
            </motion.button>
          )}
        </div>

        <div className="flex items-center justify-between mt-2 px-1">
          <p className="text-[10px] text-[var(--vz-accent-muted)]/20 font-mono">
            Enter to send · Shift+Enter for newline
          </p>
          <p className="text-[10px] text-[var(--vz-accent-muted)]/20 font-mono uppercase tracking-wider">
            {agenticMode} mode
          </p>
        </div>
      </div>
    </div>
  );
}
