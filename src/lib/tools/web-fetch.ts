import type { ToolResult } from './types';

const PROXY_URL = 'http://127.0.0.1:8081';

export async function webFetch(args: {
  url: string;
  format?: 'text' | 'markdown' | 'html';
  max_length?: number;
}): Promise<ToolResult> {
  const { url: targetUrl, max_length = 10000 } = args;

  try {
    new URL(targetUrl);
  } catch {
    return { output: '', error: `Invalid URL: ${targetUrl}` };
  }

  try {
    const res = await fetch(`${PROXY_URL}/fetch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: targetUrl, max_length }),
    });

    if (!res.ok) {
      return { output: '', error: `Fetch proxy error: ${res.statusText}` };
    }

    const data: { content: string; error?: string } = await res.json();

    if (data.error) {
      return { output: '', error: data.error };
    }

    return {
      output: `Content from ${targetUrl}:\n\n${data.content}`,
      metadata: { url: targetUrl, length: data.content.length },
    };
  } catch (e) {
    return {
      output: '',
      error: `Fetch error: ${e}. Is the terminal server running? (bun run server/terminal-server.ts)`,
    };
  }
}
