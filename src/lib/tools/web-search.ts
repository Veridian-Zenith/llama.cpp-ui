import type { ToolResult } from './types';

const PROXY_URL = 'http://127.0.0.1:8081';

export async function webSearch(args: {
  query: string;
  max_results?: number;
}): Promise<ToolResult> {
  const { query, max_results = 5 } = args;

  try {
    const res = await fetch(`${PROXY_URL}/search`, {
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
    return {
      output: '',
      error: `Search error: ${e}. Is the terminal server running? (bun run server/terminal-server.ts)`,
    };
  }
}
