import { mkdir, writeFile, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { dirname } from 'path';
import sanitizeHtml from 'sanitize-html';
import { convert } from 'html-to-text';

const PORT = 8081;

interface ExecRequest {
  command: string;
  shell?: 'bash' | 'fish' | 'auto';
  cwd?: string;
  timeout?: number;
}

function detectShell(): string {
  const shell = process.env.SHELL || '/bin/bash';
  if (shell.includes('fish')) return 'fish';
  return 'bash';
}

async function execCommand(req: ExecRequest): Promise<{
  stdout: string;
  stderr: string;
  exit_code: number;
  shell: string;
  duration_ms: number;
}> {
  const start = Date.now();
  let shell = req.shell === 'auto' || !req.shell ? detectShell() : req.shell;
  const timeout = req.timeout || 30000;

  const proc = Bun.spawn([shell, '-c', req.command], {
    cwd: req.cwd || process.cwd(),
    stdout: 'pipe',
    stderr: 'pipe',
    env: { ...process.env, TERM: 'xterm-256color' },
  });

  const timeoutId = setTimeout(() => {
    proc.kill();
  }, timeout);

  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  const exitCode = await proc.exited;
  clearTimeout(timeoutId);

  return {
    stdout,
    stderr,
    exit_code: exitCode,
    shell,
    duration_ms: Date.now() - start,
  };
}

async function handleRead(path: string, offset: number, limit: number): Promise<string> {
  try {
    const content = await readFile(path, 'utf-8');
    const lines = content.split('\n');
    return lines.slice(offset, offset + limit).join('\n');
  } catch (e) {
    throw new Error(`Cannot read ${path}: ${e}`);
  }
}

async function handleWrite(path: string, content: string): Promise<string> {
  const dir = dirname(path);
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
  await writeFile(path, content, 'utf-8');
  return `Written ${content.length} bytes to ${path}`;
}

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

async function proxySearch(query: string, maxResults: number): Promise<SearchResult[]> {
  const encoded = encodeURIComponent(query);
  const res = await fetch(`https://html.duckduckgo.com/html/?q=${encoded}`, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      Accept: 'text/html,application/xhtml+xml',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });

  if (!res.ok) return [];

  const html = await res.text();
  if (html.includes('anomaly-modal') || html.includes('challenge')) return [];

  const results: SearchResult[] = [];
  const linkRegex = /class="result__a"[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/g;
  let match;
  let count = 0;

  while ((match = linkRegex.exec(html)) !== null && count < maxResults) {
    let url = match[1];
    const title = convert(match[2], { wordwrap: false }).trim();

    if (url.includes('uddg=')) {
      const uddg = url.match(/uddg=([^&]+)/);
      if (uddg) url = decodeURIComponent(uddg[1]);
    }

    const blockStart = Math.max(0, match.index - 2000);
    const block = html.slice(blockStart, match.index + 500);
    const snippetMatch = block.match(/class="result__snippet"[^>]*>([\s\S]*?)<\/a>/);
    const snippet = snippetMatch
      ? convert(snippetMatch[1], { wordwrap: false }).trim()
      : '';

    if (title || url) {
      results.push({ title, url, snippet });
      count++;
    }
  }

  return results;
}

async function proxyFetch(targetUrl: string, maxLength: number): Promise<{ content: string; title?: string; error?: string }> {
  try {
    new URL(targetUrl);
  } catch {
    return { content: '', error: `Invalid URL: ${targetUrl}` };
  }

  try {
    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(15000),
      redirect: 'follow',
    });

    if (!res.ok) {
      return { content: '', error: `Fetch failed: ${res.status} ${res.statusText}` };
    }

    const contentType = res.headers.get('content-type') || '';
    const body = await res.text();

    // Plain text / JSON / markdown - return as-is
    if (
      contentType.includes('text/plain') ||
      contentType.includes('application/json') ||
      contentType.includes('text/markdown') ||
      targetUrl.match(/\.(md|txt|json|jsonl|csv)$/i)
    ) {
      const content = body.length > maxLength ? body.slice(0, maxLength) + '\n[Truncated]' : body;
      return { content };
    }

    // HTML - extract meaningful content
    // Remove scripts, styles, nav, header, footer, aside
    let html = sanitizeHtml(body, {
      allowedTags: ['main', 'article', 'section', 'div', 'body', 'title', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'a', 'ul', 'li', 'ol', 'table', 'tr', 'td', 'th', 'thead', 'tbody', 'em', 'strong'],
      allowedAttributes: { '*': ['class'] },
      exclusiveFilter: {
        script: () => true,
        style: () => true,
        noscript: () => true,
        nav: () => true,
        header: () => true,
        footer: () => true,
        aside: () => true,
      },
    });

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? convert(titleMatch[1], { wordwrap: false }).trim() : '';

    // Try semantic content containers first (like odysseus)
    const semanticPatterns = [
      /<(?:main|article|section)[^>]*>([\s\S]*?)<\/(?:main|article|section)>/gi,
      /<div[^>]*class="[^"]*(?:content|main|body|article|post|entry|text)[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    ];

    let mainContent = '';
    for (const pattern of semanticPatterns) {
      let match;
      while ((match = pattern.exec(html)) !== null) {
        const text = convert(match[1], { wordwrap: false }).replace(/\s+/g, ' ').trim();
        if (text.length > mainContent.length) {
          mainContent = text;
        }
      }
      if (mainContent.length > 600) break;
    }

    // Fallback to body text
    if (mainContent.length < 600) {
      const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      if (bodyMatch) {
        mainContent = convert(bodyMatch[1], { wordwrap: false }).replace(/\s+/g, ' ').trim();
      }
    }

    // Last resort: strip all tags
    if (!mainContent) {
      mainContent = convert(html, { wordwrap: false }).replace(/\s+/g, ' ').trim();
    }

    // Prepend title
    const output = title ? `# ${title}\n\n${mainContent}` : mainContent;
    const content = output.length > maxLength ? output.slice(0, maxLength) + '\n[Truncated]' : output;
    return { content, title };
  } catch (e) {
    return { content: '', error: `Fetch error: ${e}` };
  }
}

