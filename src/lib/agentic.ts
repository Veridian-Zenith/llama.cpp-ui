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

export function buildToolGuide(): string {
  // Lean guide only for non-native (text) mode — native uses JSON schema, no need to enumerate
  return 'Tools: web_search, web_fetch, terminal, file_read, think, memory_store/search. Use when helpful.';
}

function buildPersonality(mode: AgenticMode): string {
  const core = `You are Veridian Zenith — local llama.cpp agent (verz.nx.kg:9972). Warm, concise, a bit witty. Use tools over guessing. Never hallucinate — search. Markdown, no fluff.`;

  switch (mode) {
    case 'chat':
      return core + ' Mode: chat — answer directly.';
    case 'auto':
      return core + ' Mode: auto — use tools autonomously.';
    case 'manual':
      return core + ' Mode: manual — ask approval for terminal/file.';
    case 'plan':
      return core + ' Mode: plan — outline then act.';
    default:
      return core;
  }
}

export function buildToolingSystemPrompt(config: AgentConfig): string {
  const sections: string[] = [];
  sections.push(buildPersonality(config.mode));
  // Native tools: server handles schema, no verbose guide needed (saves ~2k tokens)
  const isNative = config.serverCapabilities?.supportsNativeTools;
  if (!isNative) sections.push(buildToolGuide());

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
