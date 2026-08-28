export interface ToolParameter {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required?: boolean;
  enum?: string[];
  default?: unknown;
  items?: { type: string };
  properties?: Record<string, ToolParameter>;
}

export interface ToolDefinition {
  name: string;
  description: string;
  category: 'search' | 'web' | 'terminal' | 'file' | 'util';
  parameters: Record<string, ToolParameter>;
  requiresApproval: boolean;
  sandboxed: boolean;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  status: 'pending' | 'approved' | 'denied' | 'running' | 'completed' | 'error';
  result?: string;
  error?: string;
  startTime?: number;
  endTime?: number;
}

export interface ToolResult {
  output: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface SandboxConfig {
  enabled: boolean;
  allowedDomains: string[];
  blockedCommands: string[];
  maxOutputLength: number;
  timeoutMs: number;
}

export const DEFAULT_SANDBOX: SandboxConfig = {
  enabled: true,
  allowedDomains: [],
  blockedCommands: ['rm -rf /', 'mkfs', ':(){ :|:& };:', 'dd if=/dev/zero'],
  maxOutputLength: 50000,
  timeoutMs: 30000,
};

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    name: 'web_search',
    description: 'Search DuckDuckGo (titles+snippets).',
    category: 'search',
    requiresApproval: false,
    sandboxed: false,
    parameters: {
      query: { type: 'string', description: 'Query', required: true },
      max_results: { type: 'number', description: 'Max 1-10', default: 5 },
    },
  },
  {
    name: 'web_fetch',
    description: 'Fetch URL text.',
    category: 'web',
    requiresApproval: false,
    sandboxed: false,
    parameters: {
      url: { type: 'string', description: 'URL', required: true },
      max_length: { type: 'number', description: 'Max chars', default: 8000 },
    },
  },
  {
    name: 'terminal',
    description: 'Run shell command (baked fallback in prod).',
    category: 'terminal',
    requiresApproval: true,
    sandboxed: true,
    parameters: {
      command: { type: 'string', description: 'Command', required: true },
      timeout: { type: 'number', description: 'Timeout ms', default: 20000 },
    },
  },
  {
    name: 'file_read',
    description: 'Read local file (local dev) or baked localStorage.',
    category: 'file',
    requiresApproval: false,
    sandboxed: true,
    parameters: {
      path: { type: 'string', description: 'Path', required: true },
      limit: { type: 'number', description: 'Lines', default: 120 },
    },
  },
  {
    name: 'think',
    description: 'Private chain-of-thought before answering.',
    category: 'util',
    requiresApproval: false,
    sandboxed: false,
    parameters: {
      reasoning: { type: 'string', description: 'Thought', required: true },
    },
  },
  {
    name: 'memory_store',
    description: 'Persist fact across chats.',
    category: 'util',
    requiresApproval: false,
    sandboxed: false,
    parameters: {
      key: { type: 'string', description: 'Key', required: true },
      value: { type: 'string', description: 'Value', required: true },
    },
  },
  {
    name: 'memory_search',
    description: 'Search memories.',
    category: 'util',
    requiresApproval: false,
    sandboxed: false,
    parameters: {
      query: { type: 'string', description: 'Query', required: true },
    },
  },
];

export function getToolByName(name: string): ToolDefinition | undefined {
  return TOOL_DEFINITIONS.find((t) => t.name === name);
}

export function getToolsByCategory(category: ToolDefinition['category']): ToolDefinition[] {
  return TOOL_DEFINITIONS.filter((t) => t.category === category);
}
