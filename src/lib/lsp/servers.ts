export interface LSPServer {
  id: string;
  name: string;
  command: string;
  args: string[];
  languages: string[];
  enabled: boolean;
}

export interface LSPDiagnostic {
  range: {
    start: { line: number; character: number };
    end: { line: number; character: number };
  };
  severity: 1 | 2 | 3 | 4;
  source: string;
  message: string;
}

export interface LSPCompletionItem {
  label: string;
  kind: number;
  detail?: string;
  documentation?: string;
  insertText?: string;
}

export interface LSPSymbolInfo {
  name: string;
  kind: number;
  location: {
    uri: string;
    range: {
      start: { line: number; character: number };
      end: { line: number; character: number };
    };
  };
}

export const DEFAULT_SERVERS: LSPServer[] = [
  {
    id: 'typescript',
    name: 'TypeScript',
    command: 'typescript-language-server',
    args: ['--stdio'],
    languages: ['typescript', 'typescriptreact', 'javascript', 'javascriptreact'],
    enabled: true,
  },
  {
    id: 'clangd',
    name: 'C/C++',
    command: 'clangd',
    args: ['--background-index', '--clang-tidy'],
    languages: ['c', 'cpp', 'objc', 'objcpp'],
    enabled: true,
  },
  {
    id: 'pyright',
    name: 'Python',
    command: 'pyright-langserver',
    args: ['--stdio'],
    languages: ['python'],
    enabled: true,
  },
  {
    id: 'rust-analyzer',
    name: 'Rust',
    command: 'rust-analyzer',
    args: [],
    languages: ['rust'],
    enabled: true,
  },
  {
    id: 'elixir-ls',
    name: 'Elixir',
    command: 'elixir-ls',
    args: [],
    languages: ['elixir', 'eelixir', 'heex'],
    enabled: true,
  },
  {
    id: 'kotlin-language-server',
    name: 'Kotlin',
    command: 'kotlin-language-server',
    args: [],
    languages: ['kotlin'],
    enabled: true,
  },
  {
    id: 'gopls',
    name: 'Go',
    command: 'gopls',
    args: [],
    languages: ['go'],
    enabled: true,
  },
  {
    id: 'julials',
    name: 'Julia',
    command: 'julia-language-server',
    args: [],
    languages: ['julia'],
    enabled: true,
  },
  {
    id: 'bashls',
    name: 'Bash',
    command: 'bash-language-server',
    args: [],
    languages: ['bash', 'sh', 'zsh'],
    enabled: true,
  },
  {
    id: 'html',
    name: 'HTML',
    command: 'html-languageserver',
    args: ['--stdio'],
    languages: ['html'],
    enabled: true,
  },
  {
    id: 'cssls',
    name: 'CSS',
    command: 'css-languageserver',
    args: ['--stdio'],
    languages: ['css', 'scss', 'less'],
    enabled: true,
  },
];

const LANG_MAP: Record<string, string> = {
  '.ts': 'typescript',
  '.tsx': 'typescriptreact',
  '.js': 'javascript',
  '.jsx': 'javascriptreact',
  '.c': 'c',
  '.cpp': 'cpp',
  '.h': 'c',
  '.hpp': 'cpp',
  '.py': 'python',
  '.rs': 'rust',
  '.ex': 'elixir',
  '.exs': 'elixir',
  '.eex': 'eelixir',
  '.heex': 'heex',
  '.kt': 'kotlin',
  '.kts': 'kotlin',
  '.go': 'go',
  '.jl': 'julia',
  '.sh': 'bash',
  '.bash': 'bash',
  '.zsh': 'bash',
  '.html': 'html',
  '.htm': 'html',
  '.css': 'css',
  '.scss': 'scss',
  '.less': 'less',
};

export function getLanguageForFile(filename: string): string | null {
  const ext = '.' + filename.split('.').pop();
  return LANG_MAP[ext] || null;
}

export function getServerForLanguage(language: string): LSPServer | undefined {
  return DEFAULT_SERVERS.find(
    (s) => s.enabled && s.languages.includes(language)
  );
}

/** Get all supported file extensions */
export function getSupportedExtensions(): string[] {
  return Object.keys(LANG_MAP);
}

/** Get all supported languages */
export function getSupportedLanguages(): string[] {
  return [...new Set(Object.values(LANG_MAP))];
}
