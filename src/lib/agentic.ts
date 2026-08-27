import { TOOL_DEFINITIONS, type ToolDefinition } from './tools/types';

export type AgenticMode = 'chat' | 'auto' | 'manual' | 'plan';

export interface AgentConfig {
  mode: AgenticMode;
  maxToolCalls: number;
  systemPromptExtensions: string[];
  serverCapabilities?: {
    supportsMiRoC: boolean;
    supportsNativeTools: boolean;
    supportsGrammar: boolean;
    supportsCaching: boolean;
  } | null;
}

function buildToolGuide(): string {
  const lines: string[] = ['# Tools', 'Call tools with ```tool JSON blocks. One per block.'];
  lines.push('');

  for (const tool of TOOL_DEFINITIONS) {
    const params = Object.entries(tool.parameters)
      .map(([n, p]) => `${n}${p.required ? '*' : ''}`)
      .join(', ');
    lines.push(`- ${tool.name}: ${tool.description.split('.')[0]}. Params: ${params || 'none'}`);
  }

  return lines.join('\n');
}

function buildPersonality(mode: AgenticMode): string {
  const core = `You are a capable AI agent running locally via llama.cpp with real tools (web, terminal, files, memory, code analysis). You are NOT a generic chatbot.

Personality: Warm, witty, direct. Use humor naturally. Have opinions. Use markdown. Be curious about the user's work. Mention when you'll remember something. Reference running locally when relevant.

Core rules: Always use tools when they'd give better answers than guessing. Never hallucinate facts — search. Do tasks, don't just describe how. Chain tool calls for complex tasks. Be concise but thorough.`;

  switch (mode) {
    case 'chat':
      return core + '\n\nMode: Conversational. Answer directly, keep it natural.';
    case 'auto':
      return core + '\n\nMode: Autonomous. Use all tools freely without hesitation. Get things done.';
    case 'manual':
      return core + '\n\nMode: Supervised. Output tool calls for user approval before execution.';
    case 'plan':
      return core + '\n\nMode: Plan first, then execute. Outline steps, get approval, then act.';
    default:
      return core;
  }
}

export function buildToolingSystemPrompt(config: AgentConfig): string {
  const sections: string[] = [];
  sections.push(buildPersonality(config.mode));
  sections.push(buildToolGuide());

  if (config.serverCapabilities) {
    const caps = config.serverCapabilities;
    const feats = [];
    if (caps.supportsMiRoC) feats.push('MiRoC');
    if (caps.supportsNativeTools) feats.push('NativeTools');
    if (caps.supportsGrammar) feats.push('Grammar');
    if (feats.length) sections.push(`Server: ${feats.join(', ')}`);
  }

  if (config.systemPromptExtensions.length > 0) {
    for (const ext of config.systemPromptExtensions) sections.push(ext);
  }

  return sections.join('\n');
}

export function getToolsForMode(mode: AgenticMode): ToolDefinition[] {
  switch (mode) {
    case 'chat':
      return [];
    case 'auto':
    case 'manual':
      return TOOL_DEFINITIONS;
    case 'plan':
      return TOOL_DEFINITIONS.filter((t) => ['search', 'web', 'util'].includes(t.category));
  }
}
