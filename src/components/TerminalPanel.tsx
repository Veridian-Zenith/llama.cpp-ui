import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal as TerminalIcon, X, ChevronRight, Trash2 } from 'lucide-react';
import { getTerminalUrl } from '../lib/config';
import { bakedExec } from '../lib/terminal-baked';

interface TerminalLine {
  type: 'input' | 'output' | 'error';
  content: string;
  timestamp: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function TerminalPanel({ isOpen, onClose }: Props) {
  const [lines, setLines] = useState<TerminalLine[]>([
    { type: 'output', content: 'Terminal session started. Type commands below.', timestamp: 0 },
  ]);
  const [input, setInput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const linesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    linesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const runCommand = async (cmd: string) => {
    if (!cmd.trim() || isRunning) return;

    setLines((prev) => [
      ...prev,
      { type: 'input', content: cmd, timestamp: Date.now() },
    ]);
    setInput('');
    setIsRunning(true);

    try {
      const res = await fetch(`${getTerminalUrl()}/exec`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd, shell: 'auto', timeout: 30000 }),
      });

      if (!res.ok) {
        setLines((prev) => [
          ...prev,
          { type: 'error', content: `Server error: ${res.statusText}`, timestamp: Date.now() },
        ]);
        return;
      }

      const data = await res.json();

      if (data.stdout) {
        setLines((prev) => [
          ...prev,
          { type: 'output', content: data.stdout.trimEnd(), timestamp: Date.now() },
        ]);
      }
      if (data.stderr) {
        setLines((prev) => [
          ...prev,
          { type: 'error', content: data.stderr.trimEnd(), timestamp: Date.now() },
        ]);
      }
      if (!data.stdout && !data.stderr) {
        setLines((prev) => [
          ...prev,
          { type: 'output', content: '(no output)', timestamp: Date.now() },
        ]);
      }
    } catch (e) {
      try {
        const baked = await bakedExec(cmd);
        if (baked.stdout) setLines((p) => [...p, { type: 'output', content: baked.stdout!, timestamp: Date.now() }]);
        if (baked.stderr) setLines((p) => [...p, { type: 'error', content: baked.stderr!, timestamp: Date.now() }]);
        if (!baked.stdout && !baked.stderr) setLines((p) => [...p, { type: 'output', content: '(no output — baked)', timestamp: Date.now() }]);
      } catch {
        setLines((prev) => [
          ...prev,
          { type: 'error', content: `Connection failed: ${e}`, timestamp: Date.now() },
        ]);
      }
    } finally {
      setIsRunning(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      runCommand(input);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 350 }}
          exit={{ opacity: 0, y: 20, height: 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className="border-t border-[var(--vz-border-color)] bg-[var(--vz-bg-primary)] flex flex-col overflow-hidden shrink-0"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-[var(--vz-border-color)]/50 bg-[var(--vz-bg-secondary)]/30 shrink-0">
            <div className="flex items-center gap-2">
              <TerminalIcon size={12} className="text-[var(--vz-accent-vibrant)]" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--vz-accent-vibrant)]/70">
                Terminal
              </span>
              {isRunning && (
                <span className="text-[9px] font-mono text-blue-400 animate-pulse">running...</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setLines([])}
                className="p-1 rounded hover:bg-[var(--vz-accent-vibrant)]/10 text-[var(--vz-text-secondary)]/30 hover:text-[var(--vz-accent-vibrant)] transition-colors cursor-pointer"
              >
                <Trash2 size={11} />
              </button>
              <button
                onClick={onClose}
                className="p-1 rounded hover:bg-[var(--vz-accent-vibrant)]/10 text-[var(--vz-text-secondary)]/30 hover:text-[var(--vz-accent-vibrant)] transition-colors cursor-pointer"
              >
                <X size={11} />
              </button>
            </div>
          </div>

          {/* Lines */}
          <div className="flex-1 overflow-y-auto scrollbar-hide p-3 font-mono text-xs space-y-1">
            {lines.map((line, i) => (
              <div key={i} className="leading-relaxed">
                {line.type === 'input' ? (
                  <span className="text-[var(--vz-accent-vibrant)]">
                    <ChevronRight size={10} className="inline mr-1 opacity-50" />
                    {line.content}
                  </span>
                ) : line.type === 'error' ? (
                  <span className="text-red-400/70 whitespace-pre-wrap">{line.content}</span>
                ) : (
                  <span className="text-[var(--vz-text-secondary)]/60 whitespace-pre-wrap">{line.content}</span>
                )}
              </div>
            ))}
            <div ref={linesEndRef} />
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 px-3 py-2 border-t border-[var(--vz-border-color)]/30 shrink-0">
            <ChevronRight size={12} className="text-[var(--vz-accent-vibrant)] shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isRunning ? 'Running...' : 'Enter command...'}
              disabled={isRunning}
              className="flex-1 bg-transparent border-none outline-none font-mono text-xs text-[var(--vz-accent-vibrant)] placeholder:text-[var(--vz-accent-muted)]/20 disabled:opacity-40"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
