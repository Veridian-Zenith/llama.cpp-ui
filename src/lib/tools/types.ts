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
    description: 'Search the web using DuckDuckGo. Returns titles, URLs, and snippets.',
    category: 'search',
    requiresApproval: false,
    sandboxed: false,
    parameters: {
      query: { type: 'string', description: 'Search query', required: true },
      max_results: { type: 'number', description: 'Max results (1-20)', default: 5 },
    },
  },
  {
    name: 'web_fetch',
    description: 'Fetch and extract text content from a URL.',
    category: 'web',
    requiresApproval: false,
    sandboxed: false,
    parameters: {
      url: { type: 'string', description: 'URL to fetch', required: true },
      format: { type: 'string', description: 'Output format', enum: ['text', 'markdown', 'html'], default: 'text' },
      max_length: { type: 'number', description: 'Max characters', default: 10000 },
    },
  },
  {
    name: 'terminal',
    description: 'Execute a shell command (bash or fish).',
    category: 'terminal',
    requiresApproval: true,
    sandboxed: true,
    parameters: {
      command: { type: 'string', description: 'Shell command to execute', required: true },
      shell: { type: 'string', description: 'Shell type', enum: ['bash', 'fish', 'auto'], default: 'auto' },
      cwd: { type: 'string', description: 'Working directory' },
      timeout: { type: 'number', description: 'Timeout in ms', default: 30000 },
    },
  },
  {
    name: 'file_read',
    description: 'Read a file from the local filesystem.',
    category: 'file',
    requiresApproval: true,
    sandboxed: true,
    parameters: {
      path: { type: 'string', description: 'File path', required: true },
      offset: { type: 'number', description: 'Line offset', default: 0 },
      limit: { type: 'number', description: 'Max lines', default: 200 },
    },
  },
  {
    name: 'file_write',
    description: 'Write content to a file.',
    category: 'file',
    requiresApproval: true,
    sandboxed: true,
    parameters: {
      path: { type: 'string', description: 'File path', required: true },
      content: { type: 'string', description: 'Content to write', required: true },
    },
  },
  {
    name: 'think',
    description: 'Internal reasoning. Use this to think through problems step by step before answering.',
    category: 'util',
    requiresApproval: false,
    sandboxed: false,
    parameters: {
      reasoning: { type: 'string', description: 'Your internal reasoning', required: true },
    },
  },
  {
    name: 'memory_store',
    description: 'Store information for later retrieval. Persists across conversations.',
    category: 'util',
    requiresApproval: false,
    sandboxed: false,
    parameters: {
      key: { type: 'string', description: 'Memory key (short identifier)', required: true },
      value: { type: 'string', description: 'Value to store', required: true },
      category: { type: 'string', description: 'Memory category', enum: ['fact', 'preference', 'person', 'project', 'note', 'skill', 'context'], default: 'note' },
    },
  },
  {
    name: 'memory_retrieve',
    description: 'Retrieve previously stored information by key.',
    category: 'util',
    requiresApproval: false,
    sandboxed: false,
    parameters: {
      key: { type: 'string', description: 'Memory key to retrieve', required: true },
    },
  },
  {
    name: 'memory_search',
    description: 'Search across all stored memories by query. Returns ranked results.',
    category: 'util',
    requiresApproval: false,
    sandboxed: false,
    parameters: {
      query: { type: 'string', description: 'Search query', required: true },
      category: { type: 'string', description: 'Filter by category', enum: ['fact', 'preference', 'person', 'project', 'note', 'skill', 'context'] },
    },
  },
  {
    name: 'memory_forget',
    description: 'Delete a stored memory by key.',
    category: 'util',
    requiresApproval: false,
    sandboxed: false,
    parameters: {
      key: { type: 'string', description: 'Memory key to forget', required: true },
    },
  },
  {
    name: 'weather',
    description: 'Get current weather for a location using wttr.in. Uses lat/long or city name.',
    category: 'util',
    requiresApproval: false,
    sandboxed: false,
    parameters: {
      location: { type: 'string', description: 'City name or lat,lon coordinates (e.g. "London" or "37.7749,-122.4194")' },
      format: { type: 'string', description: 'Output format', enum: ['text', 'json'], default: 'text' },
    },
  },
  {
    name: 'get_time',
    description: 'Get the current local date and time.',
    category: 'util',
    requiresApproval: false,
    sandboxed: false,
    parameters: {},
  },
  {
    name: 'code_run',
    description: 'Run code in a sandboxed environment. Supports Python 3 and Node.js/Bun. Output includes stdout, stderr, and exit code.',
    category: 'terminal',
    requiresApproval: true,
    sandboxed: true,
    parameters: {
      code: { type: 'string', description: 'Code to execute', required: true },
      language: { type: 'string', description: 'Programming language', enum: ['python', 'javascript', 'bash'], default: 'python' },
      timeout: { type: 'number', description: 'Timeout in milliseconds', default: 15000 },
    },
  },
  {
    name: 'diagram',
    description: 'Generate a Mermaid diagram. Returns the diagram source code that can be rendered.',
    category: 'util',
    requiresApproval: false,
    sandboxed: false,
    parameters: {
      type: { type: 'string', description: 'Diagram type', enum: ['flowchart', 'sequence', 'class', 'state', 'er', 'gantt', 'pie'], required: true },
      description: { type: 'string', description: 'Natural language description of what the diagram should show', required: true },
    },
  },
  {
    name: 'web_summarize',
    description: 'Fetch a URL and return a concise summary of its content.',
    category: 'web',
    requiresApproval: false,
    sandboxed: false,
    parameters: {
      url: { type: 'string', description: 'URL to summarize', required: true },
      max_length: { type: 'number', description: 'Max summary length in characters', default: 2000 },
    },
  },
  {
    name: 'code_analyze',
    description: 'Analyze code for errors, warnings, and symbols using LSP. Supports TypeScript, Python, C/C++, Rust, Go, Kotlin, Elixir, and more.',
    category: 'file',
    requiresApproval: false,
    sandboxed: false,
    parameters: {
      filename: { type: 'string', description: 'File path (used to detect language)', required: true },
      content: { type: 'string', description: 'Code content to analyze', required: true },
      mode: { type: 'string', description: 'Analysis mode', enum: ['diagnostics', 'symbols', 'format', 'all'], default: 'all' },
    },
  },
  {
    name: 'profile_manage',
    description: 'Manage the user profile: name, interests, persona, language preference. This persists across conversations.',
    category: 'util',
    requiresApproval: false,
    sandboxed: false,
    parameters: {
      action: { type: 'string', description: 'What to do', enum: ['get', 'set_name', 'add_interest', 'remove_interest', 'set_persona', 'set_language'], required: true },
      value: { type: 'string', description: 'The value to set or the interest to add/remove' },
    },
  },
  {
    name: 'memory_manage',
    description: 'Advanced memory operations: list all memories, get stats, export, or clear memories.',
    category: 'util',
    requiresApproval: false,
    sandboxed: false,
    parameters: {
      action: { type: 'string', description: 'Operation', enum: ['list', 'stats', 'export', 'clear'], required: true },
    },
  },
];

export function getToolByName(name: string): ToolDefinition | undefined {
  return TOOL_DEFINITIONS.find((t) => t.name === name);
}

export function getToolsByCategory(category: ToolDefinition['category']): ToolDefinition[] {
  return TOOL_DEFINITIONS.filter((t) => t.category === category);
}