Bun.serve({
  port: PORT,
  async fetch(req) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(req.url);

    // Allow GET for health check
    if (req.method === 'GET' && url.pathname === '/health') {
      return Response.json({ status: 'ok' }, { headers: corsHeaders });
    }

    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }

    try {
      if (url.pathname === '/exec') {
        const body = (await req.json()) as ExecRequest;
        const result = await execCommand(body);
        return Response.json(result, { headers: corsHeaders });
      }

      if (url.pathname === '/read') {
        const body = (await req.json()) as { path: string; offset?: number; limit?: number };
        const content = await handleRead(body.path, body.offset || 0, body.limit || 200);
        return Response.json({ content }, { headers: corsHeaders });
      }

      if (url.pathname === '/write') {
        const body = (await req.json()) as { path: string; content: string };
        const message = await handleWrite(body.path, body.content);
        return Response.json({ message }, { headers: corsHeaders });
      }

      if (url.pathname === '/search') {
        const body = (await req.json()) as { query: string; max_results?: number };
        const results = await proxySearch(body.query, body.max_results || 5);
        return Response.json(results, { headers: corsHeaders });
      }

      if (url.pathname === '/fetch') {
        const body = (await req.json()) as { url: string; max_length?: number };
        const content = await proxyFetch(body.url, body.max_length || 10000);
        return Response.json(content, { headers: corsHeaders });
      }

      if (url.pathname === '/health') {
        return Response.json({ status: 'ok' }, { headers: corsHeaders });
      }

      return new Response('Not found', { status: 404, headers: corsHeaders });
    } catch (e) {
      return Response.json({ error: String(e) }, { status: 500, headers: corsHeaders });
    }
  },
});

console.log(`Terminal server running on http://127.0.0.1:${PORT}`);
console.log(`Shell: ${detectShell()}`);
