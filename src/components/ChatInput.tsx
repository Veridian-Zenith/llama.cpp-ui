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
    <div className="border-t border-[var(--vz-border-color)]/30 bg-[var(--vz-bg-primary)]/60 backdrop-blur-xl p-[clamp(12px,2vw,16px)] md:px-[clamp(16px,3vw,32px)]">
      <div className="max-w-[min(896px,96vw)] mx-auto">
        <div className="relative flex items-end gap-[clamp(8px,1.2vw,12px)] bg-[var(--vz-card-bg)] border border-[var(--vz-card-border)] rounded-3xl p-[clamp(8px,1.2vw,12px)] focus-within:border-[var(--vz-accent-vibrant)]/40 backdrop-blur-sm shadow-[0_0_15px_var(--vz-shadow-color)] transition-all duration-200">
          {/* Terminal toggle — fluid */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setTerminalOpen(!terminalOpen)}
            className={`shrink-0 w-[clamp(32px,4vw,36px)] h-[clamp(32px,4vw,36px)] rounded-xl flex items-center justify-center transition-colors cursor-pointer mb-0.5 ${
              terminalOpen
                ? 'bg-[var(--vz-accent-vibrant)]/15 text-[var(--vz-accent-vibrant)]'
                : 'text-[var(--vz-text-secondary)]/30 hover:text-[var(--vz-text-secondary)]/60 hover:bg-[var(--vz-bg-secondary)]'
            }`}
            title="Terminal"
          >
            <Terminal size={15} className="w-[clamp(14px,1.5vw,15px)] h-[clamp(14px,1.5vw,15px)]" />
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
            className="flex-1 bg-transparent border-none outline-none resize-none font-mono text-[clamp(12px,1.4vw,14px)] text-[var(--vz-text-secondary)] placeholder:text-[var(--vz-accent-muted)]/30 disabled:opacity-40 max-h-[min(30vh,160px)] leading-relaxed py-1"
          />

          {isStreaming ? (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={stopStreaming}
              className="shrink-0 w-[clamp(32px,4vw,36px)] h-[clamp(32px,4vw,36px)] rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 hover:bg-red-500/30 transition-colors cursor-pointer mb-0.5"
            >
              <Square size={13} className="w-[clamp(12px,1.3vw,13px)] h-[clamp(12px,1.3vw,13px)]" />
            </motion.button>
          ) : (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleSubmit}
              disabled={!input.trim() || !isConnected}
              className="shrink-0 w-[clamp(32px,4vw,36px)] h-[clamp(32px,4vw,36px)] rounded-xl bg-[var(--vz-accent-vibrant)]/10 hover:bg-[var(--vz-accent-vibrant)] border border-[var(--vz-accent-vibrant)]/40 text-[var(--vz-accent-vibrant)] hover:text-black font-black flex items-center justify-center shadow-glow-themeable transition-all disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer mb-0.5 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none" />
              <Send size={13} className="relative z-10 w-[clamp(12px,1.3vw,13px)] h-[clamp(12px,1.3vw,13px)]" />
            </motion.button>
          )}
        </div>

        <div className="flex items-center justify-between mt-2 px-1 gap-2 flex-wrap">
          <p className="text-[clamp(9px,1vw,10px)] text-[var(--vz-accent-muted)]/30 font-mono">
            Enter to send · Shift+Enter for newline
          </p>
          <p className="text-[clamp(9px,1vw,10px)] text-[var(--vz-accent-muted)]/30 font-mono uppercase tracking-wider hidden sm:block">
            {agenticMode} mode
          </p>
        </div>
      </div>
    </div>
  );
}
