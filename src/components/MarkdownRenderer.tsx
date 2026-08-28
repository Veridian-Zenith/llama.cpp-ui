import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, ChevronDown, Brain } from 'lucide-react';
import { parseThinking, type ThinkingBlock } from '../lib/thinking-parser';
import 'highlight.js/styles/github-dark.css';

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="absolute top-2 right-2 p-1.5 rounded-md bg-[var(--vz-bg-secondary)]/80 border border-[var(--vz-border-color)] text-[var(--vz-text-secondary)]/50 hover:text-[var(--vz-accent-vibrant)] hover:border-[var(--vz-accent-vibrant)]/30 transition-all cursor-pointer opacity-0 group-hover:opacity-100"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
    </button>
  );
}

function ThinkingBlock({ block }: { block: ThinkingBlock }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="my-2 rounded-xl border border-purple-500/20 bg-purple-500/5 overflow-hidden"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left cursor-pointer hover:bg-purple-500/5 transition-colors"
      >
        <Brain size={14} className="text-purple-400 shrink-0" />
        <span className="text-[11px] font-mono uppercase tracking-wider text-purple-400/80">
          Thinking
        </span>
        <motion.div
          animate={{ rotate: expanded ? 0 : -90 }}
          transition={{ duration: 0.2 }}
          className="ml-auto"
        >
          <ChevronDown size={12} className="text-purple-400/50" />
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
            <div className="px-3 pb-3 text-xs font-mono text-purple-300/60 whitespace-pre-wrap leading-relaxed border-t border-purple-500/10 pt-2">
              {block.content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function MarkdownRenderer({ content }: { content: string }) {
  const parsed = parseThinking(content);

  return (
    <div className="space-y-2">
      {parsed.blocks.map((block, i) => {
        if (block.type === 'thinking') {
          return <ThinkingBlock key={i} block={block} />;
        }

        return (
          <div
            key={i}
            className="prose prose-invert prose-sm max-w-none
              prose-p:text-[var(--vz-text-secondary)] prose-p:leading-[1.7] prose-p:my-2
              prose-headings:text-[var(--vz-text-secondary)] prose-headings:font-black prose-headings:tracking-tight
              prose-h1:text-[clamp(18px,2vw,20px)] prose-h1:mb-2 prose-h2:text-[clamp(16px,1.8vw,18px)] prose-h3:text-[clamp(14px,1.5vw,16px)]
              prose-a:text-[var(--vz-accent-vibrant)] prose-a:underline decoration-[var(--vz-accent-vibrant)]/30 underline-offset-4 hover:decoration-[var(--vz-accent-vibrant)] prose-a:transition-colors
              prose-strong:text-[var(--vz-text-secondary)] prose-strong:font-bold
              prose-em:text-[var(--vz-text-secondary)]/80 prose-em:italic
              prose-code:text-[var(--vz-accent-vibrant)] prose-code:bg-[var(--vz-bg-tertiary)] prose-code:border prose-code:border-[var(--vz-border-color)]/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-[11px] prose-code:font-mono prose-code:font-medium prose-code:before:content-none prose-code:after:content-none
              prose-pre:bg-[var(--vz-bg-tertiary)] prose-pre:border prose-pre:border-[var(--vz-border-color)]/50 prose-pre:rounded-xl prose-pre:shadow-[0_0_20px_rgba(0,0,0,0.3)] prose-pre:my-3
              prose-blockquote:border-l-2 prose-blockquote:border-[var(--vz-accent-vibrant)]/40 prose-blockquote:bg-[var(--vz-accent-vibrant)]/[0.03] prose-blockquote:py-2 prose-blockquote:px-3 prose-blockquote:rounded-r-lg prose-blockquote:text-[var(--vz-text-secondary)]/70 prose-blockquote:italic prose-blockquote:my-2
              prose-ul:my-2 prose-ol:my-2 prose-li:text-[var(--vz-text-secondary)] prose-li:my-0.5 prose-li:marker:text-[var(--vz-accent-vibrant)]/50
              prose-table:border prose-table:border-[var(--vz-border-color)]/50 prose-table:rounded-lg prose-table:overflow-hidden prose-table:my-3
              prose-th:bg-[var(--vz-bg-tertiary)] prose-th:text-[var(--vz-accent-vibrant)]/80 prose-th:text-[11px] prose-th:font-bold prose-th:uppercase prose-th:tracking-wider prose-th:px-3 prose-th:py-2
              prose-td:text-[var(--vz-text-secondary)] prose-td:text-xs prose-td:px-3 prose-td:py-1.5 prose-td:border-t prose-td:border-[var(--vz-border-color)]/30
              prose-hr:border-[var(--vz-border-color)]/30 prose-hr:my-4
              prose-img:rounded-xl prose-img:border prose-img:border-[var(--vz-border-color)]/30 prose-img:shadow-lg"
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight, rehypeRaw]}
              components={{
                pre: ({ children, ...props }) => {
                  const codeChild = React.Children.toArray(children).find(
                    (child) => React.isValidElement(child) && child.type === 'code'
                  ) as React.ReactElement<{ className?: string; children?: React.ReactNode }> | undefined;

                  let codeText = '';
                  if (codeChild?.props?.children) {
                    codeText = String(codeChild.props.children).trimEnd();
                  }

                  return (
                    <div className="relative group">
                      {codeChild?.props?.className?.includes('language-') && (
                        <div className="absolute top-0 left-0 px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider text-[var(--vz-accent-vibrant)]/50 bg-[var(--vz-accent-vibrant)]/5 rounded-br-lg border-b border-r border-[var(--vz-border-color)]">
                          {codeChild.props.className.replace('language-', '')}
                        </div>
                      )}
                      <CopyButton text={codeText} />
                      <pre {...props}>{children}</pre>
                    </div>
                  );
                },
                code: ({ className, children, ...props }) => {
                  const isInline = !className;
                  if (isInline) {
                    return (
                      <code className="bg-[var(--vz-bg-secondary)] border border-[var(--vz-border-color)] px-1.5 py-0.5 rounded text-[var(--vz-accent-vibrant)] text-xs font-mono" {...props}>
                        {children}
                      </code>
                    );
                  }
                  return (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {block.content}
            </ReactMarkdown>
          </div>
        );
      })}
    </div>
  );
}
