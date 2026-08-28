import type { ToolCall, ToolResult, SandboxConfig } from './types';
import { DEFAULT_SANDBOX } from './types';
import { webSearch } from './web-search';
import { webFetch } from './web-fetch';
import { terminalExec } from './terminal';
import { getWeather } from './weather';
import { memoryStore } from '../memory';
import { getDiagnostics, getSymbols, formatCode } from '../lsp/client';
import { getLanguageForFile } from '../lsp/servers';
import { profileStore } from '../profile';
import { getTerminalUrl } from '../config';
import { bakedExec } from '../terminal-baked';

export async function executeTool(
  call: ToolCall,
  sandbox: SandboxConfig = DEFAULT_SANDBOX
): Promise<ToolResult> {
  const { name, arguments: args } = call;

  switch (name) {
    case 'web_search':
      return webSearch(args as { query: string; max_results?: number });

    case 'web_fetch':
      return webFetch(args as { url: string; format?: 'text' | 'markdown' | 'html'; max_length?: number });

    case 'terminal':
      return terminalExec(
        args as { command: string; shell?: 'bash' | 'fish' | 'auto'; cwd?: string; timeout?: number },
        sandbox
      );

    case 'file_read':
      return fileRead(args as { path: string; offset?: number; limit?: number }, sandbox);

    case 'file_write':
      return fileWrite(args as { path: string; content: string }, sandbox);

    case 'think':
      return { output: `[Thinking] ${(args as { reasoning: string }).reasoning}` };

    case 'memory_store': {
      const { key, value, category } = args as { key: string; value: string; category?: string };
      const mem = memoryStore.store(key, value, {
        category: (category as any) || 'note',
        source: 'assistant',
      });
      return { output: `Stored under "${mem.key}" [${mem.category}]` };
    }

    case 'memory_retrieve': {
      const { key } = args as { key: string };
      const mem = memoryStore.retrieve(key);
      return mem
        ? { output: `[Memory: ${mem.key} (${mem.category})] ${mem.value}` }
        : { output: `No memory found for key "${key}"` };
    }

    case 'memory_search': {
      const { query, category } = args as { query: string; category?: string };
      let results = memoryStore.search(query);
      if (category) {
        results = results.filter((r) => r.memory.category === category);
      }
      if (results.length === 0) {
        return { output: `No memories found matching "${query}"` };
      }
      const formatted = results
        .slice(0, 10)
        .map((r) => `[${r.memory.category}] ${r.memory.key}: ${r.memory.value}`)
        .join('\n');
      return { output: formatted };
    }

    case 'memory_forget': {
      const { key } = args as { key: string };
      const mem = memoryStore.getByKey(key);
      if (!mem) {
        return { output: `No memory found for key "${key}"` };
      }
      memoryStore.delete(mem.id);
      return { output: `Forgot "${key}"` };
    }

    case 'weather':
      return getWeather(args as { location?: string; format?: 'text' | 'json' });

    case 'get_time': {
      const now = new Date();
      return {
        output: [
          `Local time: ${now.toLocaleTimeString()}`,
          `Date: ${now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`,
          `ISO: ${now.toISOString()}`,
          `Timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`,
        ].join('\n'),
      };
    }

    case 'code_run':
      return codeRun(
        args as { code: string; language?: 'python' | 'javascript' | 'bash'; timeout?: number },
        sandbox
      );

    case 'diagram':
      return generateDiagram(args as { type: string; description: string });

    case 'web_summarize':
      return webSummarize(args as { url: string; max_length?: number });

    case 'code_analyze':
      return codeAnalyze(args as { filename: string; content: string; mode?: string });

    case 'profile_manage':
      return profileManage(args as { action: string; value?: string });

    case 'memory_manage':
      return memoryManage(args as { action: string });

    default:
      return { output: '', error: `Unknown tool: ${name}` };
  }
}

