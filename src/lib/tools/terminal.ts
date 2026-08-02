import type { ToolResult, SandboxConfig } from './types';

const TERMINAL_SERVER = 'http://127.0.0.1:8081';

export async function terminalExec(args: {
  command: string;
  shell?: 'bash' | 'fish' | 'auto';
  cwd?: string;
  timeout?: number;
}, sandbox: SandboxConfig): Promise<ToolResult> {
  const { command, shell = 'auto', cwd, timeout = 30000 } = args;

  if (sandbox.enabled) {
    for (const blocked of sandbox.blockedCommands) {
      if (command.includes(blocked)) {
        return {
          output: '',
          error: `Command blocked by sandbox: matches "${blocked}"`,
        };
      }
    }
  }

  try {
    const res = await fetch(`${TERMINAL_SERVER}/exec`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command, shell, cwd, timeout }),
      signal: AbortSignal.timeout(timeout + 5000),
    });

    if (!res.ok) {
      const text = await res.text();
      return { output: '', error: `Terminal server error: ${text}` };
    }

    const data = await res.json();
    let output = data.stdout || '';
    if (data.stderr) {
      output += (output ? '\n--- stderr ---\n' : '') + data.stderr;
    }

    if (output.length > sandbox.maxOutputLength) {
      output = output.slice(0, sandbox.maxOutputLength) + '\n\n[Output truncated]';
    }

    return {
      output: output || '(no output)',
      metadata: {
        exit_code: data.exit_code,
        shell: data.shell,
        duration_ms: data.duration_ms,
      },
    };
  } catch (e) {
    return {
      output: '',
      error: `Terminal connection failed. Is the terminal server running?\nStart it with: bun run server/terminal-server.ts\nError: ${e}`,
    };
  }
}
