// Public host — Firebase static must hit verz.nx.kg:9972. Override locally via VITE_LLAMA_URL=http://127.0.0.1:8080
export const DEFAULT_LLAMA_URL = import.meta.env.VITE_LLAMA_URL || 'https://verz.nx.kg:9972';

export const DEFAULT_TERMINAL_URL = import.meta.env.VITE_TERMINAL_URL || 'http://127.0.0.1:8081';

// Terminal sidecar is local-only (bun run server/terminal-server.ts) — not hosted on verz.nx.kg.
// In production (Firebase static) terminal/file/search/fetch tools will gracefully fail with
// "Terminal server not available" — llama chat still works via verz.nx.kg:9972.
export function getTerminalUrl(): string {
  return import.meta.env.VITE_TERMINAL_URL || 'http://127.0.0.1:8081';
}