async function fileRead(
  args: { path: string; offset?: number; limit?: number },
  sandbox: SandboxConfig
): Promise<ToolResult> {
  const { path, offset = 0, limit = 200 } = args;

  if (sandbox.enabled) {
    if (path.includes('..') || path.startsWith('/etc') || path.startsWith('/root')) {
      return { output: '', error: 'File access blocked by sandbox' };
    }
  }

  try {
    const res = await fetch(`${getTerminalUrl()}/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, offset, limit }),
    });

    if (!res.ok) {
      return { output: '', error: `Failed to read file: ${res.statusText}` };
    }

    const data = await res.json();
    return { output: data.content || '(empty file)' };
  } catch {
    try {
      const stored = localStorage.getItem(`vz-file:${path}`);
      if (stored !== null) {
        const lines = stored.split('\n');
        return { output: lines.slice(offset, offset + limit).join('\n') || '(empty file)' };
      }
    } catch {}
    return { output: '', error: 'File read: sidecar not available in static hosting (try local dev). Baked fallback checked localStorage.' };
  }
}

async function fileWrite(
  args: { path: string; content: string },
  sandbox: SandboxConfig
): Promise<ToolResult> {
  const { path, content } = args;

  if (sandbox.enabled) {
    if (path.includes('..') || path.startsWith('/etc') || path.startsWith('/root')) {
      return { output: '', error: 'File write blocked by sandbox' };
    }
  }

  try {
    const res = await fetch(`${getTerminalUrl()}/write`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, content }),
    });

    if (!res.ok) {
      return { output: '', error: `Failed to write file: ${res.statusText}` };
    }

    const data = await res.json();
    return { output: data.message || `Written to ${path}` };
  } catch {
    try {
      localStorage.setItem(`vz-file:${path}`, content);
      return { output: `Baked: stored ${content.length} chars to ${path} (localStorage, static hosting)` };
    } catch {
      return { output: '', error: 'File write: sidecar not available in static hosting' };
    }
  }
}

async function codeRun(
  args: { code: string; language?: 'python' | 'javascript' | 'bash'; timeout?: number },
  sandbox: SandboxConfig
): Promise<ToolResult> {
  const { code, language = 'python', timeout = 15000 } = args;

  if (sandbox.enabled) {
    const blocked = ['rm ', 'mkfs', ':(){', 'dd if=', 'curl ', 'wget ', 'nc ', '/etc/', '/root/'];
    if (blocked.some((b) => code.includes(b))) {
      return { output: '', error: 'Code contains blocked commands in sandbox mode' };
    }
  }

  let command: string;
  switch (language) {
    case 'python':
      command = `python3 -c ${JSON.stringify(code)}`;
      break;
    case 'javascript':
      command = `bun eval ${JSON.stringify(code)}`;
      break;
    case 'bash':
      command = code;
      break;
    default:
      return { output: '', error: `Unsupported language: ${language}` };
  }

  try {
    const res = await fetch(`${getTerminalUrl()}/exec`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command, shell: 'fish', timeout }),
    });

    if (!res.ok) {
      return { output: '', error: `Code execution failed: ${res.statusText}` };
    }

    const data = await res.json();
    const parts: string[] = [];
    if (data.stdout) parts.push(data.stdout.trimEnd());
    if (data.stderr) parts.push(`[stderr]\n${data.stderr.trimEnd()}`);
    if (data.exitCode !== undefined && data.exitCode !== 0) {
      parts.push(`[exit code: ${data.exitCode}]`);
    }
    return { output: parts.join('\n') || '(no output)' };
  } catch {
    const baked = await bakedExec(command);
    const parts: string[] = [];
    if (baked.stdout) parts.push(baked.stdout);
    if (baked.stderr) parts.push(baked.stderr);
    return { output: parts.join('\n') || '(no output)', error: baked.exit_code !== 0 ? baked.stderr : undefined };
  }
}

function generateDiagram(args: { type: string; description: string }): ToolResult {
  const { type, description } = args;

  let mermaid = '';
  switch (type) {
    case 'flowchart':
      mermaid = `graph TD\n    A[${description.split(' ').slice(0, 5).join(' ')}] --> B[Step 2]\n    B --> C[Step 3]\n    C --> D[Result]`;
      break;
    case 'sequence':
      mermaid = `sequenceDiagram\n    participant User\n    participant AI\n    participant Tools\n    User->>AI: Request\n    AI->>Tools: Call tool\n    Tools-->>AI: Result\n    AI-->>User: Response`;
      break;
    case 'class':
      mermaid = `classDiagram\n    class Agent {\n        +tools[]\n        +memory\n        +execute()\n    }\n    class Tool {\n        +name\n        +run()\n    }\n    Agent --> Tool`;
      break;
    case 'state':
      mermaid = `stateDiagram-v2\n    [*] --> Idle\n    Idle --> Processing: Send message\n    Processing --> Streaming: Response\n    Streaming --> Idle: Complete`;
      break;
    case 'er':
      mermaid = `erDiagram\n    USER ||--o{ CHAT : has\n    CHAT ||--|{ MESSAGE : contains\n    USER ||--o{ MEMORY : stores`;
      break;
    case 'gantt':
      mermaid = `gantt\n    title Task Timeline\n    section Research\n    Web Search :a1, 2024-01-01, 1d\n    Analysis :a2, after a1, 2d\n    section Execution\n    Implementation :a3, after a2, 3d`;
      break;
    case 'pie':
      mermaid = `pie\n    title Resource Usage\n    "Prompt" : 40\n    "Generation" : 30\n    "Cache" : 20\n    "Other" : 10`;
      break;
    default:
      return { output: '', error: `Unknown diagram type: ${type}` };
  }

  return {
    output: `Mermaid diagram (${type}):\n\`\`\`mermaid\n${mermaid}\n\`\`\`\n\nDescription: ${description}`,
  };
}

async function webSummarize(args: { url: string; max_length?: number }): Promise<ToolResult> {
  const { url, max_length = 2000 } = args;

  try {
    const res = await fetch(`${getTerminalUrl()}/fetch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });

    if (!res.ok) {
      return { output: '', error: `Failed to fetch URL: ${res.statusText}` };
    }

    const data = await res.json();
    let content = data.content || data.text || '';

    if (content.length > max_length) {
      content = content.slice(0, max_length) + '\n\n[truncated]';
    }

    return { output: content };
  } catch {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!r.ok) return { output: '', error: `Fetch failed: ${r.status}` };
      let txt = await r.text();
      if (txt.length > max_length) txt = txt.slice(0, max_length) + '\n[truncated]';
      return { output: txt };
    } catch (e) {
      return { output: '', error: `Failed to fetch URL (baked fallback): ${e}` };
    }
  }
}

async function codeAnalyze(args: {
  filename: string;
  content: string;
  mode?: string;
}): Promise<ToolResult> {
  const { filename, content, mode = 'all' } = args;
  const language = getLanguageForFile(filename);

  if (!language) {
    return { output: '', error: `Unsupported file type: ${filename}` };
  }

  const parts: string[] = [];
  parts.push(`Language: ${language}`);
  parts.push(`File: ${filename}`);
  parts.push('');

  if (mode === 'diagnostics' || mode === 'all') {
    const diagnostics = await getDiagnostics(filename, content);
    if (diagnostics.length === 0) {
      parts.push('Diagnostics: No issues found');
    } else {
      parts.push(`Diagnostics (${diagnostics.length} issues):`);
      for (const d of diagnostics.slice(0, 20)) {
        const sev = d.severity === 1 ? 'ERROR' : d.severity === 2 ? 'WARNING' : d.severity === 3 ? 'INFO' : 'HINT';
        const line = d.range.start.line + 1;
        parts.push(`  [${sev}] Line ${line}: ${d.message} (${d.source})`);
      }
    }
    parts.push('');
  }

  if (mode === 'symbols' || mode === 'all') {
    const symbols = await getSymbols(filename, content);
    if (symbols.length === 0) {
      parts.push('Symbols: None found');
    } else {
      parts.push(`Symbols (${symbols.length}):`);
      const kindMap: Record<number, string> = {
        1: 'File', 2: 'Module', 3: 'Namespace', 4: 'Package', 5: 'Class',
        6: 'Method', 7: 'Property', 8: 'Field', 9: 'Constructor', 10: 'Enum',
        11: 'Interface', 12: 'Function', 13: 'Variable', 14: 'Constant',
      };
      for (const s of symbols.slice(0, 30)) {
        const kind = kindMap[s.kind] || 'Symbol';
        const line = s.location.range.start.line + 1;
        parts.push(`  [${kind}] ${s.name} (line ${line})`);
      }
    }
    parts.push('');
  }

  if (mode === 'format' || mode === 'all') {
    const formatted = await formatCode(filename, content);
    if (formatted) {
      parts.push('Formatted code:');
      parts.push(formatted.slice(0, 3000));
    } else {
      parts.push('Formatting: Not available for this language');
    }
  }

  return { output: parts.join('\n') };
}

function profileManage(args: { action: string; value?: string }): ToolResult {
  const { action, value } = args;
  const profile = profileStore.get();

  switch (action) {
    case 'get': {
      const parts = [
        `Name: ${profile.name}`,
        `Persona: ${profile.persona || '(none)'}`,
        `Language: ${profile.preferredLanguage}`,
        `Interests: ${profile.interests.length > 0 ? profile.interests.join(', ') : '(none)'}`,
      ];
      return { output: parts.join('\n') };
    }
    case 'set_name': {
      if (!value) return { output: '', error: 'Value required' };
      profileStore.update({ name: value });
      return { output: `Name updated to "${value}"` };
    }
    case 'add_interest': {
      if (!value) return { output: '', error: 'Value required' };
      if (profile.interests.includes(value)) return { output: `"${value}" already in interests` };
      profileStore.update({ interests: [...profile.interests, value] });
      return { output: `Added "${value}" to interests` };
    }
    case 'remove_interest': {
      if (!value) return { output: '', error: 'Value required' };
      const filtered = profile.interests.filter((i) => i !== value);
      if (filtered.length === profile.interests.length) return { output: `"${value}" not found in interests` };
      profileStore.update({ interests: filtered });
      return { output: `Removed "${value}" from interests` };
    }
    case 'set_persona': {
      if (!value) return { output: '', error: 'Value required' };
      profileStore.update({ persona: value });
      return { output: `Persona updated` };
    }
    case 'set_language': {
      if (!value) return { output: '', error: 'Value required' };
      profileStore.update({ preferredLanguage: value });
      return { output: `Language set to "${value}"` };
    }
    default:
      return { output: '', error: `Unknown profile action: ${action}` };
  }
}

function memoryManage(args: { action: string }): ToolResult {
  const { action } = args;

  switch (action) {
    case 'list': {
      const all = memoryStore.getAll();
      if (all.length === 0) return { output: 'No memories stored.' };
      const formatted = all.map((m) => `[${m.category}] ${m.key}: ${m.value}`).join('\n');
      return { output: `${all.length} memories:\n${formatted}` };
    }
    case 'stats': {
      const all = memoryStore.getAll();
      const byCategory: Record<string, number> = {};
      for (const m of all) {
        byCategory[m.category] = (byCategory[m.category] || 0) + 1;
      }
      const parts = [
        `Total memories: ${all.length}`,
        `By category:`,
        ...Object.entries(byCategory).map(([cat, count]) => `  ${cat}: ${count}`),
      ];
      return { output: parts.join('\n') };
    }
    case 'export': {
      return { output: memoryStore.exportAll().slice(0, 5000) };
    }
    case 'clear': {
      memoryStore.clear();
      return { output: 'All memories cleared.' };
    }
    default:
      return { output: '', error: `Unknown memory action: ${action}` };
  }
}
