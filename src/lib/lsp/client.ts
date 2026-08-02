import type { LSPDiagnostic, LSPCompletionItem, LSPSymbolInfo } from './servers';
import { getLanguageForFile } from './servers';

const TERMINAL_SERVER = 'http://127.0.0.1:8081';

export interface LSPResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

/**
 * Request LSP analysis via the terminal server.
 * The terminal server acts as an LSP proxy — it manages actual language server processes
 * and forwards requests to them.
 */
async function lspRequest(endpoint: string, body: Record<string, unknown>): Promise<LSPResult> {
  try {
    const res = await fetch(`${TERMINAL_SERVER}/lsp/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      // LSP proxy not available — fall back to basic analysis
      return { success: false, error: 'LSP server not available' };
    }

    const data = await res.json();
    return { success: true, data };
  } catch {
    return { success: false, error: 'LSP server not available' };
  }
}

/** Get diagnostics (errors/warnings) for a file */
export async function getDiagnostics(
  filename: string,
  content: string
): Promise<LSPDiagnostic[]> {
  const language = getLanguageForFile(filename);
  if (!language) return [];

  const result = await lspRequest('diagnostics', {
    language,
    filename,
    content,
  });

  if (!result.success || !result.data) {
    // Fallback: basic syntax check via terminal
    return basicSyntaxCheck(filename, content);
  }

  return (result.data as { diagnostics: LSPDiagnostic[] }).diagnostics || [];
}

/** Get completion suggestions */
export async function getCompletions(
  filename: string,
  content: string,
  line: number,
  character: number
): Promise<LSPCompletionItem[]> {
  const language = getLanguageForFile(filename);
  if (!language) return [];

  const result = await lspRequest('completion', {
    language,
    filename,
    content,
    position: { line, character },
  });

  if (!result.success || !result.data) return [];

  return (result.data as { items: LSPCompletionItem[] }).items || [];
}

/** Get document symbols (functions, classes, variables) */
export async function getSymbols(
  filename: string,
  content: string
): Promise<LSPSymbolInfo[]> {
  const language = getLanguageForFile(filename);
  if (!language) return [];

  const result = await lspRequest('symbols', {
    language,
    filename,
    content,
  });

  if (!result.success || !result.data) {
    return basicSymbolExtraction(filename, content);
  }

  return (result.data as { symbols: LSPSymbolInfo[] }).symbols || [];
}

/** Format code using LSP formatter */
export async function formatCode(
  filename: string,
  content: string
): Promise<string | null> {
  const language = getLanguageForFile(filename);
  if (!language) return null;

  const result = await lspRequest('format', {
    language,
    filename,
    content,
  });

  if (!result.success || !result.data) return null;

  return (result.data as { content: string }).content || null;
}

/** Basic syntax check fallback when LSP is not available */
function basicSyntaxCheck(_filename: string, content: string): LSPDiagnostic[] {
  const diagnostics: LSPDiagnostic[] = [];
  const lines = content.split('\n');

  // Check for common issues
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Unclosed strings
    const quotes = (line.match(/"/g) || []).length;
    if (quotes % 2 !== 0) {
      diagnostics.push({
        range: { start: { line: i, character: 0 }, end: { line: i, character: line.length } },
        severity: 1,
        source: 'basic-check',
        message: 'Possible unclosed string literal',
      });
    }

    // TODO/FIXME markers
    if (line.includes('TODO') || line.includes('FIXME')) {
      diagnostics.push({
        range: { start: { line: i, character: 0 }, end: { line: i, character: line.length } },
        severity: 3,
        source: 'basic-check',
        message: line.includes('TODO') ? 'TODO comment found' : 'FIXME comment found',
      });
    }
  }

  return diagnostics;
}

/** Basic symbol extraction fallback */
function basicSymbolExtraction(filename: string, content: string): LSPSymbolInfo[] {
  const symbols: LSPSymbolInfo[] = [];
  const lines = content.split('\n');
  const ext = filename.split('.').pop() || '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // TypeScript/JavaScript
    if (['ts', 'tsx', 'js', 'jsx'].includes(ext)) {
      if (/^(export\s+)?(async\s+)?function\s+(\w+)/.test(line)) {
        const match = line.match(/function\s+(\w+)/);
        if (match) {
          symbols.push({
            name: match[1],
            kind: 12, // Function
            location: { uri: filename, range: { start: { line: i, character: 0 }, end: { line: i, character: line.length } } },
          });
        }
      }
      if (/^(export\s+)?(class)\s+(\w+)/.test(line)) {
        const match = line.match(/class\s+(\w+)/);
        if (match) {
          symbols.push({
            name: match[1],
            kind: 5, // Class
            location: { uri: filename, range: { start: { line: i, character: 0 }, end: { line: i, character: line.length } } },
          });
        }
      }
    }

    // Python
    if (ext === 'py') {
      if (/^(def|async def)\s+(\w+)/.test(line)) {
        const match = line.match(/(?:async\s+)?def\s+(\w+)/);
        if (match) {
          symbols.push({
            name: match[1],
            kind: 12,
            location: { uri: filename, range: { start: { line: i, character: 0 }, end: { line: i, character: line.length } } },
          });
        }
      }
      if (/^class\s+(\w+)/.test(line)) {
        const match = line.match(/class\s+(\w+)/);
        if (match) {
          symbols.push({
            name: match[1],
            kind: 5,
            location: { uri: filename, range: { start: { line: i, character: 0 }, end: { line: i, character: line.length } } },
          });
        }
      }
    }

    // Rust
    if (ext === 'rs') {
      if (/^(pub\s+)?(fn|async fn)\s+(\w+)/.test(line)) {
        const match = line.match(/fn\s+(\w+)/);
        if (match) {
          symbols.push({
            name: match[1],
            kind: 12,
            location: { uri: filename, range: { start: { line: i, character: 0 }, end: { line: i, character: line.length } } },
          });
        }
      }
    }
  }

  return symbols;
}
