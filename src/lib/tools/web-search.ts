import type { ToolResult } from './types';
import { getTerminalUrl } from '../config';



export async function webSearch(args: {
  query: string;
  max_results?: number;
}): Promise<ToolResult> {
  const { query, max_results = 5 } = args;

  try {
    const res = await fetch(`${getTerminalUrl()}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, max_results }),
    });

    if (!res.ok) {
      return { output: '', error: `Search proxy error: ${res.statusText}` };
    }

    const results: Array<{ title: string; url: string; snippet: string }> = await res.json();

    if (results.length === 0) {
      return { output: `No results found for: ${query}` };
    }

    const formatted = results
      .map(
        (r, i) =>
          `[${i + 1}] ${r.title}\n    ${r.url}\n    ${r.snippet}`
      )
      .join('\n\n');

    return {
      output: `Search results for "${query}":\n\n${formatted}`,
      metadata: { result_count: results.length, query },
    };
  } catch (e) {
    try {
      const q = encodeURIComponent(query);
      const r = await fetch(`https://api.duckduckgo.com/?q=${q}&format=json&no_html=1`, { signal: AbortSignal.timeout(6000) });
      if (r.ok) {
        const j = await r.json() as { RelatedTopics?: Array<{ Text?: string; FirstURL?: string }> };
        const topics = (j.RelatedTopics || []).slice(0, max_results).map((t, i) => `[${i + 1}] ${t.Text || ''}\n    ${t.FirstURL || ''}`).join('\n\n');
        if (topics) return { output: `Search (baked) for "${query}":\n\n${topics}` };
      }
    } catch {}
    return {
      output: '',
      error: `Search error: ${e}. Baked fallback failed. Run locally: bun run server/terminal-server.ts`,
    };
  }
}
