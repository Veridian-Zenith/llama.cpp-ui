import type { ToolResult } from './types';
import { getTerminalUrl } from '../config';



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
    const res = await fetch(`${getTerminalUrl()}/fetch`, {
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
    try {
      const r = await fetch(targetUrl, { signal: AbortSignal.timeout(8000) });
      if (!r.ok) return { output: '', error: `Fetch error: ${e}. Baked direct fetch failed: ${r.status}` };
      let txt = await r.text();
      if (txt.length > max_length) txt = txt.slice(0, max_length) + '\n[truncated]';
      return { output: `Content from ${targetUrl} (baked):\n\n${txt}`, metadata: { url: targetUrl, length: txt.length } };
    } catch (err) {
      return {
        output: '',
        error: `Fetch error: ${e}. Baked fallback failed: ${err}`,
      };
    }
  }
}
