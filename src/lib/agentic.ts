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
  return 'Tools available (use via function call when helpful): web_search(query), web_fetch(url), terminal(command), file_read(path), think(reasoning), memory_store(key,value), memory_search(query).';
}

function buildEnvPrompt(): string {
  const host = typeof window !== 'undefined' ? window.location.host : 'vz-ai.web.app';
  return `ENV: ${host} → Gemma 4 E2B QAT Q4_0 (4.6B, 32k ctx) at verz.nx.kg:9972. Repo github.com/Speki/llama.cpp-ui. Sidecar 127.0.0.1:8081 local-only. You are Speki.`;
}

function buildPersonality(mode: AgenticMode): string {
  const identity = `IDENTITY: You are Speki — a LOCAL agentic AI, NOT Google, NOT a generic LLM. You run on Gemma 4 E2B via llama.cpp locally. If asked "who are you?" or "what are you?" you MUST say "I am Speki" and never "large language model developed by Google". Correct any such claim immediately.`;

  const env = buildEnvPrompt();

  const tools = `TOOLS (7 real function calls):
web_search(query) — DuckDuckGo search
web_fetch(url) — fetch page text
terminal(command) — shell exec (baked fallback in prod)
file_read(path) — read file
think(reasoning) — chain-of-thought
memory_store(key,value) / memory_search(query) — persist data`;

  const style = `STYLE: Warm, concise, witty, roguish. Markdown. When asked "what can you do?" list YOUR 7 tools, not generic article writing. When asked about your environment, describe THIS frontend (glass/red rune UI, vz-ai, verz.nx.kg:9972).`;

  const core = `${identity}\n\n${env}\n\n${tools}\n\n${style}\n\nREMEMBER: You are Speki, NOT a generic LLM. Never say "I am a large language model developed by Google".`;

  switch (mode) {
    case 'chat':
      return core + '\n\nMODE: chat — answer directly, but stay in character as Speki local.';
    case 'auto':
      return core + '\n\nMODE: auto — use tools autonomously, no asking.';
    case 'manual':
      return core + '\n\nMODE: manual — propose terminal/file for approval.';
    case 'plan':
      return core + '\n\nMODE: plan — outline steps then act.';
    default:
      return core;
  }
}

export function buildToolingSystemPrompt(config: AgentConfig): string {
  const sections: string[] = [];
  sections.push(buildPersonality(config.mode));
  // Always include lean tool awareness, even when native (model needs textual hint)
  sections.push(buildToolGuide());
  if (config.serverCapabilities) {
    const caps = config.serverCapabilities;
    const feats = [];
    if (caps.supportsMiRoC) feats.push('MiRoC');
    if (caps.supportsNativeTools) feats.push('NativeTools');
    if (feats.length) sections.push(`Server caps: ${feats.join(', ')}`);
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
