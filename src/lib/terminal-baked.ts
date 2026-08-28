export interface BakedResult {
  stdout: string;
  stderr?: string;
  exit_code: number;
}

const FORTUNES = [
  "The runes favor the bold.",
  "Digital artifacts are but echoes of the void.",
  "In Zig we trust, in C we must.",
  "Stability is an illusion, but we build it anyway.",
  "Nordic winds bring swift performance.",
];

export async function bakedExec(command: string): Promise<BakedResult> {
  const cmd = command.trim();
  const lower = cmd.toLowerCase();

  if (!lower) return { stdout: '', exit_code: 0 };

  if (lower === 'help') {
    return {
      stdout: [
        'Available (baked) commands — static hosting, no sidecar:',
        '  help               Show this help',
        '  ls                 List chats / artifacts',
        '  date               Show temporal coordinates',
        '  whoami             Current identity',
        '  neofetch           System summary',
        '  fortune            Runic wisdom',
        '  clear              Clear (handled by UI)',
        '  cat <file>         Try fetch /logs/<file>',
        '  echo <text>        Echo text',
        '  pwd                Show virtual path',
        '  uname -a           Kernel info',
        '',
        'Real exec (ls -la, python3 -c, etc.) requires sidecar:',
        '  bun run server/terminal-server.ts  → http://127.0.0.1:8081',
        '  In prod (Firebase static) sidecar is not hosted — use local dev for real exec.',
      ].join('\n'),
      exit_code: 0,
    };
  }
  if (lower === 'ls' || lower === 'ls -la' || lower.startsWith('ls ')) {
    return { stdout: 'Artifacts:\n  chats\n  memories\n  profile\n  verz.nx.kg:9972 (llama)\n  127.0.0.1:8081 (sidecar, local only)', exit_code: 0 };
  }
  if (lower === 'pwd') return { stdout: '/vz/llamacpp-ui', exit_code: 0 };
  if (lower === 'whoami') return { stdout: 'guest@vz-ai • Veridian Zenith', exit_code: 0 };
  if (lower === 'date') return { stdout: new Date().toString(), exit_code: 0 };
  if (lower === 'uname -a' || lower === 'uname') return { stdout: 'Linux verz 6.8.0-zenith #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux', exit_code: 0 };
  if (lower === 'neofetch') {
    return {
      stdout: [
        '  /\\   OS: Veridian Zenith OS (static)',
        ' /  \\  Host: vz-ai.web.app',
        '/____\\ Uptime: ephemeral',
        '|    | Shell: baked-sh',
        '|    | Llama: verz.nx.kg:9972',
      ].join('\n'),
      exit_code: 0,
    };
  }
  if (lower === 'fortune') {
    return { stdout: FORTUNES[Math.floor(Math.random() * FORTUNES.length)], exit_code: 0 };
  }
  if (lower.startsWith('echo ')) {
    return { stdout: cmd.slice(5), exit_code: 0 };
  }
  if (lower.startsWith('cat ')) {
    const file = cmd.split(/\s+/)[1];
    try {
      const res = await fetch(`/logs/${file}`);
      if (res.ok) {
        const txt = await res.text();
        return { stdout: txt.slice(0, 8000), exit_code: 0 };
      }
      return { stdout: '', stderr: `cat: ${file}: No such file (baked)`, exit_code: 1 };
    } catch (e) {
      return { stdout: '', stderr: `cat: ${String(e)}`, exit_code: 1 };
    }
  }

  // Fallback: sidecar not available in static hosting
  return {
    stdout: '',
    stderr: `baked-sh: ${cmd.split(' ')[0]}: command not found (static hosting)\nRun locally for real exec: bun run start → http://127.0.0.1:8081`,
    exit_code: 127,
  };
}
