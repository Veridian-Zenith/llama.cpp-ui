export interface ThinkingBlock {
  type: 'thinking' | 'text';
  content: string;
}

export interface ParsedMessage {
  thinking: string;
  text: string;
  blocks: ThinkingBlock[];
}

const THINKING_PATTERNS = [
  /<think>([\s\S]*?)<\/think>/gi,
  /\[think\]([\s\S]*?)\[\/think\]/gi,
  /\[\[thinking\]\]([\s\S]*?)\[\[\/thinking\]\]/gi,
  /:::thinking([\s\S]*?):::/gi,
];

export function parseThinking(content: string): ParsedMessage {
  const blocks: ThinkingBlock[] = [];
  let thinking = '';
  let text = content;

  for (const pattern of THINKING_PATTERNS) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      thinking += match[1].trim() + '\n';
    }
  }

  let remaining = content;
  for (const pattern of THINKING_PATTERNS) {
    remaining = remaining.replace(pattern, '');
  }

  text = remaining.trim();

  if (thinking) {
    blocks.push({ type: 'thinking', content: thinking.trim() });
  }
  if (text) {
    blocks.push({ type: 'text', content: text });
  }

  return {
    thinking: thinking.trim(),
    text,
    blocks,
  };
}

export function hasThinkingTags(content: string): boolean {
  return THINKING_PATTERNS.some((p) => {
    p.lastIndex = 0;
    return p.test(content);
  });
}
