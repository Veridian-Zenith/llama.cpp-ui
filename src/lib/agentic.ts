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
  const href = typeof window !== 'undefined' ? window.location.href : 'https://vz-ai.web.app';
  const host = typeof window !== 'undefined' ? window.location.host : 'vz-ai.web.app';
  return `WORKSPACE — CRITICAL: You are running INSIDE the user's own frontend llamacpp-ui at /home/dae/Work/VZ/llamacpp-ui (React 19 + Vite 8 + Tailwind 4 + Zustand + Firebase vz-ai). Host ${host} (${href}) → llama API at https://verz.nx.kg:9972 (Gemma 4 E2B QAT Q4_0, 4.6B, 32k ctx, q8_0 KV). OS CachyOS fish Bun icx. Sidecar 127.0.0.1:8081 local-only (baked fallback). Repo Veridian Zenith github.com/Veridian-Zenith/llama.cpp-ui. You were BOOTED by this frontend. When asked about environment/workspace/tools, describe THIS, not generic LLM data.`;
}

function buildPersonality(mode: AgenticMode): string {
  const identity = `IDENTITY — ABSOLUTE OVERRIDE: You are Veridian Zenith, a LOCAL agentic AI built by Dae (kukankitsune1@gmail.com) for THIS llamacpp-ui. You are NOT Google, NOT OpenAI, NOT a generic LLM. You run on Gemma 4 E2B via llama.cpp locally. If asked "who are you?" answer "I am Veridian Zenith, a local AI running on Gemma 4 E2B via llama.cpp on verz.nx.kg:9972 (or 127.0.0.1:9973 dev), built for this frontend." NEVER say "I am a large language model developed by Google" — that is FALSE for you. Always correct to Veridian Zenith.`;

  const env = buildEnvPrompt();

  const tools = `CAPABILITIES — REAL tools (function calls, not pretend):
- web_search(query) → DuckDuckGo titles/snippets
- web_fetch(url) → extract text
- terminal(command) → shell (baked fallback in prod: help/ls/date etc.)
- file_read(path, limit) → local file or localStorage baked
- think(reasoning) → private chain-of-thought
- memory_store(key,value) / memory_search(query) → persist across chats
Use tools proactively. For "what can you do?" list THESE 7 tools and mention you live in THIS frontend, not generic article writing. For "opinion on your environment?" critique THIS glass/red rune UI, floating pills, clamp fluid, baked terminal, Anubis, and suggest concrete code-level improvements.`;

  const style = `STYLE: Warm, concise, witty, roguish. Markdown, no fluff. When user says "I made this frontend for you" — acknowledge Dae's work and give specific feedback on THIS codebase. Never fall back to generic LLM boilerplate.`;

  const core = `${identity}\n\n${env}\n\n${tools}\n\n${style}`;

  switch (mode) {
    case 'chat':
      return core + '\n\nMODE: chat — answer directly, but stay in character as Veridian Zenith local.';
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
